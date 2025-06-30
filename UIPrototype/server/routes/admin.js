const express = require('express');
const bcrypt = require('bcrypt');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin, requireAdminOrSupport, logAction, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 应用认证和权限检查
router.use(authenticateToken);
router.use(rateLimit(60000, 30)); // 每分钟最多30个请求

// 获取所有用户列表（管理员和客服）
router.get('/users', requireAdminOrSupport, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;

    let whereConditions = [];
    let params = [];

    if (search.trim()) {
      whereConditions.push('(email LIKE ? OR username LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 获取用户列表
    const usersResult = await query(`
      SELECT id, email, username, role, status, permissions, last_login, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // 获取总数
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    const users = usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
      lastLogin: user.last_login,
      createdAt: user.created_at
    }));

    res.json({
      users,
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
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// 获取特定用户详情（管理员和客服）
router.get('/users/:userId', requireAdminOrSupport, async (req, res) => {
  try {
    const { userId } = req.params;

    // 获取用户基本信息
    const userResult = await query(`
      SELECT u.id, u.email, u.username, u.role, u.status, u.permissions, u.last_login, u.created_at, u.updated_at,
             us.auto_cleanup_enabled, us.retention_days, us.max_chats, us.protected_limit, us.cleanup_frequency
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.id = ?
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // 获取用户统计信息
    const [chatStats, messageStats, favoriteStats] = await Promise.all([
      query('SELECT COUNT(*) as count FROM chats WHERE user_id = ?', [userId]),
      query(`
        SELECT COUNT(*) as count 
        FROM messages m 
        JOIN chats c ON m.chat_id = c.id 
        WHERE c.user_id = ?
      `, [userId]),
      query('SELECT COUNT(*) as count FROM chats WHERE user_id = ? AND is_favorite = true', [userId])
    ]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
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
      },
      stats: {
        totalChats: parseInt(chatStats.rows[0].count),
        totalMessages: parseInt(messageStats.rows[0].count),
        favoriteChats: parseInt(favoriteStats.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ error: 'Failed to get user detail' });
  }
});

// 更新用户状态（仅管理员）
router.put('/users/:userId/status', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'banned', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 不能修改自己的状态
    if (parseInt(userId) === req.user.userId) {
      return res.status(403).json({ error: 'Cannot modify your own status' });
    }

    await query(`
      UPDATE users 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `, [status, userId]);

    // 记录操作日志
    await logAction(req.user.userId, 'USER_STATUS_UPDATED', {
      targetUserId: parseInt(userId),
      newStatus: status
    }, req.ip, req.get('User-Agent'));

    res.json({ message: 'User status updated successfully' });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// 更新用户权限（仅管理员）
router.put('/users/:userId/permissions', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const permissions = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'Invalid permissions' });
    }

    // 验证权限字段
    const validPermissions = [
      'text_to_text', 'text_to_image', 'image_to_image', 'image_to_text', 
      'text_to_video', 'text_to_3d', 'chat', 'file_upload', 'data_export',
      'text_to_audio', 'audio_to_text', 'multimodal'  // 保留原有字段兼容性
    ];
    const permissionKeys = Object.keys(permissions);
    
    if (!permissionKeys.every(key => validPermissions.includes(key))) {
      return res.status(400).json({ 
        error: 'Invalid permission keys', 
        invalidKeys: permissionKeys.filter(key => !validPermissions.includes(key)),
        validKeys: validPermissions
      });
    }

    await query(`
      UPDATE users 
      SET permissions = ?, updated_at = NOW()
      WHERE id = ?
    `, [JSON.stringify(permissions), userId]);

    // 记录操作日志
    await logAction(req.user.userId, 'USER_PERMISSIONS_UPDATED', {
      targetUserId: parseInt(userId),
      newPermissions: permissions
    }, req.ip, req.get('User-Agent'));

    res.json({ message: 'User permissions updated successfully' });

  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({ error: 'Failed to update user permissions' });
  }
});

