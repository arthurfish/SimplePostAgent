import {Effect, Context, Layer, Stream, Duration, Option, Chunk} from "effect";
import { LLMService } from "./llm";

// =================================================================
// 1. 非流式 API 辅助函数 (供 Plan 使用)
// =================================================================

/**
 * 一个通用的辅助函数，用于调用火山引擎大模型 API (非流式)。
 * @param messages - 发送给模型的对话消息列表
 * @param response_format - 可选，用于指定模型返回的格式 (例如 JSON)
 * @returns Effect.Effect<string, Error> - 返回模型的文本响应
 */
const callVolcanoAPI = (messages: object[], response_format?: object): Effect.Effect<string, Error> =>
    Effect.gen(function* () {
        const apiKey = process.env.ARK_API_KEY;
        if (!apiKey) {
            return yield* Effect.fail(new Error("ARK_API_KEY 环境变量未设置，请检查。"));
        }

        const body = {
            model: "doubao-seed-1-6-flash-250828", // 使用一个比较通用的模型
            messages,
            ...response_format,
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
            catch: (error) => new Error(`网络请求失败: ${error instanceof Error ? error.message : String(error)}`),
        });

        if (!response.ok) {
            const errorText = yield* Effect.promise(() => response.text());
            return yield* Effect.fail(new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`));
        }

        const json = (yield* Effect.promise(() => response.json())) as any;

        if (!json.choices || json.choices.length === 0 || !json.choices[0].message) {
            return yield* Effect.fail(new Error("API 返回了非预期的格式。"));
        }

        return json.choices[0].message.content;
    });

// =================================================================
// 2. 流式 API 辅助函数 (供 Execute 和 Aggregate 使用)
// =================================================================

/**
 * 调用火山引擎大模型流式 API，返回一个 token 增量流。
 */
const callVolcanoAPIStream = (messages: object[], response_format?: object): Stream.Stream<string, Error> =>
    Stream.unwrap(Effect.gen(function* () {
        const apiKey = process.env.ARK_API_KEY;
        if (!apiKey) {
            return yield* Effect.fail(new Error("ARK_API_KEY 环境变量未设置，请检查。"));
        }
        const body = {
            model: "doubao-seed-1-6-flash-250828",
            messages,
            stream: true,
            ...response_format,
        };
        const response = yield* Effect.tryPromise({
            try: () => fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify(body),
            }),
            catch: (error) => new Error(`网络请求失败: ${error instanceof Error ? error.message : String(error)}`),
        });
        if (!response.ok || !response.body) {
            const errorText = yield* Effect.promise(() => response.text());
            return yield* Effect.fail(new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`));
        }
        return Stream.fromReadableStream(() => response.body!, (e) => new Error(String(e)))
            .pipe(
                Stream.decodeText(),
                Stream.splitLines,
                Stream.map((line) => line.trim()),
                Stream.filter((line) => line.startsWith("data:")),
                Stream.map((line) => line.substring(5).trim()),
                Stream.filter((data) => data !== "[DONE]"),
                Stream.mapEffect((data) => Effect.try({
                    try: () => JSON.parse(data),
                    catch: () => new Error("无法解析流中的JSON数据块")
                })),
                Stream.map((json) => json.choices?.[0]?.delta?.content ?? ""),
                Stream.filter((content) => content.length > 0)
            );
    }));

/**
 * 通用的流式处理逻辑。
 */
const processStream = (
    apiStream: Stream.Stream<string, Error>,
    updateFn: (state: string) => Effect.Effect<void, never>
): Effect.Effect<string, Error> => Effect.gen(function*() {
    const fullTextStream = apiStream.pipe(
        Stream.mapAccum("", (accumulator, chunk) => {
            const newText = accumulator + chunk;
            return [newText, newText];
        })
    );
    const updateEffect = fullTextStream.pipe(
        Stream.throttle({duration: "1 second", cost: Chunk.size, units: 5, burst: 5, strategy: 'enforce'}), // 关键：每秒最多触发一次
        Stream.runForEach(updateFn)
    );
    const resultEffect = Stream.runLast(fullTextStream);
    const [, lastResultOption] = yield* Effect.all([
        Effect.fork(updateEffect),
        resultEffect
    ], { concurrency: 2 });
    return Option.getOrElse(lastResultOption, () => "");
});

// =================================================================
// 3. LLMService 的最终实现
// =================================================================

export const VolcanoLLM = Layer.succeed(LLMService, {
    // highlight-start
    // Planner: 使用【非流式】API 获取 JSON 结果 (已修正)
    plan: (input) => Effect.gen(function* () {
        yield* Effect.log(`[VolcanoLLM] Planning for: "${input}"`);

        const messages = [
            {
                role: "system",
                content: "根据用户的请求，将这个问题的回答划分为相关的子问题，分而治之进行解决。请严格按照指定的 JSON 格式返回计划。",
            },
            {
                role: "user",
                content: input,
            },
        ];

        const response_format = {
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "task_plan",
                    schema: {
                        type: "object",
                        properties: {
                            tasks: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string", description: "任务的简短标题" },
                                        prompt: { type: "string", description: "执行该任务所需的详细指令或问题" },
                                    },
                                    required: ["title", "prompt"],
                                },
                            },
                        },
                        required: ["tasks"],
                    },
                    strict: true,
                },
            },
        };

        // **关键**：调用非流式的 callVolcanoAPI
        const jsonString = yield* callVolcanoAPI(messages, response_format);

        const result = yield* Effect.try({
            try: () => JSON.parse(jsonString),
            catch: (error) => new Error(`解析 Plan 返回的 JSON 失败: ${error instanceof Error ? error.message : String(error)}`)
        });

        if (!result.tasks || !Array.isArray(result.tasks)) {
            return yield* Effect.fail(new Error("Plan 返回的 JSON 格式不正确，缺少 'tasks' 数组。"));
        }

        return result.tasks;
    }),
    // highlight-end

    // Executor: 使用【流式】API
    execute: (prompt, updateFn) => Effect.gen(function* () {
        yield* Effect.log(`[VolcanoLLM] Executing stream for: "${prompt}"`);
        const messages = [
            { role: "system", content: "请尽可能详细，深度的完成用户指定的任务。" },
            { role: "user", content: prompt },
        ];
        const apiStream = callVolcanoAPIStream(messages);
        return yield* processStream(apiStream, updateFn);
    }),

    // Aggregator: 使用【流式】API
    aggregate: (results, updateFn) => Effect.gen(function* () {
        yield* Effect.log(`[VolcanoLLM] Aggregating ${results.length} results in stream mode`);
        const combinedResults = results
            .map((r) => `## 任务: ${r.task_title}\n\n结果:\n${r.result_content}`)
            .join("\n\n---\n\n");
        const messages = [
            { role: "system", content: "你是一个报告撰写专家。请根据以下分步任务的结果，整合并生成一份清晰、连贯的最终综合报告。不要包含任务的原始标题和内容，而是将它们自然地融合到报告中。" },
            { role: "user", content: `请基于以下内容生成最终报告：\n\n${combinedResults}` },
        ];
        const apiStream = callVolcanoAPIStream(messages);
        return yield* processStream(apiStream, updateFn);
    }),
});