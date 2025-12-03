import { Context, Effect, Layer } from "effect";

// highlight-start
// 更新 LLMService 接口定义
// 为 execute 和 aggregate 方法添加 updateFn 回调函数，用于流式更新
export class LLMService extends Context.Tag("LLMService")<
    LLMService,
    {
        plan: (input: string) => Effect.Effect<any[], Error>;
        execute: (prompt: string, updateFn: (state: string) => Effect.Effect<void, never>) => Effect.Effect<string, Error>;
        aggregate: (results: { task_title: string; result_content: string }[], updateFn: ((state: string) => Effect.Effect<void, never>)) => Effect.Effect<string, Error>;
    }
>() {}
// highlight-end

export const MockLLM = Layer.succeed(LLMService, {
    // Planner: 保持不变，它不是流式的
    plan: (input) =>
        Effect.gen(function* () {
            yield* Effect.log(`[MockLLM] Planning for: "${input}"`);
            yield* Effect.sleep("1 seconds"); // 模拟思考时间
            return [
                { title: "Step 1: Research", prompt: `Research: ${input}` },
                { title: "Step 2: Analysis", prompt: `Analyze: ${input}` },
                { title: "Step 3: Conclusion", prompt: `Conclude: ${input}` },
            ];
        }),

    // highlight-start
    // Executor: 更新以匹配新接口，并模拟流式输出
    execute: (prompt, updateFn) =>
        Effect.gen(function* () {
            yield* Effect.log(`[MockLLM] Executing stream for: "${prompt}"`);

            // 模拟 20% 的概率失败 (用于测试重试机制)
            if (Math.random() < 0.2) {
                yield* Effect.fail(new Error("Random API Failure (Simulated)"));
            }
            if (prompt.includes("poison")) {
                // 模拟一个非预期错误（Defect），测试健壮性
                yield* Effect.die(new Error("FATAL POISON PILL ERROR"));
            }

            // 通过多次调用 updateFn 来模拟流式更新
            yield* Effect.sleep("500 millis");
            yield* updateFn(`Result for [${prompt}]: 第一部分...`);
            yield* Effect.sleep("500 millis");
            yield* updateFn(`Result for [${prompt}]: 第一部分... 第二部分...`);
            yield* Effect.sleep("500 millis");

            const finalResult = `Result for [${prompt}]: 第一部分... 第二部分... 最终完成.`;
            // 最终结果通过 return 返回，由 workflow 负责最终提交
            return finalResult;
        }),

    // Aggregator: 更新以匹配新接口，并模拟流式汇总
    aggregate: (results, updateFn) =>
        Effect.gen(function* () {
            yield* Effect.log(`[MockLLM] Aggregating ${results.length} results in stream mode`);

            // 模拟流式汇总过程
            yield* Effect.sleep("500 millis");
            yield* updateFn(`# 最终报告\n\n## 摘要生成中...\n...`);

            yield* Effect.sleep("500 millis");
            const summary = results
                .map((r) => `## ${r.task_title}\n${r.result_content}`)
                .join("\n\n");

            // 最终报告通过 return 返回
            return `# 最终报告\n\n${summary}`;
        }),
    // highlight-end
});