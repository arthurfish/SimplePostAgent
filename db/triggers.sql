-- db/triggers.sql

-- 触发器函数
CREATE OR REPLACE FUNCTION check_and_trigger_aggregation()
RETURNS TRIGGER AS $$
DECLARE
    pending_count INTEGER;
    parent_status request_status;
BEGIN
    -- 仅当子任务变更为 completed 时执行
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- 1. 检查该请求是否还有其他未完成的子任务
        SELECT count(*) INTO pending_count
        FROM sub_tasks
        WHERE request_id = NEW.request_id AND status != 'completed';

        -- 2. 如果没有待处理的任务 (count = 0)
        IF pending_count = 0 THEN
            -- 检查父任务当前状态，避免重复触发
            SELECT status INTO parent_status FROM requests WHERE id = NEW.request_id;
            
            IF parent_status = 'processing' THEN
                -- 3. 自动将主任务推向 'aggregating'
                UPDATE requests
                SET status = 'aggregating', updated_at = NOW()
                WHERE id = NEW.request_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 绑定触发器
DROP TRIGGER IF EXISTS trigger_check_aggregation ON sub_tasks;
CREATE TRIGGER trigger_check_aggregation
AFTER UPDATE ON sub_tasks
FOR EACH ROW
EXECUTE FUNCTION check_and_trigger_aggregation();
