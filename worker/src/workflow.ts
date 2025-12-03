import { Effect, Schedule, Cause } from "effect";
import { Database } from "./db";
import { LLMService } from "./llm"; // Or ./llm for the interface

// Helper remains similar, but we focus on the logic inside the flows
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

// 1. Planner (No changes to streaming usually)
export const runPlanner = Effect.gen(function* () {
    const db = yield* Database;
    const llm = yield* LLMService;
    const jobs = yield* db.fetchPendingRequests();
    if (jobs.length === 0) return;

    yield* Effect.forEach(jobs, (job) =>
            handleJob(job.id, "Planner", Effect.gen(function* () {
                    const plan = yield* llm.plan(job.user_input);
                    yield* db.submitPlan(job.id, plan);
                }),
                (db, msg) => db.markRequestFailed(job.id, msg)
            ),
        { concurrency: 5 }
    );
});

// 2. Executor (Injects Update Function)
export const runExecutor = Effect.gen(function* () {
    const db = yield* Database;
    const llm = yield* LLMService;
    const tasks = yield* db.fetchPendingSubTasks();
    if (tasks.length === 0) return;

    yield* Effect.forEach(tasks, (task) =>
            handleJob(task.id, "Executor", Effect.gen(function* () {
                    // Define the update callback
                    // Important: Catch errors here so a DB glitch doesn't crash the generation
                    const onUpdate = (partialContent: string) =>
                        db.updateSubtaskTemporaryState(task.id, partialContent).pipe(
                            Effect.catchAll(err => Effect.logWarning(`Failed to update temp state: ${err}`))
                        );

                    // Pass onUpdate to execute
                    const result = yield* llm.execute(task.prompt_content, onUpdate).pipe(
                        // Retry logic applies to the whole generation process
                        Effect.retry({ schedule: Schedule.exponential("500 millis").pipe(Schedule.intersect(Schedule.recurs(3))) })
                    );

                    // Final consistency commit
                    yield* db.submitSubTaskResult(task.id, result);
                }),
                (db, msg) => db.markSubTaskFailed(task.id, msg)
            ),
        { concurrency: 20 }
    );
});

// 3. Aggregator (Injects Update Function)
export const runAggregator = Effect.gen(function* () {
    const db = yield* Database;
    const llm = yield* LLMService;
    const jobs = yield* db.fetchAggregatingRequests();
    if (jobs.length === 0) return;

    yield* Effect.forEach(jobs, (job) =>
            handleJob(job.id, "Aggregator", Effect.gen(function* () {
                    const subTasks = yield* db.fetchCompletedSubTasks(job.id);

                    const onUpdate = (partialReport: string) =>
                        db.updateTemporaryFinalReport(job.id, partialReport).pipe(
                            Effect.catchAll(err => Effect.logWarning(`Failed to update temp report: ${err}`))
                        );

                    // Pass onUpdate to aggregate
                    const report = yield* llm.aggregate(subTasks as any, onUpdate);

                    // Final consistency commit
                    yield* db.submitFinalReport(job.id, report);
                }),
                (db, msg) => db.markRequestFailed(job.id, msg)
            ),
        { concurrency: 2 }
    );
});