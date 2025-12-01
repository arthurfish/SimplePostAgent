// worker/src/workflow.ts
import { Effect, Schedule, pipe, Cause } from "effect";
import { Database } from "./db";
import { LLMService } from "./real_llm";

// 辅助函数：处理单个 Job 的生命周期，确保它要么成功，要么被标记为 Failed
const handleJob = <E>(
  jobId: string,
  taskName: string,
  logic: Effect.Effect<void, E, Database | LLMService>,
  onFail: (db: any, errorMsg: string) => Effect.Effect<void>
) =>
  Effect.gen(function* () {
    const db = yield* Database;

    // 运行业务逻辑，捕获所有可能的错误（包括缺陷 Defect）
    const exit = yield* logic.pipe(Effect.exit);

    if (exit._tag === "Failure") {
      // 解析错误信息
      const errorMsg = Cause.pretty(exit.cause);
      yield* Effect.logError(`[${taskName}] Job ${jobId} CRASHED: ${errorMsg}`);
      
      // ★★★ 关键点：写入数据库失败状态，打破死循环 ★★★
      // 这里如果不成功（比如数据库挂了），我们也无能为力，只能让它 crash
      yield* onFail(db, errorMsg);
    }
  });

// ------------------------------------------------------------------
// 1. Planner Workflow (Robust)
// ------------------------------------------------------------------
export const runPlanner = Effect.gen(function* () {
  const db = yield* Database;
  const llm = yield* LLMService;

  const jobs = yield* db.fetchPendingRequests();
  if (jobs.length === 0) return;

  yield* Effect.forEach(
    jobs,
    (job) =>
      handleJob(
        job.id,
        "Planner",
        Effect.gen(function* () {
          const plan = yield* llm.plan(job.user_input);
          yield* db.submitPlan(job.id, plan);
          yield* Effect.log(`[Planner] Plan submitted for ${job.id}`);
        }),
        // 失败回调
        (db, msg) => db.markRequestFailed(job.id, msg)
      ),
    { concurrency: 5 }
  );
});

// ------------------------------------------------------------------
// 2. Executor Workflow (Robust)
// ------------------------------------------------------------------
export const runExecutor = Effect.gen(function* () {
  const db = yield* Database;
  const llm = yield* LLMService;

  const tasks = yield* db.fetchPendingSubTasks();
  if (tasks.length === 0) return;

  yield* Effect.forEach(
    tasks,
    (task) =>
      handleJob(
        task.id,
        "Executor",
        Effect.gen(function* () {
          // 这里可以是更复杂的重试逻辑
          const result = yield* llm.execute(task.prompt_content).pipe(
            Effect.retry({
              schedule: Schedule.exponential("500 millis").pipe(
                Schedule.intersect(Schedule.recurs(3)) // 最多重试3次
              ),
            })
          );
          yield* db.submitSubTaskResult(task.id, result);
          yield* Effect.log(`[Executor] Task ${task.id} done`);
        }),
        // 失败回调：这会触发数据库 Trigger，导致整个 Request 失败
        (db, msg) => db.markSubTaskFailed(task.id, msg)
      ),
    { concurrency: 20 }
  );
});

// ------------------------------------------------------------------
// 3. Aggregator Workflow (Robust)
// ------------------------------------------------------------------
export const runAggregator = Effect.gen(function* () {
  const db = yield* Database;
  const llm = yield* LLMService;

  const jobs = yield* db.fetchAggregatingRequests();
  if (jobs.length === 0) return;

  yield* Effect.forEach(
    jobs,
    (job) =>
      handleJob(
        job.id,
        "Aggregator",
        Effect.gen(function* () {
          const subTasks = yield* db.fetchCompletedSubTasks(job.id);
          const report = yield* llm.aggregate(subTasks as any);
          yield* db.submitFinalReport(job.id, report);
          yield* Effect.log(`[Aggregator] Report generated for ${job.id}`);
        }),
        (db, msg) => db.markRequestFailed(job.id, msg)
      ),
    { concurrency: 2 }
  );
});
