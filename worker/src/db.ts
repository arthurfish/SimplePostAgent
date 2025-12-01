// src/db.ts
import postgres from "postgres";
import { Effect, Context, Layer, Config } from "effect";
import {Console} from "effect/Console";

// 定义服务接口 (Tag)
export class Database extends Context.Tag("Database")<
  Database,
  ReturnType<typeof makeDbImpl>
>() {}

// 实现
const makeDbImpl = (sql: postgres.Sql) => ({
  // 1. 获取待拆解的任务 (Planner Job)
  // SKIP LOCKED 是关键: 它会跳过被其他事务锁定的行
  fetchPendingRequests: () =>
    Effect.tryPromise(() =>
      sql`
        SELECT id, user_input 
        FROM requests 
        WHERE status = 'pending' 
        FOR UPDATE SKIP LOCKED 
        LIMIT 5
      `
    ),

  // 2. 获取待执行的子任务 (Executor Job)
  fetchPendingSubTasks: () =>
    Effect.tryPromise(() =>
      sql`
        SELECT id, prompt_content 
        FROM sub_tasks 
        WHERE status = 'pending' 
        FOR UPDATE SKIP LOCKED 
        LIMIT 10
      `
    ),

  // 3. 获取待汇总的任务 (Aggregator Job)
  fetchAggregatingRequests: () =>
    Effect.tryPromise(() =>
      sql`
        SELECT id 
        FROM requests 
        WHERE status = 'aggregating' 
        FOR UPDATE SKIP LOCKED 
        LIMIT 5
      `
    ),
    
  // 4. 获取某个 Request 的所有已完成子任务结果 (用于汇总)
  fetchCompletedSubTasks: (requestId: string) =>
    Effect.tryPromise(() =>
        sql`
            SELECT task_title, result_content 
            FROM sub_tasks 
            WHERE request_id = ${requestId} AND status = 'completed'
        `
    ),

  // --- RPC 调用封装 (与 Phase 1 定义的存储过程一致) ---

  submitPlan: (requestId: string, planJson: any) =>
    Effect.tryPromise(() =>
      sql`CALL submit_plan(${requestId}, ${sql.json(planJson)})`
    ),

  submitSubTaskResult: (taskId: string, result: string) =>
    Effect.tryPromise(() =>
      sql`CALL submit_subtask_result(${taskId}, ${result})`
    ),

  submitFinalReport: (requestId: string, report: string) =>
    Effect.tryPromise(() =>
      sql`CALL submit_final_report(${requestId}, ${report})`
    ),
  markRequestFailed: (requestId: string, error: string) =>
    Effect.tryPromise(() =>
      sql`CALL submit_request_failure(${requestId}, ${error})`
    ),

  markSubTaskFailed: (taskId: string, error: string) =>
    Effect.tryPromise(() =>
      sql`CALL submit_subtask_failure(${taskId}, ${error})`
    ),
});

// Layer 定义
export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const url = yield* Config.string("DATABASE_URL").pipe(
        Config.withDefault("postgres://postgres:password@localhost:5432/simple_agent")
    );
    const sql = postgres(url, { transform: { undefined: null } });
    return makeDbImpl(sql);
  })
);
