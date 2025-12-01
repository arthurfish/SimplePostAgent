// src/llm.ts
import { Effect, Context, Layer, Schedule, Random } from "effect";

export class LLMService extends Context.Tag("LLMService")<
  LLMService,
  {
    plan: (input: string) => Effect.Effect<any[], Error>;
    execute: (prompt: string) => Effect.Effect<string, Error>;
    aggregate: (results: { task_title: string; result_content: string }[]) => Effect.Effect<string, Error>;
  }
>() {}

export const MockLLM = Layer.succeed(LLMService, {
  // Planner: 永远把任务拆成 3 个
  plan: (input) =>
    Effect.gen(function* () {
      yield* Effect.log(`[MockLLM] Planning for: "${input}"`);
      yield* Effect.sleep("1 seconds"); // 思考时间
      return [
        { title: "Step 1: Research", prompt: `Research: ${input}` },
        { title: "Step 2: Analysis", prompt: `Analyze: ${input}` },
        { title: "Step 3: Conclusion", prompt: `Conclude: ${input}` },
      ];
    }),

  // Executor: 模拟执行，带有随机失败
  execute: (prompt) =>
    Effect.gen(function* () {
      yield* Effect.log(`[MockLLM] Executing: "${prompt}"`);
      
      // 模拟 20% 的概率失败 (测试重试机制)
      if (Math.random() < 0.2) {
          yield* Effect.fail(new Error("Random API Failure (Simulated)"));
      }
      if (prompt.includes("poison")) {
          // 模拟一个非预期错误（Defect）
          yield* Effect.die(new Error("FATAL POISON PILL ERROR"));
      }
      yield* Effect.sleep("2 seconds"); // 模拟耗时
      return `Result for [${prompt}]: Lorem ipsum data...`;
    }),

  // Aggregator: 简单的文本拼接
  aggregate: (results) =>
    Effect.gen(function* () {
      yield* Effect.log(`[MockLLM] Aggregating ${results.length} results`);
      yield* Effect.sleep("1 seconds");
      const summary = results
        .map((r) => `## ${r.task_title}\n${r.result_content}`)
        .join("\n\n");
      return `# Final Report\n\n${summary}`;
    }),
});



