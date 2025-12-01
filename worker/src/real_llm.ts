// src/llm.ts
import { Effect, Context, Layer } from "effect";

// 保持这个 Service Tag 接口不变，这是我们对外的契约
export class LLMService extends Context.Tag("LLMService")<
    LLMService,
    {
        plan: (input: string) => Effect.Effect<any[], Error>;
        execute: (prompt: string) => Effect.Effect<string, Error>;
        aggregate: (results: { task_title: string; result_content: string }[]) => Effect.Effect<string, Error>;
    }
>() {}

/**
 * 一个通用的辅助函数，用于调用火山引擎大模型 API
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

        // 检查返回的数据结构是否符合预期
        if (!json.choices || json.choices.length === 0 || !json.choices[0].message) {
            return yield* Effect.fail(new Error("API 返回了非预期的格式。"));
        }

        return json.choices[0].message.content;
    });

// 这是 LLMService 的真实火山引擎实现
export const VolcanoLLM = Layer.succeed(LLMService, {
    // Planner: 调用模型，让它把任务拆解成 JSON 格式的步骤
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

        // 定义我们期望模型返回的 JSON 结构
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

        // 调用 API 并期望返回一个 JSON 字符串
        const jsonString = yield* callVolcanoAPI(messages, response_format);


        // 解析 JSON 字符串
        const result = yield* Effect.try({
            try: () => JSON.parse(jsonString),
            catch: (error) => new Error(`解析 Plan 返回的 JSON 失败: ${error instanceof Error ? error.message : String(error)}`)
        }).pipe(
            //Effect.tap(x => console.log(x))
        );

        // 从解析后的结果中提取 tasks 数组
        if (!result.tasks || !Array.isArray(result.tasks)) {
            return yield* Effect.fail(new Error("Plan 返回的 JSON 格式不正确，缺少 'tasks' 数组。"));
        }

        return result.tasks;
    }),

    // Executor: 直接执行一个 prompt，返回文本结果
    execute: (prompt) => Effect.gen(function* () {
        yield* Effect.log(`[VolcanoLLM] Executing: "${prompt}"`);

        const messages = [
            {
                role: "system",
                content: "请尽可能详细，深度的完成用户指定的任务。",
            },
            {
                role: "user",
                content: prompt,
            },
        ];

        return yield* callVolcanoAPI(messages);
    }),

    // Aggregator: 将多个任务的结果汇总成一份最终报告
    aggregate: (results) => Effect.gen(function* () {
        yield* Effect.log(`[VolcanoLLM] Aggregating ${results.length} results`);

        // 将所有子任务的结果格式化成一个大的 prompt
        const combinedResults = results
            .map((r) => `## 任务: ${r.task_title}\n\n结果:\n${r.result_content}`)
            .join("\n\n---\n\n");

        const messages = [
            {
                role: "system",
                content: "你是一个报告撰写专家。请根据以下分步任务的结果，整合并生成一份清晰、连贯的最终综合报告。不要包含任务的原始标题和内容，而是将它们自然地融合到报告中。",
            },
            {
                role: "user",
                content: `请基于以下内容生成最终报告：\n\n${combinedResults}`,
            },
        ];

        return yield* callVolcanoAPI(messages);
    }),
});