const { query } = require('./config/database');

// 数据库表创建脚本
const createTables = async () => {
  try {
    console.log('🔧 Starting database setup...');

    // 1. 用户表
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'support', 'user')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended')),
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // 2. 对话表
    await query(`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        ai_type VARCHAR(50) DEFAULT 'text_to_text',
        is_favorite BOOLEAN DEFAULT false,
        is_protected BOOLEAN DEFAULT false,
        visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. 消息表
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. 用户设置表
    await query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        auto_cleanup_enabled BOOLEAN DEFAULT false,
        retention_days INTEGER DEFAULT 30,
        max_chats INTEGER DEFAULT 100,
        protected_chats INTEGER DEFAULT 10,
        cleanup_frequency VARCHAR(20) DEFAULT 'daily',
        notifications JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. 管理员消息表
    await query(`
      CREATE TABLE IF NOT EXISTS admin_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id),
        recipient_id UUID REFERENCES users(id),
        message_type VARCHAR(20) DEFAULT 'personal' CHECK (message_type IN ('broadcast', 'personal')),
        title VARCHAR(200),
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'deleted')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. 系统日志表
    await query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引以提高查询性能
    await query(`CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_admin_messages_recipient ON admin_messages(recipient_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC)`);

    // 创建更新时间触发器函数
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // 为需要的表添加更新时间触发器
    await query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
      CREATE TRIGGER update_chats_updated_at
        BEFORE UPDATE ON chats
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
      CREATE TRIGGER update_user_settings_updated_at
        BEFORE UPDATE ON user_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // 插入默认管理员用户（如果不存在）
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await query(`
      INSERT INTO users (email, password, username, role, permissions)
      VALUES ('admin@example.com', $1, 'Administrator', 'admin', 
        '{"text_to_text": true, "text_to_image": true, "image_to_text": true, "voice_to_text": true, "text_to_voice": true, "file_analysis": true}'::jsonb)
      ON CONFLICT (email) DO NOTHING
    `, [adminPassword]);

    // 插入默认客服用户
    const supportPassword = await bcrypt.hash('support123', 10);
    
    await query(`
      INSERT INTO users (email, password, username, role, permissions)
      VALUES ('support@example.com', $1, 'Customer Support', 'support',
        '{"text_to_text": true, "text_to_image": false, "image_to_text": true, "voice_to_text": true, "text_to_voice": true, "file_analysis": true}'::jsonb)
      ON CONFLICT (email) DO NOTHING
    `, [supportPassword]);

    console.log('✅ Database setup completed successfully!');
    console.log('📋 Default accounts created:');
    console.log('   - Admin: admin@example.com / admin123');
    console.log('   - Support: support@example.com / support123');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};

// 运行数据库初始化
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Database initialization completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables }; 