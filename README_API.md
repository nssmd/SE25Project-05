# AI平台后端API文档

## 概述

这是一个基于Express.js和PostgreSQL的AI平台后端服务，学习借鉴了Next.js AI聊天机器人项目的架构设计。

## 技术栈

- **后端框架**: Express.js
- **数据库**: PostgreSQL
- **认证**: JWT
- **ORM**: 原生SQL查询（参考Drizzle ORM模式）
- **定时任务**: node-cron
- **文件上传**: multer

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 数据库设置

确保你的PostgreSQL服务正在运行，然后创建数据库：

```sql
CREATE DATABASE ai_platform;
```

### 3. 环境配置

复制环境变量示例文件并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置你的数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_platform
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
```

### 4. 初始化数据库

运行数据库初始化脚本：

```bash
npm run setup-db
```

这将创建所有必要的表和默认用户账户：
- 管理员: admin@example.com / admin123
- 客服: support@example.com / support123

### 5. 启动服务

开发模式（前后端同时启动）：
```bash
npm run dev
```

仅启动后端服务：
```bash
npm run server
```

仅启动前端：
```bash
npm start
```

## API文档

### 认证端点

#### POST /api/auth/register
用户注册

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名"
}
```

#### POST /api/auth/login
用户登录

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/auth/verify
验证token（需要Authorization header）

### 聊天端点

#### POST /api/chat/create
创建新对话

**请求体:**
```json
{
  "title": "对话标题",
  "aiType": "text_to_text"
}
```

#### POST /api/chat/:chatId/message
发送消息

**请求体:**
```json
{
  "content": "消息内容",
  "role": "user"
}
```

### 历史记录端点

#### GET /api/history/chats
获取对话列表

**查询参数:**
- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词
- `aiType`: AI功能类型
- `timeFilter`: 时间筛选（today/week/month）
- `favoriteOnly`: 仅显示收藏

### 数据管理端点

#### GET /api/data/settings
获取用户设置

#### PUT /api/data/settings
更新用户设置

#### POST /api/data/cleanup
立即清理过期数据

### 管理员端点

#### GET /api/admin/users
获取用户列表（需要管理员权限）

#### PATCH /api/admin/users/:userId/status
更新用户状态（需要管理员权限）

## 数据库架构

### 用户表 (users)
- `id`: UUID主键
- `email`: 邮箱
- `password`: 加密密码
- `username`: 用户名
- `role`: 角色（admin/support/user）
- `status`: 状态（active/banned/suspended）
- `permissions`: 权限JSON
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `last_login`: 最后登录时间

### 对话表 (chats)
- `id`: UUID主键
- `user_id`: 用户ID
- `title`: 对话标题
- `ai_type`: AI功能类型
- `is_favorite`: 是否收藏
- `is_protected`: 是否保护
- `visibility`: 可见性
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 消息表 (messages)
- `id`: UUID主键
- `chat_id`: 对话ID
- `role`: 角色（user/assistant/system）
- `content`: 消息内容
- `metadata`: 元数据JSON
- `attachments`: 附件JSON
- `created_at`: 创建时间

### 用户设置表 (user_settings)
- `user_id`: 用户ID（主键）
- `auto_cleanup_enabled`: 自动清理启用
- `retention_days`: 保留天数
- `max_chats`: 最大对话数
- `protected_chats`: 保护对话数
- `cleanup_frequency`: 清理频率
- `notifications`: 通知设置JSON
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 权限系统

### 角色
- **admin**: 管理员，拥有所有权限
- **support**: 客服，拥有用户管理权限
- **user**: 普通用户，拥有基础功能权限

### AI功能权限
- `text_to_text`: 文字对话
- `text_to_image`: 文字生成图片
- `image_to_text`: 图片识别
- `voice_to_text`: 语音转文字
- `text_to_voice`: 文字转语音
- `file_analysis`: 文件分析

## 安全特性

- JWT token认证
- 密码bcrypt加密
- 速率限制
- SQL注入防护
- CORS配置
- 输入验证

## 定时任务

系统每天凌晨2点自动执行数据清理任务，删除过期的对话记录。

## 日志系统

所有用户操作都会记录到系统日志表，包括：
- 用户登录/注销
- 对话创建/删除
- 数据清理
- 管理员操作

## 开发指南

### 添加新的API端点

1. 在 `server/routes/` 目录下创建或修改路由文件
2. 使用中间件进行认证和权限验证
3. 在 `src/services/api.js` 中添加前端调用方法

### 数据库迁移

如需修改数据库结构，请：
1. 修改 `server/setup-database.js` 文件
2. 运行 `npm run setup-db` 重新初始化

### 环境部署

#### 开发环境
```bash
npm run dev
```

#### 生产环境
1. 设置环境变量 `NODE_ENV=production`
2. 配置生产数据库
3. 启动服务：`npm run server`

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查PostgreSQL服务是否运行
   - 验证 `.env` 文件中的数据库配置

2. **JWT token错误**
   - 检查 `JWT_SECRET` 环境变量
   - 清除浏览器localStorage重新登录

3. **权限错误**
   - 确认用户角色和权限设置
   - 检查中间件配置

### 日志查看

开发模式下，所有请求和错误都会在控制台输出。生产环境建议配置日志文件。

## API测试

可以使用Postman或其他API测试工具，导入以下基础请求：

### 测试用户注册
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"测试用户"}'
```

### 测试用户登录
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 测试创建对话（需要token）
```bash
curl -X POST http://localhost:5000/api/chat/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"测试对话","aiType":"text_to_text"}'
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License 