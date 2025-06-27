-- 创建管理员和客服账号
USE `database`;

-- 插入管理员账号
-- 密码: admin123456 (BCrypt加密后的哈希值)
INSERT INTO users (email, password, username, role, permissions, status, created_at, updated_at) 
VALUES (
  'admin@aiplatform.com',
  '$2a$10$N9qo8uLOickgx2ZrVzaZUe.dUFFOEoOzL0.8Fp5Ic8.VkVLsBZE/G',
  'admin',
  'admin',
  'ALL',
  'active',
  NOW(),
  NOW()
);

-- 插入客服账号  
-- 密码: service123456 (BCrypt加密后的哈希值)
INSERT INTO users (email, password, username, role, permissions, status, created_at, updated_at)
VALUES (
  'service@aiplatform.com', 
  '$2a$10$8YGKe.gE0nKt3jTFDqLXDuH3rZJR0Zj9mDkLEKgVJ1YdOqtNhKzmy',
  'service',
  'support', 
  'SUPPORT',
  'active',
  NOW(),
  NOW()
);

-- 查看插入的结果
SELECT id, email, username, role, permissions, status, created_at FROM users WHERE role IN ('admin', 'support'); 