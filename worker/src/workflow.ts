import { Effect, Schedule, Cause } from "effect";
import { Database } from "./db";
import { LLMService } from "./llm";

// 辅助函数 handleJob 保持不变
const handleJob = <E>(
    jobId: string,
    taskName: string,
    logic: Effect.Effect<void, E, Database | LLMService>,
    onFail: (db: any, errorMsg: string) => Effect.Effect<void>
) =>
    Effect.gen(function* () {
        const db = yield* Database;
        const exit = yield* logic.pipe(Effect.exit);
        if (exit._tag === "Failure") {
            const errorMsg = Cause.pretty(exit.cause);
            yield* Effect.logError(`[${taskName}] Job ${jobId} CRASHED: ${errorMsg}`);
            yield* onFail(db, errorMsg);
        }
    });

// runPlanner 工作流保持不变
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
// 2. Executor Workflow (Robust) - 已更新
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
                    // highlight-start
                    // 定义 updateFn，它调用数据库的临时状态更新过程。
                    // 使用 Effect.catchAll 来忽略更新失败，这确保了即使中间某次更新出错，
                    // 也不会中断整个 LLM 的生成过程。
                    const updateFn = (currentState: string) =>
                        Effect.all([db.updateSubtaskTemporaryState(task.id, currentState).pipe(
                            Effect.catchAll(() => Effect.void) // 关键：忽略流式更新的错误
                        ), Effect.log(`instant update: ${currentState}`)]);

                    // 调用 llm.execute 并传入 updateFn
                    const result = yield* llm.execute(task.prompt_content, updateFn).pipe(
                        Effect.retry({
                            schedule: Schedule.exponential("500 millis").pipe(
                                Schedule.intersect(Schedule.recurs(3)) // 最多重试3次
                            ),
                        })
                    );
                    // highlight-end

                    // 最终结果提交保持不变，它负责将子任务状态更新为 'completed'
                    yield* db.submitSubTaskResult(task.id, result);
                    yield* Effect.log(`[Executor] Task ${task.id} done`);
                }),
                // 失败回调：这会触发数据库 Trigger，可能导致整个 Request 失败
                (db, msg) => db.markSubTaskFailed(task.id, msg)
            ),
        { concurrency: 20 }
    );
});

// ------------------------------------------------------------------
// 3. Aggregator Workflow (Robust) - 已更新
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
                    // highlight-start
                    // 同样为 aggregator 定义 updateFn，用于更新最终报告的中间状态
                    const updateFn = (currentState: string) =>
                        db.updateTemporaryFinalReport(job.id, currentState).pipe(
                            Effect.catchAll(() => Effect.void) // 同样忽略错误
                        );

                    const subTasks = yield* db.fetchCompletedSubTasks(job.id);

                    // 调用 llm.aggregate 并传入 updateFn
                    const report = yield* llm.aggregate(subTasks as any, updateFn);
                    // highlight-end

                    // 最终报告提交保持不变，它负责将主任务状态更新为 'completed'
                    yield* db.submitFinalReport(job.id, report);
                    yield* Effect.log(`[Aggregator] Report generated for ${job.id}`);
                }),
                (db, msg) => db.markRequestFailed(job.id, msg)
            ),
        { concurrency: 20 }
    );
});