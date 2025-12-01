// src/services/ElectricService.ts

// 我们将继续使用这些手动定义的类型。
// 关键是确保它们与数据库 `db/schema.sql` 中的定义保持严格一致。

export interface Request {
    id: string; // uuid
    user_input: string; // text
    final_report: string | null; // text
    status: "pending" | "processing" | "aggregating" | "completed" | "failed"; // request_status enum
    created_at: string; // timestamptz
    // updated_at, user_id 等字段前端如果用不到，可以不定义
}

export interface SubTask {
    id: string; // uuid
    request_id: string; // uuid
    task_title: string; // varchar(255)
    result_content: string | null; // text
    status: "pending" | "completed" | "failed"; // task_status enum
}

// ElectricService 定义本身被移除，因为 Hook 不能在服务中创建。