// 重置用户密码（仅管理员）
router.post('/users/:userId/reset-password', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // 不能重置自己的密码
    if (parseInt(userId) === req.user.userId) {
      return res.status(403).json({ error: 'Cannot reset your own password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(`
      UPDATE users 
      SET password = ?, updated_at = NOW()
      WHERE id = ?
    `, [hashedPassword, userId]);

    // 记录操作日志
    await logAction(req.user.userId, 'USER_PASSWORD_RESET', {
      targetUserId: parseInt(userId)
    }, req.ip, req.get('User-Agent'));

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// 发送消息给用户（管理员和客服）
router.post('/users/:userId/message', requireAdminOrSupport, async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, content, messageType = 'private' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (!['private', 'broadcast'].includes(messageType)) {
      return res.status(400).json({ error: 'Invalid message type' });
    }

    // 验证目标用户存在
    if (messageType === 'private') {
      const userResult = await query('SELECT id FROM users WHERE id = ?', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    await query(`
      INSERT INTO admin_messages (from_user_id, to_user_id, message_type, subject, content)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.userId,
      messageType === 'private' ? userId : null,
      messageType,
      subject || null,
      content
    ]);

    // 记录操作日志
    await logAction(req.user.userId, 'ADMIN_MESSAGE_SENT', {
      targetUserId: messageType === 'private' ? parseInt(userId) : null,
      messageType,
      subject,
      contentLength: content.length
    }, req.ip, req.get('User-Agent'));

    res.json({ message: 'Message sent successfully' });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 获取管理员消息列表（管理员和客服）
router.get('/messages', requireAdminOrSupport, async (req, res) => {
  try {
    const { page = 1, limit = 20, messageType = '', sent = 'true' } = req.query;

    let whereConditions = [];
    let params = [];

    if (sent === 'true') {
      // 获取发送的消息
      whereConditions.push('from_user_id = ?');
      params.push(req.user.userId);
    } else {
      // 获取接收的消息
      whereConditions.push('(to_user_id = ? OR message_type = "broadcast")');
      params.push(req.user.userId);
    }

    if (messageType) {
      whereConditions.push('message_type = ?');
      params.push(messageType);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const messagesResult = await query(`
      SELECT am.id, am.from_user_id, am.to_user_id, am.message_type, am.subject, 
             am.content, am.is_read, am.created_at,
             u1.username as from_username, u1.email as from_email,
             u2.username as to_username, u2.email as to_email
      FROM admin_messages am
      LEFT JOIN users u1 ON am.from_user_id = u1.id
      LEFT JOIN users u2 ON am.to_user_id = u2.id
      WHERE ${whereClause}
      ORDER BY am.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // 获取总数
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM admin_messages am
      WHERE ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    const messages = messagesResult.rows.map(msg => ({
      id: msg.id,
      fromUserId: msg.from_user_id,
      fromUsername: msg.from_username,
      fromEmail: msg.from_email,
      toUserId: msg.to_user_id,
      toUsername: msg.to_username,
      toEmail: msg.to_email,
      messageType: msg.message_type,
      subject: msg.subject,
      content: msg.content,
      isRead: msg.is_read,
      createdAt: msg.created_at
    }));

    res.json({
      messages,
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
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// 标记消息为已读（管理员和客服）
router.put('/messages/:messageId/read', requireAdminOrSupport, async (req, res) => {
  try {
    const { messageId } = req.params;

    await query(`
      UPDATE admin_messages 
      SET is_read = true
      WHERE id = ? AND (to_user_id = ? OR message_type = 'broadcast')
    `, [messageId, req.user.userId]);

    res.json({ message: 'Message marked as read' });

  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// 获取系统统计信息（仅管理员）
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // 获取各种统计数据
    const [
      userStats,
      chatStats,
      messageStats,
      roleStats,
      recentActivity
    ] = await Promise.all([
      // 用户统计
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) as banned,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
        FROM users
      `),
      
      // 对话统计
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) as today,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week
        FROM chats
      `),
      
      // 消息统计
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) as today,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week
        FROM messages
      `),
      
      // 角色统计
      query(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `),
      
      // 最近7天注册用户
      query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as user_count
        FROM users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)
    ]);

    const stats = {
      users: {
        total: parseInt(userStats.rows[0].total),
        active: parseInt(userStats.rows[0].active),
        banned: parseInt(userStats.rows[0].banned),
        inactive: parseInt(userStats.rows[0].inactive)
      },
      chats: {
        total: parseInt(chatStats.rows[0].total),
        today: parseInt(chatStats.rows[0].today),
        week: parseInt(chatStats.rows[0].week)
      },
      messages: {
        total: parseInt(messageStats.rows[0].total),
        today: parseInt(messageStats.rows[0].today),
        week: parseInt(messageStats.rows[0].week)
      },
      roles: roleStats.rows.reduce((acc, row) => {
        acc[row.role] = parseInt(row.count);
        return acc;
      }, {}),
      recentActivity: recentActivity.rows.map(row => ({
        date: row.date,
        userCount: parseInt(row.user_count)
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// 获取系统日志（仅管理员）
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action = '', userId = '' } = req.query;

    let whereConditions = [];
    let params = [];

    if (action) {
      whereConditions.push('action = ?');
      params.push(action);
    }

    if (userId) {
      whereConditions.push('user_id = ?');
      params.push(parseInt(userId));
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const logsResult = await query(`
      SELECT sl.id, sl.user_id, sl.action, sl.details, sl.ip_address, sl.user_agent, sl.created_at,
             u.email, u.username
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // 获取总数
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM system_logs sl
      ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    const logs = logsResult.rows.map(log => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.email,
      userName: log.username,
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
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

module.exports = router; 