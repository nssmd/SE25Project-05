const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'ai_platform',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionLimit: 20,
  charset: 'utf8mb4',
  timezone: '+08:00',
  // 移除已废弃的配置项
  multipleStatements: false,
  namedPlaceholders: true
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 连接测试
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database:', dbConfig.database);
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err);
  });

// 实体表映射配置 (类似JPA的@Entity)
const entityMapping = {
  users: {
    tableName: 'users',
    primaryKey: 'id',
    fields: {
      id: { type: 'BIGINT', autoIncrement: true, primaryKey: true },
      username: { type: 'VARCHAR(50)', unique: true, notNull: true },
      email: { type: 'VARCHAR(100)', unique: true, notNull: true },
      password: { type: 'VARCHAR(255)', notNull: true },
      real_name: { type: 'VARCHAR(100)', nullable: true },
      phone: { type: 'VARCHAR(20)', nullable: true },
      department: { type: 'VARCHAR(100)', nullable: true },
      role: { type: 'ENUM("user","admin","customer_service")', default: 'user' },
      status: { type: 'ENUM("active","disabled","pending")', default: 'active' },
      avatar: { type: 'TEXT', nullable: true },
      preferences: { type: 'JSON', nullable: true },
      email_verified: { type: 'BOOLEAN', default: false },
      login_attempts: { type: 'INT', default: 0 },
      locked_until: { type: 'DATETIME', nullable: true },
      last_login: { type: 'DATETIME', nullable: true },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: ['username', 'email', 'role', 'status']
  },

  chats: {
    tableName: 'chats',
    primaryKey: 'id',
    fields: {
      id: { type: 'BIGINT', autoIncrement: true, primaryKey: true },
      user_id: { type: 'BIGINT', notNull: true, foreignKey: 'users.id' },
      title: { type: 'VARCHAR(200)', notNull: true },
      type: { type: 'ENUM("text","image","video","3d")', default: 'text' },
      model: { type: 'VARCHAR(100)', default: 'gpt-3.5-turbo' },
      is_protected: { type: 'BOOLEAN', default: false },
      is_favorite: { type: 'BOOLEAN', default: false },
      status: { type: 'ENUM("active","archived","deleted")', default: 'active' },
      message_count: { type: 'INT', default: 0 },
      tags: { type: 'JSON', nullable: true },
      metadata: { type: 'JSON', nullable: true },
      expires_at: { type: 'DATETIME', nullable: true },
      last_message_at: { type: 'DATETIME', nullable: true },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: ['user_id', 'type', 'status', 'is_favorite', 'is_protected', 'created_at']
  },

  messages: {
    tableName: 'messages',
    primaryKey: 'id',
    fields: {
      id: { type: 'BIGINT', autoIncrement: true, primaryKey: true },
      chat_id: { type: 'BIGINT', notNull: true, foreignKey: 'chats.id' },
      user_id: { type: 'BIGINT', notNull: true, foreignKey: 'users.id' },
      role: { type: 'ENUM("user","assistant","system")', notNull: true },
      content: { type: 'TEXT', notNull: true },
      type: { type: 'ENUM("text","image","file","system")', default: 'text' },
      model: { type: 'VARCHAR(100)', nullable: true },
      tokens: { type: 'INT', default: 0 },
      reasoning: { type: 'TEXT', nullable: true },
      attachments: { type: 'JSON', nullable: true },
      metadata: { type: 'JSON', nullable: true },
      parent_id: { type: 'BIGINT', nullable: true, foreignKey: 'messages.id' },
      is_edited: { type: 'BOOLEAN', default: false },
      reactions: { type: 'JSON', nullable: true },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: ['chat_id', 'user_id', 'role', 'type', 'created_at']
  },

  user_settings: {
    tableName: 'user_settings',
    primaryKey: 'id',
    fields: {
      id: { type: 'BIGINT', autoIncrement: true, primaryKey: true },
      user_id: { type: 'BIGINT', unique: true, notNull: true, foreignKey: 'users.id' },
      retention_days: { type: 'INT', default: 30 },
      auto_cleanup_enabled: { type: 'BOOLEAN', default: true },
      max_chat_limit: { type: 'INT', default: 1000 },
      notification_settings: { type: 'JSON', nullable: true },
      privacy_settings: { type: 'JSON', nullable: true },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' },
      updated_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    },
    indexes: ['user_id']
  },

  admin_messages: {
    tableName: 'admin_messages',
    primaryKey: 'id',
    fields: {
      id: { type: 'BIGINT', autoIncrement: true, primaryKey: true },
      sender_id: { type: 'BIGINT', notNull: true, foreignKey: 'users.id' },
      recipient_id: { type: 'BIGINT', nullable: true, foreignKey: 'users.id' },
      message_type: { type: 'ENUM("broadcast","direct","system")', notNull: true },
      title: { type: 'VARCHAR(200)', notNull: true },
      content: { type: 'TEXT', notNull: true },
      priority: { type: 'ENUM("low","normal","high","urgent")', default: 'normal' },
      is_read: { type: 'BOOLEAN', default: false },
      read_at: { type: 'DATETIME', nullable: true },
      expires_at: { type: 'DATETIME', nullable: true },
      created_at: { type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    },
    indexes: ['sender_id', 'recipient_id', 'message_type', 'is_read', 'created_at']
  }
};

// 数据库查询函数
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const [rows] = await pool.execute(text, params);
    const duration = Date.now() - start;
    console.log(`🔍 Query executed in ${duration}ms: ${text.substring(0, 50)}...`);
    return { rows };
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// 获取客户端连接
const getClient = () => pool.getConnection();

// 事务处理
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const client = {
      query: async (text, params = []) => {
        const [rows] = await connection.execute(text, params);
        return { rows };
      }
    };
    
    const result = await callback(client);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 生成建表SQL的工具函数
const generateCreateTableSQL = (entityName) => {
  const entity = entityMapping[entityName];
  if (!entity) throw new Error(`Entity ${entityName} not found`);
  
  let sql = `CREATE TABLE IF NOT EXISTS \`${entity.tableName}\` (`;
  const fieldDefinitions = [];
  
  for (const [fieldName, fieldConfig] of Object.entries(entity.fields)) {
    let fieldDef = `\`${fieldName}\` ${fieldConfig.type}`;
    
    if (fieldConfig.autoIncrement) fieldDef += ' AUTO_INCREMENT';
    if (fieldConfig.notNull) fieldDef += ' NOT NULL';
    if (fieldConfig.default && !fieldConfig.autoIncrement) {
      fieldDef += ` DEFAULT ${fieldConfig.default}`;
    }
    if (fieldConfig.unique) fieldDef += ' UNIQUE';
    
    fieldDefinitions.push(fieldDef);
  }
  
  // 添加主键
  fieldDefinitions.push(`PRIMARY KEY (\`${entity.primaryKey}\`)`);
  
  sql += fieldDefinitions.join(', ') + ')';
  sql += ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
  
  return sql;
};

module.exports = {
  query,
  getClient,
  transaction,
  pool,
  entityMapping,
  generateCreateTableSQL
}; 