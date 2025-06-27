-- 初始化用户数据
-- 插入默认管理员账号
INSERT INTO users (
    email, 
    password, 
    username, 
    role, 
    permissions,
    status, 
    last_login,
    created_at,
    updated_at
) VALUES (
    'admin@system.com',
    '$2a$10$N.zmDOoQTT0d.kWDyHN1FOF9fPa1Yld5M1N.zbdcj3KOF1Q0m9DEG', -- admin123456
    'admin',
    'admin',
    '{"users": {"read": true, "write": true}, "chats": {"read": true, "write": true}, "admin": {"read": true, "write": true}}',
    'active',
    NULL,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE id=id;

-- 插入默认客服账号
INSERT INTO users (
    email, 
    password, 
    username, 
    role, 
    permissions,
    status, 
    last_login,
    created_at,
    updated_at
) VALUES (
    'service@system.com',
    '$2a$10$M.zmDOoQTT0d.kWDyHN1FOF9fPa1Yld5M1N.zbdcj3KOF1Q0m9DEH', -- service123456
    'customer_service',
    'support',
    '{"users": {"read": true, "write": false}, "chats": {"read": true, "write": true}, "support": {"read": true, "write": true}}',
    'active',
    NULL,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE id=id;

-- 显示创建结果
SELECT id, email, username, role, permissions, status FROM users WHERE role IN ('admin', 'support'); 