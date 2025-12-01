-- db/rls.sql

-- 开启 RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_tasks ENABLE ROW LEVEL SECURITY;

-- 策略 1: 用户只能看到自己的请求
CREATE POLICY requests_isolation_policy ON requests
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- 策略 2: 用户只能看到属于自己请求的子任务
CREATE POLICY sub_tasks_isolation_policy ON sub_tasks
    FOR ALL
    USING (
        request_id IN (
            SELECT id FROM requests 
            WHERE user_id = current_setting('app.current_user_id', true)::uuid
        )
    );
