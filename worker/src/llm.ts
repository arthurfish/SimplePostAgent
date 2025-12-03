import { Effect, Context, Layer } from "effect";

export class LLMService extends Context.Tag("LLMService")<
    LLMService,
    {
        plan: (input: string) => Effect.Effect<any[], Error>;
        // Updated signatures
        execute: (
            prompt: string,
            updateFn?: (state: string) => Effect.Effect<void, never>
        ) => Effect.Effect<string, Error>;

        aggregate: (
            results: { task_title: string; result_content: string }[],
            updateFn?: (state: string) => Effect.Effect<void, never>
        ) => Effect.Effect<string, Error>;
    }
>() {}

// MockLLM implementation for testing/fallback
export const MockLLM = Layer.succeed(LLMService, {
    plan: (input) =>
        Effect.gen(function* () {
            yield* Effect.log(`[MockLLM] Planning for: "${input}"`);
            return [
                { title: "Step 1 (Mock)", prompt: `Research: ${input}` },
                { title: "Step 2 (Mock)", prompt: `Analyze: ${input}` },
            ];
        }),

    execute: (prompt, updateFn) =>
        Effect.gen(function* () {
            yield* Effect.log(`[MockLLM] Executing: "${prompt}"`);
            const parts = ["Thinking...", "Drafting...", "Refining...", "Done."];

            // Simulate streaming updates
            if (updateFn) {
                for (const part of parts) {
                    yield* Effect.sleep("500 millis");
                    yield* updateFn(part);
                }
            }
            return `Mock result for: ${prompt}`;
        }),

    aggregate: (results, updateFn) =>
        Effect.gen(function* () {
            yield* Effect.log(`[MockLLM] Aggregating ${results.length} results`);
            if (updateFn) yield* updateFn("Generating report...");
            yield* Effect.sleep("1 seconds");
            return "# Mock Final Report\n\nContent aggregated.";
        }),
});