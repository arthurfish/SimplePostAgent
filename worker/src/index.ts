// src/index.ts
import { Effect, Schedule, Layer } from "effect";
import { NodeRuntime } from "@effect/platform-node";
import { DatabaseLive } from "./db";
import { VolcanoLLM } from "./real_llm";
import {MockLLM} from "./llm"
import { runPlanner, runExecutor, runAggregator } from "./workflow";

// 主循环策略
const schedulePolicy = Schedule.spaced("1 seconds"); // 每秒轮询一次

const mainLoop = Effect.gen(function* () {
  yield* Effect.log("🚀 SimplePostAgent Worker Started");

  // 我们可以让三个 Loop 并行运行，互不阻塞
  const plannerLoop = runPlanner.pipe(Effect.repeat(schedulePolicy));
  const executorLoop = runExecutor.pipe(Effect.repeat(schedulePolicy));
  const aggregatorLoop = runAggregator.pipe(Effect.repeat(schedulePolicy));

  // 组合并运行 (永远不会结束，除非被 Kill)
  yield* Effect.all([plannerLoop, executorLoop, aggregatorLoop], { concurrency: "unbounded" });
});

// 依赖注入
const program = mainLoop.pipe(
  Effect.provide(DatabaseLive),
  Effect.provide(VolcanoLLM)
);

NodeRuntime.runMain(program);
