-- db/procedures.sql

-- RPC 1: 创建请求 (供 API 使用)
CREATE OR REPLACE PROCEDURE create_request(
    p_user_id UUID, 
    p_input TEXT,
    INOUT p_new_id UUID DEFAULT NULL -- 返回新生成的 ID
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO requests (user_id, user_input, status)
    VALUES (p_user_id, p_input, 'pending')
    RETURNING id INTO p_new_id;
END;
$$;

-- RPC 2: 提交计划 (供 Worker Planner 使用)
-- 接收 JSON 数组: [{"title": "...", "prompt": "..."}, ...]
CREATE OR REPLACE PROCEDURE submit_plan(
    p_request_id UUID,
    p_tasks_json JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    task_item JSONB;
    v_user_id uuid;
BEGIN
    -- 1. 插入所有子任务
    SELECT user_id into v_user_id from requests where id = p_request_id;
    FOR task_item IN SELECT * FROM jsonb_array_elements(p_tasks_json)
    LOOP
        INSERT INTO sub_tasks (request_id, task_title, prompt_content, status, user_id)
        VALUES (
            p_request_id, 
            task_item->>'title', 
            task_item->>'prompt', 
            'pending',
            v_user_id
        );
    END LOOP;

    -- 2. 更新主状态
    UPDATE requests 
    SET status = 'processing', updated_at = NOW()
    WHERE id = p_request_id;
END;
$$;

-- RPC 3: 提交子任务结果 (供 Worker Executor 使用)
CREATE OR REPLACE PROCEDURE submit_subtask_result(
    p_subtask_id UUID,
    p_result TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sub_tasks
    SET result_content = p_result,
        status = 'completed',
        updated_at = NOW()
    WHERE id = p_subtask_id;
END;
$$;

-- RPC 4: 提交最终报告 (供 Worker Aggregator 使用)
CREATE OR REPLACE PROCEDURE submit_final_report(
    p_request_id UUID,
    p_report TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE requests
    SET final_report = p_report,
        status = 'completed',
        updated_at = NOW()
    WHERE id = p_request_id;
END;
$$;
