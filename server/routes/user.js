const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { authenticateToken, logAction, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 应用认证和速率限制
router.use(authenticateToken);
router.use(rateLimit(60000, 20)); // 每分钟最多20个请求

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(`
      SELECT u.id, u.email, u.username, u.role, u.permissions, u.status, 
             u.last_login, u.created_at, u.updated_at,
             us.auto_cleanup_enabled, us.retention_days, us.max_chats, 
             us.protected_limit, us.cleanup_frequency
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.id = ?
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
        status: user.status,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      settings: {
        autoCleanupEnabled: user.auto_cleanup_enabled || false,
        retentionDays: user.retention_days || 30,
        maxChats: user.max_chats || 100,
        protectedLimit: user.protected_limit || 10,
        cleanupFrequency: user.cleanup_frequency || 'weekly'
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// 更新用户信息
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (username.length > 100) {
      return res.status(400).json({ error: 'Username must be less than 100 characters' });
    }

    await query(`
      UPDATE users 
      SET username = ?, updated_at = NOW()
      WHERE id = ?
    `, [username.trim(), userId]);

    // 记录操作日志
    await logAction(userId, 'PROFILE_UPDATED', { 
      newUsername: username.trim() 
    }, req.ip, req.get('User-Agent'));

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 修改密码
router.post('/change-password', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // 获取当前密码
    const result = await query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = result.rows[0];

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedNewPassword, userId]);

    // 记录操作日志
    await logAction(userId, 'PASSWORD_CHANGED', {}, req.ip, req.get('User-Agent'));

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// 获取用户统计信息
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    // 获取各种统计数据
    const [
      totalChats,
      totalMessages,
      favoriteChats,
      protectedChats,
      aiTypeStats,
      recentActivity
    ] = await Promise.all([
      // 总对话数
      query('SELECT COUNT(*) as count FROM chats WHERE user_id = ?', [userId]),
      
      // 总消息数
      query(`
        SELECT COUNT(*) as count 
        FROM messages m
        JOIN chats c ON m.chat_id = c.id
        WHERE c.user_id = ?
      `, [userId]),
      
      // 收藏对话数
      query('SELECT COUNT(*) as count FROM chats WHERE user_id = ? AND is_favorite = true', [userId]),
      
      // 保护对话数
      query('SELECT COUNT(*) as count FROM chats WHERE user_id = ? AND is_protected = true', [userId]),
      
      // AI类型统计
      query(`
        SELECT ai_type, COUNT(*) as count
        FROM chats
        WHERE user_id = ?
        GROUP BY ai_type
        ORDER BY count DESC
      `, [userId]),
      
      // 最近7天活动
      query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as chat_count
        FROM chats
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [userId])
    ]);

    const stats = {
      total: {
        chats: parseInt(totalChats.rows[0].count),
        messages: parseInt(totalMessages.rows[0].count),
        favorites: parseInt(favoriteChats.rows[0].count),
        protected: parseInt(protectedChats.rows[0].count)
      },
      aiTypes: aiTypeStats.rows.map(row => ({
        type: row.ai_type,
        count: parseInt(row.count)
      })),
      recentActivity: recentActivity.rows.map(row => ({
        date: row.date,
        chatCount: parseInt(row.chat_count)
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// 获取用户操作日志
router.get('/logs', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 50, action } = req.query;

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (action) {
      whereClause += ' AND action = ?';
      params.push(action);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 获取日志
    const logsResult = await query(`
      SELECT id, action, details, ip_address, user_agent, created_at
      FROM system_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // 获取总数
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM system_logs
      ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    const logs = logsResult.rows.map(log => ({
      id: log.id,
      action: log.action,
      details: typeof log.details === 'string' ? JSON.parse(log.details || '{}') : log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at
    }));

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get user logs error:', error);
    res.status(500).json({ error: 'Failed to get user logs' });
  }
});

// 删除用户账户（危险操作）
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password, confirmText } = req.body;

    // 验证确认文本
    if (confirmText !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ 
        error: 'Confirmation text must be exactly "DELETE MY ACCOUNT"' 
      });
    }

    // 验证密码
    const userResult = await query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = userResult.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    // 删除用户所有数据
    await query('DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE user_id = ?)', [userId]);
    await query('DELETE FROM chats WHERE user_id = ?', [userId]);
    await query('DELETE FROM admin_messages WHERE from_user_id = ? OR to_user_id = ?', [userId, userId]);
    await query('DELETE FROM user_settings WHERE user_id = ?', [userId]);
    await query('DELETE FROM system_logs WHERE user_id = ?', [userId]);
    await query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// 获取可用的AI功能
router.get('/ai-features', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(`
      SELECT permissions 
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const permissions = typeof result.rows[0].permissions === 'string' 
      ? JSON.parse(result.rows[0].permissions) 
      : result.rows[0].permissions;

    const features = [
      { key: 'text_to_text', name: 'Text to Text', description: '文字对话', enabled: permissions.text_to_text || false },
      { key: 'text_to_image', name: 'Text to Image', description: '文字生成图片', enabled: permissions.text_to_image || false },
      { key: 'image_to_text', name: 'Image to Text', description: '图片理解', enabled: permissions.image_to_text || false },
      { key: 'text_to_audio', name: 'Text to Audio', description: '文字转语音', enabled: permissions.text_to_audio || false },
      { key: 'audio_to_text', name: 'Audio to Text', description: '语音转文字', enabled: permissions.audio_to_text || false },
      { key: 'multimodal', name: 'Multimodal', description: '多模态分析', enabled: permissions.multimodal || false }
    ];

    res.json({ features });

  } catch (error) {
    console.error('Get AI features error:', error);
    res.status(500).json({ error: 'Failed to get AI features' });
  }
});

module.exports = router; 