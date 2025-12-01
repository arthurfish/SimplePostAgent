-- db/schema.sql

-- 启用 UUID 生成扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 定义枚举类型
CREATE TYPE request_status AS ENUM (
    'pending',      -- 等待处理
    'processing',   -- 正在拆解/执行子任务
    'aggregating',  -- 子任务完成，正在汇总
    'completed',    -- 全部完成
    'failed'        -- 失败
);

CREATE TYPE task_status AS ENUM (
    'pending',      -- 等待执行
    'completed',    -- 执行完毕
    'failed'        -- 执行失败
);

-- 1. 主请求表
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_input TEXT NOT NULL,
    final_report TEXT,
    status request_status DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb, -- 存放如 token消耗、模型配置等
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 子任务表
CREATE TABLE IF NOT EXISTS sub_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    task_title VARCHAR(255),
    prompt_content TEXT NOT NULL,
    result_content TEXT,
    status task_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id uuid NOT NULL
);

-- Electric 必须配置：开启全量复制标识
ALTER TABLE requests REPLICA IDENTITY FULL;
ALTER TABLE sub_tasks REPLICA IDENTITY FULL;

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_sub_tasks_request_id ON sub_tasks(request_id);
CREATE INDEX IF NOT EXISTS idx_sub_tasks_status ON sub_tasks(status);
