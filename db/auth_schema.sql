-- db/auth_schema.sql

-- 1. 启用加密扩展 (如果之前没启用)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 创建用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- 存储 bcrypt 哈希
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 开启 RLS (虽然目前我们主要通过 API 访问，但这是好习惯)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. 辅助函数：创建用户 (供管理员手动调用)
-- 使用: SELECT create_user('admin', '123456');
CREATE OR REPLACE FUNCTION create_user(p_username TEXT, p_password TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO users (username, password_hash)
    VALUES (p_username, crypt(p_password, gen_salt('bf'))) -- 使用 bcrypt
    RETURNING id INTO v_id;
    return v_id;
END;
$$;

-- 5. 辅助函数：验证用户 (供 API 调用)
-- 如果验证成功返回 user_id，失败返回 NULL
CREATE OR REPLACE FUNCTION verify_user(p_username TEXT, p_password TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
    v_hash TEXT;
BEGIN
    SELECT id, password_hash INTO v_id, v_hash
    FROM users
    WHERE username = p_username;

    IF v_id IS NOT NULL AND v_hash = crypt(p_password, v_hash) THEN
        RETURN v_id;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;
