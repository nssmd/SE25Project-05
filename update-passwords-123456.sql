-- 更新管理员和客服账户密码为 123456
USE `database`;

-- 查看当前账户状态
SELECT 
    id, 
    email, 
    username, 
    role, 
    status, 
    permissions
FROM users 
WHERE role IN ('admin', 'support') OR email IN ('admin@aiplatform.com', 'service@aiplatform.com');

-- 更新管理员密码为 123456
-- BCrypt哈希值：$2a$10$7EqJtq98hPqEX/fBN/qc7ugQLN7lbKCgJPf7sG7XG1vMpDAPgUa/.
UPDATE users 
SET 
    password = '$2a$10$7EqJtq98hPqEX/fBN/qc7ugQLN7lbKCgJPf7sG7XG1vMpDAPgUa/.',
    status = 'active',
    permissions = 'ALL',
    updated_at = NOW()
WHERE email = 'admin@aiplatform.com';

-- 如果管理员账户不存在，创建一个
INSERT IGNORE INTO users (email, password, username, role, permissions, status, created_at, updated_at)
VALUES (
    'admin@aiplatform.com',
    '$2a$10$7EqJtq98hPqEX/fBN/qc7ugQLN7lbKCgJPf7sG7XG1vMpDAPgUa/.',
    'admin',
    'admin',
    'ALL',
    'active',
    NOW(),
    NOW()
);

-- 更新客服密码为 123456  
-- BCrypt哈希值：$2a$10$n1K9Z.9HkxqG8cDGC.N5VOxG7lRJ0zJX4ZNZ8JDx9z8PqGXE.K2JC
UPDATE users 
SET 
    password = '$2a$10$n1K9Z.9HkxqG8cDGC.N5VOxG7lRJ0zJX4ZNZ8JDx9z8PqGXE.K2JC',
    status = 'active',
    permissions = 'SUPPORT',
    updated_at = NOW()
WHERE email = 'service@aiplatform.com';

-- 如果客服账户不存在，创建一个
INSERT IGNORE INTO users (email, password, username, role, permissions, status, created_at, updated_at)
VALUES (
    'service@aiplatform.com',
    '$2a$10$n1K9Z.9HkxqG8cDGC.N5VOxG7lRJ0zJX4ZNZ8JDx9z8PqGXE.K2JC',
    'service',
    'support',
    'SUPPORT', 
    'active',
    NOW(),
    NOW()
);

-- 验证更新结果
SELECT 
    id,
    email,
    username,
    role,
    status,
    permissions,
    updated_at
FROM users 
WHERE role IN ('admin', 'support') OR email IN ('admin@aiplatform.com', 'service@aiplatform.com');

-- 显示登录信息
SELECT 
    '=== 账户登录信息 ===' as info,
    NULL as email,
    NULL as password,
    NULL as note
UNION ALL
SELECT 
    '管理员账户' as info,
    'admin@aiplatform.com' as email,
    '123456' as password,
    '拥有所有权限' as note
UNION ALL
SELECT 
    '客服账户' as info,
    'service@aiplatform.com' as email,
    '123456' as password,
    '拥有客服权限' as note; 