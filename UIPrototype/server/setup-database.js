const { query, generateCreateTableSQL, entityMapping } = require('./config/database');
require('dotenv').config();

// 数据库初始化
async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...');
  
  try {
    // 创建所有表
    const entities = Object.keys(entityMapping);
    
    for (const entityName of entities) {
      console.log(`📋 创建表: ${entityName}`);
      const createSQL = generateCreateTableSQL(entityName);
      await query(createSQL);
      console.log(`✅ 表 ${entityName} 创建成功`);
    }
    
    // 创建外键约束
    await createForeignKeys();
    
    // 插入初始数据
    await insertInitialData();
    
    console.log('🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

// 创建外键约束
async function createForeignKeys() {
  console.log('🔗 创建外键约束...');
  
  const foreignKeys = [
    // chats表的外键
    {
      table: 'chats',
      constraint: 'fk_chats_user_id',
      sql: 'ALTER TABLE chats ADD CONSTRAINT fk_chats_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    },
    
    // messages表的外键
    {
      table: 'messages',
      constraint: 'fk_messages_chat_id',
      sql: 'ALTER TABLE messages ADD CONSTRAINT fk_messages_chat_id FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE'
    },
    {
      table: 'messages',
      constraint: 'fk_messages_user_id',
      sql: 'ALTER TABLE messages ADD CONSTRAINT fk_messages_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    },
    {
      table: 'messages',
      constraint: 'fk_messages_parent_id',
      sql: 'ALTER TABLE messages ADD CONSTRAINT fk_messages_parent_id FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE SET NULL'
    },
    
    // user_settings表的外键
    {
      table: 'user_settings',
      constraint: 'fk_user_settings_user_id',
      sql: 'ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    },
    
    // admin_messages表的外键
    {
      table: 'admin_messages',
      constraint: 'fk_admin_messages_sender_id',
      sql: 'ALTER TABLE admin_messages ADD CONSTRAINT fk_admin_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE'
    },
    {
      table: 'admin_messages',
      constraint: 'fk_admin_messages_recipient_id',
      sql: 'ALTER TABLE admin_messages ADD CONSTRAINT fk_admin_messages_recipient_id FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE'
    }
  ];
  
  for (const fk of foreignKeys) {
    try {
      await query(fk.sql);
      console.log(`✅ 外键约束 ${fk.constraint} 创建成功`);
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log(`⚠️  外键约束 ${fk.constraint} 已存在，跳过`);
      } else {
        console.error(`❌ 创建外键约束 ${fk.constraint} 失败:`, error.message);
      }
    }
  }
}

// 插入初始数据
async function insertInitialData() {
  console.log('📝 插入初始数据...');
  
  try {
    // 检查是否已有管理员用户
    const adminCheck = await query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    
    if (adminCheck.rows[0].count === 0) {
      console.log('👑 创建默认管理员账户...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // 创建管理员用户
      await query(`
        INSERT INTO users (
          username, email, password, real_name, role, status, 
          email_verified, preferences, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'admin',
        'admin@example.com',
        hashedPassword,
        '系统管理员',
        'admin',
        'active',
        true,
        JSON.stringify({
          theme: 'light',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: true,
            desktop: true,
            sound: true
          }
        })
      ]);
      
      console.log('✅ 管理员账户创建成功 (admin@example.com / admin123)');
    } else {
      console.log('⚠️  管理员账户已存在，跳过创建');
    }
    
    // 检查是否已有客服用户
    const csCheck = await query('SELECT COUNT(*) as count FROM users WHERE role = "customer_service"');
    
    if (csCheck.rows[0].count === 0) {
      console.log('🎧 创建默认客服账户...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('support123', 12);
      
      // 创建客服用户
      await query(`
        INSERT INTO users (
          username, email, password, real_name, role, status, 
          email_verified, preferences, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'support',
        'support@example.com',
        hashedPassword,
        '客服代表',
        'customer_service',
        'active',
        true,
        JSON.stringify({
          theme: 'light',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: true,
            desktop: true,
            sound: true
          }
        })
      ]);
      
      console.log('✅ 客服账户创建成功 (support@example.com / support123)');
    } else {
      console.log('⚠️  客服账户已存在，跳过创建');
    }
    
    // 检查是否已有普通用户
    const userCheck = await query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    
    if (userCheck.rows[0].count === 0) {
      console.log('👤 创建默认普通用户账户...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('user123', 12);
      
      // 创建普通用户
      await query(`
        INSERT INTO users (
          username, email, password, real_name, role, status, 
          email_verified, preferences, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'testuser',
        'user@example.com',
        hashedPassword,
        '测试用户',
        'user',
        'active',
        true,
        JSON.stringify({
          theme: 'light',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: false,
            desktop: false,
            sound: true
          }
        })
      ]);
      
      console.log('✅ 普通用户账户创建成功 (user@example.com / user123)');
    } else {
      console.log('⚠️  普通用户账户已存在，跳过创建');
    }
    
    console.log('📊 初始数据插入完成');
    
  } catch (error) {
    console.error('❌ 插入初始数据失败:', error);
    throw error;
  }
}

// 创建索引
async function createIndexes() {
  console.log('🔍 创建数据库索引...');
  
  const indexes = [
    // users表索引
    'CREATE INDEX idx_users_email ON users(email)',
    'CREATE INDEX idx_users_username ON users(username)',
    'CREATE INDEX idx_users_role ON users(role)',
    'CREATE INDEX idx_users_status ON users(status)',
    'CREATE INDEX idx_users_created_at ON users(created_at)',
    
    // chats表索引
    'CREATE INDEX idx_chats_user_id ON chats(user_id)',
    'CREATE INDEX idx_chats_type ON chats(type)',
    'CREATE INDEX idx_chats_status ON chats(status)',
    'CREATE INDEX idx_chats_created_at ON chats(created_at)',
    'CREATE INDEX idx_chats_is_favorite ON chats(is_favorite)',
    'CREATE INDEX idx_chats_is_protected ON chats(is_protected)',
    
    // messages表索引
    'CREATE INDEX idx_messages_chat_id ON messages(chat_id)',
    'CREATE INDEX idx_messages_user_id ON messages(user_id)',
    'CREATE INDEX idx_messages_role ON messages(role)',
    'CREATE INDEX idx_messages_created_at ON messages(created_at)',
    'CREATE INDEX idx_messages_parent_id ON messages(parent_id)',
    
    // user_settings表索引
    'CREATE INDEX idx_user_settings_user_id ON user_settings(user_id)',
    
    // admin_messages表索引
    'CREATE INDEX idx_admin_messages_sender_id ON admin_messages(sender_id)',
    'CREATE INDEX idx_admin_messages_recipient_id ON admin_messages(recipient_id)',
    'CREATE INDEX idx_admin_messages_type ON admin_messages(message_type)',
    'CREATE INDEX idx_admin_messages_created_at ON admin_messages(created_at)',
    'CREATE INDEX idx_admin_messages_is_read ON admin_messages(is_read)'
  ];
  
  for (const indexSQL of indexes) {
    try {
      await query(indexSQL);
      console.log(`✅ 索引创建成功: ${indexSQL.match(/idx_\w+/)[0]}`);
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log(`⚠️  索引已存在，跳过: ${indexSQL.match(/idx_\w+/)[0]}`);
      } else {
        console.error(`❌ 创建索引失败:`, error.message);
      }
    }
  }
}

// 显示数据库信息
async function showDatabaseInfo() {
  console.log('\n📊 数据库信息:');
  
  try {
    // 显示所有表
    const tables = await query('SHOW TABLES');
    console.log('📋 数据表:');
    tables.rows.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });
    
    // 显示用户统计
    const userStats = await query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users 
      GROUP BY role
    `);
    
    console.log('\n👥 用户统计:');
    userStats.rows.forEach(stat => {
      console.log(`  - ${stat.role}: ${stat.count} 人`);
    });
    
  } catch (error) {
    console.error('❌ 获取数据库信息失败:', error);
  }
}

// 主函数
async function main() {
  try {
    await initializeDatabase();
    await createIndexes();
    await showDatabaseInfo();
    
    console.log('\n🎉 数据库设置完成！');
    console.log('\n📝 默认账户信息:');
    console.log('管理员: admin@example.com / admin123');
    console.log('客服: support@example.com / support123');
    console.log('用户: user@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = {
  initializeDatabase,
  createForeignKeys,
  insertInitialData,
  createIndexes,
  showDatabaseInfo
}; 