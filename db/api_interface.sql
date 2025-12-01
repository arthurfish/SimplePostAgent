-- db/api_interface.sql

-- 1. 定义一个辅助函数，方便从 Node.js 传入的配置中获取 User ID
-- 如果没有设置（比如测试环境忘记设），则抛出错误，防止数据污染
CREATE OR REPLACE FUNCTION get_auth_uid() RETURNS UUID AS $$
DECLARE
    v_uid text;
BEGIN
    v_uid := current_setting('app.current_user_id', true);
    IF v_uid IS NULL OR v_uid = '' THEN
        RAISE EXCEPTION 'Access Denied: User ID not set in session context';
    END IF;
    RETURN v_uid::UUID;
END;
$$ LANGUAGE plpgsql;

-- 2. API 专用：创建请求
-- 这是一个 FUNCTION，不是 PROCEDURE，方便返回新生成的 ID
CREATE OR REPLACE FUNCTION api_create_request(p_input TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_new_id UUID;
BEGIN
    -- 获取身份 (利用上面的辅助函数)
    v_user_id := get_auth_uid();
    
    INSERT INTO requests (user_id, user_input, status)
    VALUES (v_user_id, p_input, 'pending')
    RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$;

-- 3. 确保之前的 RLS 策略能读取到这个设置
-- (Phase 1 已经做过，这里确认一下逻辑闭环)
-- ALTER DATABASE simple_agent SET "app.current_user_id" TO '';
