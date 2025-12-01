-- db/error_handling.sql

-- 1. RPC: 标记子任务失败
CREATE OR REPLACE PROCEDURE submit_subtask_failure(
    p_subtask_id UUID,
    p_error_message TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sub_tasks
    SET status = 'failed',
        result_content = 'ERROR: ' || p_error_message,
        updated_at = NOW()
    WHERE id = p_subtask_id;
END;
$$;

-- 2. RPC: 标记主任务失败
CREATE OR REPLACE PROCEDURE submit_request_failure(
    p_request_id UUID,
    p_error_message TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE requests
    SET status = 'failed',
        final_report = 'SYSTEM ERROR: ' || p_error_message,
        updated_at = NOW()
    WHERE id = p_request_id;
END;
$$;

-- 3. 触发器：级联失败 (Cascade Failure)
-- 如果任何一个子任务变成了 'failed'，立即将主任务也标记为 'failed'，停止后续流程。
CREATE OR REPLACE FUNCTION trigger_cascade_failure()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        UPDATE requests
        SET status = 'failed',
            final_report = 'Task execution failed. See sub-tasks for details.',
            updated_at = NOW()
        WHERE id = NEW.request_id AND status != 'failed'; -- 防止重复更新
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subtask_failure ON sub_tasks;
CREATE TRIGGER trigger_subtask_failure
AFTER UPDATE ON sub_tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_cascade_failure();
