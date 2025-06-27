const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, logAction } = require('../middleware/auth');

const router = express.Router();

// 应用认证
router.use(authenticateToken);

// 获取用户profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(`
      SELECT id, email, username, role, permissions, status, created_at, last_login
      FROM users
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      status: user.status,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// 更新用户profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const result = await query(`
      UPDATE users 
      SET username = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING username
    `, [username.trim(), userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 记录操作日志
    await logAction(userId, 'PROFILE_UPDATED', {
      newUsername: username.trim()
    }, req.ip, req.get('User-Agent'));

    res.json({
      message: 'Profile updated successfully',
      username: result.rows[0].username
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 获取用户权限
router.get('/permissions', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(`
      SELECT permissions FROM users WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      permissions: result.rows[0].permissions
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
  }
});

// 获取用户使用统计
router.get('/usage-stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    // 今日使用统计
    const todayStats = await query(`
      SELECT 
        COUNT(DISTINCT c.id) as chats_today,
        COUNT(m.id) as messages_today
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id AND DATE(m.created_at) = CURRENT_DATE
      WHERE c.user_id = $1 AND DATE(c.created_at) = CURRENT_DATE
    `, [userId]);

    // 本月使用统计
    const monthStats = await query(`
      SELECT 
        COUNT(DISTINCT c.id) as chats_month,
        COUNT(m.id) as messages_month
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id AND DATE_TRUNC('month', m.created_at) = DATE_TRUNC('month', CURRENT_DATE)
      WHERE c.user_id = $1 AND DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `, [userId]);

    // AI功能使用统计
    const aiTypeStats = await query(`
      SELECT ai_type, COUNT(*) as count
      FROM chats
      WHERE user_id = $1
      GROUP BY ai_type
      ORDER BY count DESC
    `, [userId]);

    // 最近7天的使用趋势
    const trendStats = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as chat_count
      FROM chats
      WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [userId]);

    res.json({
      today: {
        chats: parseInt(todayStats.rows[0].chats_today || 0),
        messages: parseInt(todayStats.rows[0].messages_today || 0)
      },
      month: {
        chats: parseInt(monthStats.rows[0].chats_month || 0),
        messages: parseInt(monthStats.rows[0].messages_month || 0)
      },
      aiTypeUsage: aiTypeStats.rows.map(row => ({
        type: row.ai_type,
        count: parseInt(row.count)
      })),
      weeklyTrend: trendStats.rows.map(row => ({
        date: row.date,
        count: parseInt(row.chat_count)
      }))
    });

  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// 获取活动日志
router.get('/activity-logs', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT action, details, ip_address, created_at
      FROM system_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM system_logs
      WHERE user_id = $1
    `, [userId]);

    const total = parseInt(totalResult.rows[0].total);

    res.json({
      logs: result.rows.map(log => ({
        action: log.action,
        details: log.details,
        ipAddress: log.ip_address,
        createdAt: log.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
});

module.exports = router; 