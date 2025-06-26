const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// 路由导入
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');
const historyRoutes = require('./routes/history');
const dataRoutes = require('./routes/data');
const adminRoutes = require('./routes/admin');

// 数据库连接
const db = require('./config/database');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 定时任务 - 每天凌晨2点执行数据清理
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily data cleanup...');
  try {
    const { cleanupExpiredChats } = require('./services/dataService');
    await cleanupExpiredChats();
    console.log('Daily cleanup completed');
  } catch (error) {
    console.error('Daily cleanup failed:', error);
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app; 