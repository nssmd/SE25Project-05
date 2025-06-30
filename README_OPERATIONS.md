# AI聊天平台 - 操作指南

## 📋 目录
- [系统概述](#系统概述)
- [快速开始](#快速开始)
- [功能特性](#功能特性)
- [用户指南](#用户指南)
- [管理员指南](#管理员指南)
- [API文档](#api文档)
- [故障排除](#故障排除)
- [技术架构](#技术架构)

---

## 📖 系统概述

AI聊天平台是一个现代化的多功能AI交互系统，支持文本对话、图像生成、数据管理等功能。系统采用前后端分离架构，提供安全可靠的多用户聊天体验。

### 核心特性
- 🤖 多种AI模型支持（GPT-4、Claude-3、自定义模型）
- 💬 实时对话功能，支持历史记录管理
- 🎨 文生图、图生文、视频生成等多媒体功能
- 👥 多用户系统，数据完全隔离
- 🔒 JWT身份认证，保障数据安全
- 📊 数据统计和管理功能
- 🎯 管理员面板，支持用户管理

---

## 🚀 快速开始

### 环境要求
- **Java**: 17+
- **Node.js**: 16+
- **MySQL**: 8.0+
- **Maven**: 3.6+

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd ai-chat-platform
```


```bash
cd server/java-backend

# 配置application.yml中的数据库连接
# spring.datasource.url=jdbc:mysql://localhost:3306/ai_chat_platform
# spring.datasource.username=your_username
# spring.datasource.password=your_password

# 编译并启动
mvn clean compile
mvn spring-boot:run
```

#### 4. 前端启动
```bash
cd /
npm install
npm start
```

#### 5. 访问系统
- 前端地址: http://localhost:3000
- 后端API: http://localhost:8080
- 默认管理员账号: admin@aiplatform.com / admin123456

---

## 🎯 功能特性

### 用户功能

#### 🤖 AI对话功能
- **多模型选择**: 支持GPT-4、Claude-3、自定义模型
- **实时对话**: 即时消息发送和AI回复
- **对话历史**: 自动保存所有对话记录
- **对话管理**: 创建、删除、收藏、保护对话

#### 📁 历史记录管理
- **对话列表**: 查看所有历史对话
- **搜索功能**: 按关键词搜索对话内容
- **筛选功能**: 按AI类型、收藏状态筛选
- **时间排序**: 按最后活动时间排序显示

#### 🎨 多媒体功能（开发中）
- **文生图**: 根据文本描述生成图像
- **图生图**: 图像风格转换
- **图生文**: 图像内容识别描述
- **文生视频**: 文本生成视频内容
- **文生3D**: 3D模型生成

#### ⚙️ 个人设置
- **个人资料**: 修改用户名、邮箱等信息
- **密码管理**: 安全密码修改
- **数据管理**: 导出、清理个人数据
- **隐私设置**: 数据保留期限设置

### 管理员功能

#### 👥 用户管理
- **用户列表**: 查看所有注册用户
- **权限管理**: 设置用户角色和权限
- **状态管理**: 启用/禁用用户账户
- **批量操作**: 批量更新用户设置

#### 📊 系统监控
- **使用统计**: 查看系统使用情况
- **性能监控**: 监控系统性能指标
- **日志管理**: 查看系统操作日志
- **数据分析**: 用户行为分析

---

## 👤 用户指南

### 注册和登录

#### 新用户注册
1. 访问 http://localhost:3000
2. 点击"注册"按钮
3. 填写用户名、邮箱、密码
4. 点击"注册"完成账户创建

#### 用户登录
1. 在登录页面输入邮箱和密码
2. 点击"登录"进入系统
3. 登录成功后进入AI工作台

### 开始对话

#### 创建新对话
1. 在工作台点击"文生文"功能
2. 选择AI模型（GPT-4、Claude-3等）
3. 在输入框输入问题
4. 按Enter键或点击发送按钮

#### 对话历史管理
1. **查看历史**: 点击左侧对话列表查看所有对话
2. **切换对话**: 点击对话项切换到该对话
3. **新建对话**: 点击"+"按钮创建新对话
4. **删除对话**: 鼠标悬停显示删除按钮
5. **收藏对话**: 重要对话可标记为收藏

#### 对话操作技巧
- **快速发送**: 使用Enter键快速发送消息
- **多行输入**: Shift+Enter换行输入
- **历史搜索**: 使用搜索功能快速找到历史对话
- **对话整理**: 定期删除不需要的对话

### 数据管理

#### 个人数据导出
1. 进入"个人中心"
2. 点击"数据管理"
3. 选择"导出数据"
4. 下载生成的数据文件

#### 数据清理
1. 在数据管理页面设置数据保留期
2. 点击"立即清理"删除过期数据
3. 确认操作后系统自动清理

---

## 🔧 管理员指南

### 管理员登录
- 邮箱: admin@aiplatform.com
- 密码: admin123456
- 客服账号: service@aiplatform.com / service123456

### 用户管理操作

#### 查看用户列表
1. 登录管理员账户
2. 点击左侧"管理员面板"
3. 查看所有注册用户信息

#### 用户权限管理
1. 在用户列表中找到目标用户
2. 点击"编辑权限"按钮
3. 设置用户角色：user/admin/support
4. 保存更改

#### 用户状态管理
1. 选择需要管理的用户
2. 点击"状态管理"
3. 设置为启用/禁用状态
4. 确认操作

### 系统监控

#### 查看系统统计
1. 在管理员面板查看总体统计
2. 监控用户活跃度
3. 查看对话数量统计
4. 分析系统使用趋势

#### 日志管理
1. 访问"系统日志"页面
2. 按时间范围筛选日志
3. 按日志级别筛选（INFO/WARN/ERROR）
4. 导出日志文件进行分析

---

## 📡 API文档

### 认证接口

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "邮箱",
  "password": "密码"
}
```

### 聊天接口

#### 创建对话
```http
POST /api/chat/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "对话标题",
  "aiType": "text_to_text"
}
```

#### 发送消息
```http
POST /api/chat/{chatId}/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "消息内容",
  "role": "user"
}
```

#### 获取对话列表
```http
GET /api/history/chats?page=0&size=20
Authorization: Bearer <token>
```

### 管理员接口

#### 获取用户列表
```http
GET /api/admin/users?page=0&size=20
Authorization: Bearer <admin-token>
```

#### 更新用户状态
```http
PATCH /api/admin/users/{userId}/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "active"
}
```

---

## 🔍 故障排除

### 常见问题

#### 1. 无法登录
**问题**: 提示"用户名或密码错误"
**解决方案**:
- 检查用户名和密码是否正确
- 确认账户是否已激活
- 尝试重置密码

#### 2. 对话无法加载
**问题**: 历史对话列表为空
**解决方案**:
- 刷新页面重试
- 检查网络连接
- 确认登录状态有效

#### 3. AI回复缓慢
**问题**: AI响应时间过长
**解决方案**:
- 检查网络连接稳定性
- 尝试切换不同AI模型
- 联系管理员检查服务器状态

#### 4. 数据库连接失败
**问题**: 后端启动时数据库连接错误
**解决方案**:
```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 重启MySQL服务
sudo systemctl restart mysql

# 检查数据库配置
cat server/java-backend/src/main/resources/application.yml
```

#### 5. 前端无法访问后端
**问题**: API调用失败
**解决方案**:
- 检查后端服务是否启动（端口8080）
- 确认防火墙设置
- 检查CORS配置

### 日志查看

#### 后端日志
```bash
# 查看Spring Boot日志
tail -f server/java-backend/logs/ai-chat-backend.log

# 查看特定错误
grep "ERROR" server/java-backend/logs/ai-chat-backend.log
```

#### 前端日志
- 打开浏览器开发者工具
- 查看Console标签页
- 检查Network标签页的请求状态

### 性能优化

#### 数据库优化
```sql
-- 检查慢查询
SHOW VARIABLES LIKE 'slow_query_log';

-- 优化索引
ANALYZE TABLE chats;
ANALYZE TABLE messages;
```

#### 内存使用优化
```bash
# 检查Java进程内存使用
ps aux | grep java

# 调整JVM内存参数
export JAVA_OPTS="-Xms512m -Xmx2g"
```

---

## 🏗️ 技术架构

### 系统架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │  后端 (Spring)   │    │   数据库 (MySQL) │
│                 │    │                 │    │                 │
│ - Dashboard     │◄──►│ - REST API      │◄──►│ - 用户表        │
│ - Chat UI       │    │ - JWT Auth      │    │ - 对话表        │
│ - Admin Panel   │    │ - WebSocket     │    │ - 消息表        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈

#### 前端技术
- **React 18**: 用户界面框架
- **React Router**: 路由管理
- **Axios**: HTTP客户端
- **Lucide React**: 图标库
- **CSS3**: 样式设计

#### 后端技术
- **Spring Boot 3**: 应用框架
- **Spring Security**: 安全认证
- **Spring Data JPA**: 数据访问
- **JWT**: 身份认证
- **MySQL**: 数据存储
- **Maven**: 依赖管理

#### 数据库设计
```sql
-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('user', 'admin', 'support'),
    status ENUM('active', 'inactive', 'banned'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 对话表
CREATE TABLE chats (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    title VARCHAR(255),
    ai_type ENUM('text_to_text', 'text_to_image', ...),
    message_count INT DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_protected BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 消息表
CREATE TABLE messages (
    id BIGINT PRIMARY KEY,
    chat_id BIGINT,
    role ENUM('user', 'assistant', 'system'),
    content TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id)
);
```

### 安全机制

#### 身份认证流程
1. 用户提交登录凭据
2. 后端验证用户名密码
3. 生成JWT token返回前端
4. 前端存储token并附加到请求头
5. 后端验证token有效性

#### 数据隔离保证
- 所有API都验证用户身份
- 数据查询都包含用户ID过滤
- 跨用户数据访问会被拒绝
- 敏感操作需要额外权限验证

### 部署建议

#### 开发环境
- 使用内置数据库进行快速开发
- 开启热重载提高开发效率
- 使用开发配置文件

#### 生产环境
- 使用独立MySQL数据库
- 配置反向代理（Nginx）
- 启用HTTPS加密传输
- 设置日志轮转和监控

---

## 📞 技术支持

### 联系方式
- **技术支持**: 通过系统内客服功能联系
- **问题反馈**: 在GitHub Issues提交问题
- **功能建议**: 发送邮件至系统管理员

### 更新日志
- **v1.0.0**: 基础对话功能、用户管理
- **v1.1.0**: 历史记录管理、数据导出
- **v1.2.0**: 管理员面板、系统监控
- **v1.3.0**: 对话历史列表、搜索功能

### 开发计划
- [ ] 多媒体功能完善
- [ ] AI模型集成优化
- [ ] 移动端适配
- [ ] 实时推送功能
- [ ] 插件系统开发

---

**版本**: v1.3.0  
**更新时间**: 2025年6月  
**文档作者**: AI聊天平台开发团队 