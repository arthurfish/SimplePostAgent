import { Effect, Layer, Stream, Chunk, Ref } from "effect";
import { LLMService } from "./llm";

/**
 * Internal helper to handle the Volcano Engine streaming protocol.
 * Transforms a raw HTTP stream into a stream of accumulated text.
 */
const streamVolcanoCompletion = (messages: object[]) => {
    return Effect.gen(function* (_) {
        const apiKey = process.env.ARK_API_KEY;
        if (!apiKey) {
            return yield* Effect.fail(new Error("ARK_API_KEY env var not set"));
        }

        const body = {
            model: "doubao-seed-1-6-flash-250828",
            messages,
            stream: true, // Enable streaming
        };

        const response = yield* Effect.tryPromise({
            try: () => fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
            }),
            catch: (error) => new Error(`Network Request Failed: ${error}`),
        });

        if (!response.ok || !response.body) {
            const text = yield* Effect.promise(() => response.text());
            return yield* Effect.fail(new Error(`API Error ${response.status}: ${text}`));
        }

        // Convert the standard ReadableStream to an Effect Stream
        const stream = Stream.fromReadableStream(() => response.body!, (e) => new Error(String(e)));

        // Pipeline: Bytes -> Text -> Lines -> SSE Data -> JSON -> Content Delta -> Accumulated Full Text
        return stream.pipe(
            Stream.decodeText(),
            Stream.splitLines,
            Stream.filter((line) => line.startsWith("data: ")),
            Stream.map((line) => line.slice(6)), // Remove "data: " prefix
            Stream.filter((line) => line.trim() !== "[DONE]"),
            Stream.mapEffect((line) =>
                Effect.try({
                    try: () => JSON.parse(line),
                    catch: () => new Error(`JSON Parse Error: ${line}`)
                })
            ),
            // Extract content delta safely
            Stream.map((json: any) => json?.choices?.[0]?.delta?.content || ""),
            // Accumulate deltas into full text (Stateful map)
            Stream.mapAccum("", (acc, delta) => [acc + delta, acc + delta])
        );
    });
};

// Shared logic for Execute and Aggregate since both use streaming
const runStreamedLLM = (messages: object[], updateFn?: (state: string) => Effect.Effect<void, never>) =>
    Effect.gen(function* () {
        // 1. Create the source stream
        const sourceStream = yield* streamVolcanoCompletion(messages);

        // 2. Create a Ref to hold the final result (because throttle might drop the very last frame)
        const finalResultRef = yield* Ref.make("");

        // 3. Build the pipeline
        const streamProgram = sourceStream.pipe(
            // Capture every single update into Ref, ensuring we have the total result at the end
            Stream.tap((text) => Ref.set(finalResultRef, text)),
            // Apply Throttling: Max 1 element per 1 second. Strategy 'enforce' drops excess elements.
            Stream.throttle({
                cost: () => 1,
                units: 1,
                duration: "1 seconds",
                strategy: "enforce",
            }),
            // Run the side-effect (DB update) if provided
            Stream.runForEach((text) => {
                if (updateFn) {
                    return updateFn(text);
                }
                return Effect.void;
            })
        );

        // 4. Execute the stream
        yield* streamProgram;

        // 5. Return the full accumulated text
        return yield* Ref.get(finalResultRef);
    });


export const VolcanoLLM = Layer.succeed(LLMService, {
    plan: (input) => Effect.gen(function* () {
        // Planner is NOT streaming, keeps original logic (omitted for brevity, same as before)
        // Use the non-streaming API for JSON mode usually, or just wait for stream end.
        // For simplicity here, we assume the previous non-streaming logic or a simple await.
        // ... (Use Phase 1 non-streaming logic here) ...

        // Just a placeholder to keep it compiling with the strategy logic
        yield* Effect.log(`[VolcanoLLM] Planning for: "${input}"`);
        const apiKey = process.env.ARK_API_KEY!;
        const body = {
            model: "doubao-seed-1-6-flash-250828",
            messages: [
                { role: "system", content: "Split this into tasks. Return JSON with 'tasks' array." },
                { role: "user", content: input }
            ],
            response_format: { type: "json_object" } // Pseudo-code for JSON mode
        };
        // ... Implementation would use standard non-streaming fetch here ...
        return [{ title: "Manual Plan", prompt: input }]; // Stub
    }),

    execute: (prompt, updateFn) =>
        Effect.gen(function* () {
            yield* Effect.log(`[VolcanoLLM] Executing Stream: "${prompt.slice(0, 20)}..."`);
            const messages = [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt },
            ];
            return yield* runStreamedLLM(messages, updateFn);
        }),

    aggregate: (results, updateFn) =>
        Effect.gen(function* () {
            yield* Effect.log(`[VolcanoLLM] Aggregating Stream...`);
            const combined = results.map(r => `## ${r.task_title}\n${r.result_content}`).join("\n\n");
            const messages = [
                { role: "system", content: "Summarize the following reports." },
                { role: "user", content: combined },
            ];
            return yield* runStreamedLLM(messages, updateFn);
        }),
});