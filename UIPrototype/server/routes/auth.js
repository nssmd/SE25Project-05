const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { authenticateToken, logAction } = require('../middleware/auth');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 检查用户是否已存在
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 根据邮箱前缀确定角色
    let role = 'user';
    let permissions = {
      text_to_text: true,
      text_to_image: false,
      image_to_text: false,
      text_to_audio: false,
      audio_to_text: false,
      multimodal: false
    };

    if (email.startsWith('admin@')) {
      role = 'admin';
      permissions = {
        text_to_text: true,
        text_to_image: true,
        image_to_text: true,
        text_to_audio: true,
        audio_to_text: true,
        multimodal: true
      };
    } else if (email.startsWith('support@')) {
      role = 'support';
      permissions = {
        text_to_text: true,
        text_to_image: false,
        image_to_text: true,
        text_to_audio: false,
        audio_to_text: false,
        multimodal: true
      };
    }

    // 创建用户
    const result = await query(`
      INSERT INTO users (email, password, username, role, permissions)
      VALUES (?, ?, ?, ?, ?)
    `, [email, hashedPassword, username || email.split('@')[0], role, JSON.stringify(permissions)]);

    // 获取创建的用户信息
    const userResult = await query('SELECT id, email, username, role, permissions, created_at FROM users WHERE id = ?', [result.insertId]);
    const user = userResult.rows[0];

    // 创建用户设置
    await query(`
      INSERT INTO user_settings (user_id)
      VALUES (?)
    `, [user.id]);

    // 记录操作日志
    await logAction(user.id, 'USER_REGISTERED', { email }, req.ip, req.get('User-Agent'));

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 查找用户
    const result = await query(`
      SELECT id, email, password, username, role, status, permissions
      FROM users 
      WHERE email = ?
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is suspended or banned' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 更新最后登录时间
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // 记录操作日志
    await logAction(user.id, 'USER_LOGIN', { email }, req.ip, req.get('User-Agent'));

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 验证token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, username, role, permissions, status
      FROM users 
      WHERE id = ?
    `, [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is suspended or banned' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// 注销（客户端处理，记录日志）
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 记录操作日志
    await logAction(req.user.userId, 'USER_LOGOUT', {}, req.ip, req.get('User-Agent'));

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// 密码重置请求（演示版本，实际应该发送邮件）
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // 检查用户是否存在
    const result = await query('SELECT id, email FROM users WHERE email = ?', [email]);
    
    if (result.rows.length === 0) {
      // 为了安全，即使用户不存在也返回成功消息
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const user = result.rows[0];

    // 记录操作日志
    await logAction(user.id, 'PASSWORD_RESET_REQUESTED', { email }, req.ip, req.get('User-Agent'));

    // 在实际应用中，这里应该：
    // 1. 生成重置token
    // 2. 保存到数据库或缓存
    // 3. 发送重置邮件
    
    res.json({ 
      message: 'If the email exists, a reset link has been sent',
      // 演示模式下返回提示
      demo: 'In demo mode - password reset would be sent to email'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

module.exports = router; 