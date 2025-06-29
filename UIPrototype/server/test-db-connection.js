const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: '+08:00'
  };
  
  console.log('📋 连接配置:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password ? '***' : '(空)'
  });
  
  try {
    // 测试基础连接
    console.log('1️⃣ 测试基础MySQL连接...');
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1 as test');
    console.log('✅ MySQL连接成功');
    
    // 检查数据库是否存在
    console.log('2️⃣ 检查数据库是否存在...');
    const dbName = process.env.DB_NAME || 'database';
    const [databases] = await connection.query(`SHOW DATABASES LIKE '${dbName}'`);
    
    if (databases.length === 0) {
      console.log('📝 数据库不存在，创建中...');
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ 数据库创建成功');
    } else {
      console.log('✅ 数据库已存在');
    }
    
    // 切换到目标数据库
    await connection.query(`USE \`${dbName}\``);
    
    // 检查现有表
    console.log('3️⃣ 检查现有表结构...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📊 现有表:', tables.map(t => Object.values(t)[0]));
    
    await connection.end();
    console.log('🎉 数据库连接测试完成');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('💡 请检查:');
    console.error('   1. MySQL服务是否启动');
    console.error('   2. 用户名和密码是否正确');
    console.error('   3. 是否有访问权限');
    console.error('   4. .env文件配置是否正确');
  }
}

if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection }; 