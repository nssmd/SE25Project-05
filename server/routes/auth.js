const express = require('express');
const bcrypt = require('bcryptjs');
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
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
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
      voice_to_text: false,
      text_to_voice: false,
      file_analysis: false
    };

    if (email.startsWith('admin@')) {
      role = 'admin';
      permissions = {
        text_to_text: true,
        text_to_image: true,
        image_to_text: true,
        voice_to_text: true,
        text_to_voice: true,
        file_analysis: true
      };
    } else if (email.startsWith('support@')) {
      role = 'support';
      permissions = {
        text_to_text: true,
        text_to_image: false,
        image_to_text: true,
        voice_to_text: true,
        text_to_voice: true,
        file_analysis: true
      };
    }

    // 创建用户
    const result = await query(`
      INSERT INTO users (email, password, username, role, permissions)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, username, role, permissions, created_at
    `, [email, hashedPassword, username || email.split('@')[0], role, JSON.stringify(permissions)]);

    const user = result.rows[0];

    // 创建用户设置
    await query(`
      INSERT INTO user_settings (user_id)
      VALUES ($1)
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
        permissions: user.permissions
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
      WHERE email = $1
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
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

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
        permissions: user.permissions
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
      WHERE id = $1
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
        permissions: user.permissions
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

// 修改密码
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // 获取当前密码
    const result = await query('SELECT password FROM users WHERE id = $1', [req.user.userId]);
    const user = result.rows[0];

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, req.user.userId]);

    // 记录操作日志
    await logAction(req.user.userId, 'PASSWORD_CHANGED', {}, req.ip, req.get('User-Agent'));

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router; 