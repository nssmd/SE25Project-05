const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin, requireAdminOrSupport, logAction } = require('../middleware/auth');

const router = express.Router();

// 应用认证和权限验证
router.use(authenticateToken);

// 获取所有用户列表（管理员和客服可访问）
router.get('/users', requireAdminOrSupport, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // 搜索条件
    if (search) {
      whereConditions.push(`(email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 角色筛选
    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    // 状态筛选
    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const result = await query(`
      SELECT 
        id, email, username, role, status, permissions, 
        created_at, last_login,
        (SELECT COUNT(*) FROM chats WHERE user_id = users.id) as chat_count
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    const countResult = await query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        chatCount: parseInt(user.chat_count || 0)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// 更新用户状态（仅管理员）
router.patch('/users/:userId/status', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const adminUserId = req.user.userId;

    if (!['active', 'banned', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 不能修改自己的状态
    if (userId === adminUserId) {
      return res.status(403).json({ error: 'Cannot modify your own status' });
    }

    const result = await query(`
      UPDATE users 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING email, username, status
    `, [status, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // 记录操作日志
    await logAction(adminUserId, 'USER_STATUS_CHANGED', {
      targetUserId: userId,
      targetUserEmail: user.email,
      newStatus: status
    }, req.ip, req.get('User-Agent'));

    res.json({
      message: 'User status updated successfully',
      user: {
        email: user.email,
        username: user.username,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// 更新用户权限（仅管理员）
router.patch('/users/:userId/permissions', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    const adminUserId = req.user.userId;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'Invalid permissions object' });
    }

    // 验证权限字段
    const validPermissions = [
      'text_to_text', 'text_to_image', 'image_to_text',
      'voice_to_text', 'text_to_voice', 'file_analysis'
    ];

    for (const [key, value] of Object.entries(permissions)) {
      if (!validPermissions.includes(key) || typeof value !== 'boolean') {
        return res.status(400).json({ error: `Invalid permission: ${key}` });
      }
    }

    const result = await query(`
      UPDATE users 
      SET permissions = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING email, username, permissions
    `, [JSON.stringify(permissions), userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // 记录操作日志
    await logAction(adminUserId, 'USER_PERMISSIONS_CHANGED', {
      targetUserId: userId,
      targetUserEmail: user.email,
      newPermissions: permissions
    }, req.ip, req.get('User-Agent'));

    res.json({
      message: 'User permissions updated successfully',
      user: {
        email: user.email,
        username: user.username,
        permissions: user.permissions
      }
    });

  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({ error: 'Failed to update user permissions' });
  }
});

// 发送消息给用户（管理员和客服）
router.post('/messages/send', requireAdminOrSupport, async (req, res) => {
  try {
    const { recipientId, title, content, messageType = 'personal' } = req.body;
    const senderUserId = req.user.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (!['broadcast', 'personal'].includes(messageType)) {
      return res.status(400).json({ error: 'Invalid message type' });
    }

    // 如果是个人消息，验证收件人
    if (messageType === 'personal') {
      if (!recipientId) {
        return res.status(400).json({ error: 'Recipient ID is required for personal messages' });
      }

      const recipientResult = await query(`
        SELECT id, email FROM users WHERE id = $1
      `, [recipientId]);

      if (recipientResult.rows.length === 0) {
        return res.status(404).json({ error: 'Recipient not found' });
      }
    }

    const result = await query(`
      INSERT INTO admin_messages (sender_id, recipient_id, message_type, title, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [senderUserId, messageType === 'personal' ? recipientId : null, messageType, title, content]);

    const message = result.rows[0];

    // 记录操作日志
    await logAction(senderUserId, 'ADMIN_MESSAGE_SENT', {
      messageId: message.id,
      messageType,
      recipientId: messageType === 'personal' ? recipientId : null,
      title
    }, req.ip, req.get('User-Agent'));

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: message.id
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 获取发送的消息历史（管理员和客服）
router.get('/messages/sent', requireAdminOrSupport, async (req, res) => {
  try {
    const senderUserId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT 
        am.*,
        u.email as recipient_email,
        u.username as recipient_username
      FROM admin_messages am
      LEFT JOIN users u ON am.recipient_id = u.id
      WHERE am.sender_id = $1
      ORDER BY am.created_at DESC
      LIMIT $2 OFFSET $3
    `, [senderUserId, limit, offset]);

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM admin_messages
      WHERE sender_id = $1
    `, [senderUserId]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      messages: result.rows.map(msg => ({
        id: msg.id,
        messageType: msg.message_type,
        title: msg.title,
        content: msg.content,
        status: msg.status,
        recipientEmail: msg.recipient_email,
        recipientUsername: msg.recipient_username,
        createdAt: msg.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ error: 'Failed to get sent messages' });
  }
});

// 获取系统统计（仅管理员）
router.get('/statistics', requireAdmin, async (req, res) => {
  try {
    // 用户统计
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_users,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'support' THEN 1 END) as support_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
      FROM users
    `);

    // 对话统计
    const chatStats = await query(`
      SELECT 
        COUNT(*) as total_chats,
        COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorite_chats,
        COUNT(CASE WHEN is_protected = true THEN 1 END) as protected_chats,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_chats,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_chats
      FROM chats
    `);

    // 消息统计
    const messageStats = await query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_messages,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_messages
      FROM messages
    `);

    // AI功能使用统计
    const aiTypeStats = await query(`
      SELECT ai_type, COUNT(*) as count
      FROM chats
      GROUP BY ai_type
      ORDER BY count DESC
    `);

    // 最近7天的注册趋势
    const registrationTrend = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.json({
      users: {
        total: parseInt(userStats.rows[0].total_users),
        active: parseInt(userStats.rows[0].active_users),
        banned: parseInt(userStats.rows[0].banned_users),
        suspended: parseInt(userStats.rows[0].suspended_users),
        admins: parseInt(userStats.rows[0].admin_users),
        support: parseInt(userStats.rows[0].support_users),
        regular: parseInt(userStats.rows[0].regular_users)
      },
      chats: {
        total: parseInt(chatStats.rows[0].total_chats),
        favorite: parseInt(chatStats.rows[0].favorite_chats),
        protected: parseInt(chatStats.rows[0].protected_chats),
        today: parseInt(chatStats.rows[0].today_chats),
        week: parseInt(chatStats.rows[0].week_chats)
      },
      messages: {
        total: parseInt(messageStats.rows[0].total_messages),
        today: parseInt(messageStats.rows[0].today_messages),
        week: parseInt(messageStats.rows[0].week_messages)
      },
      aiTypeUsage: aiTypeStats.rows.map(row => ({
        type: row.ai_type,
        count: parseInt(row.count)
      })),
      registrationTrend: registrationTrend.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count)
      }))
    });

  } catch (error) {
    console.error('Get admin statistics error:', error);
    res.status(500).json({ error: 'Failed to get admin statistics' });
  }
});

// 获取系统日志（仅管理员）
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action = '', userId = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (action) {
      whereConditions.push(`sl.action ILIKE $${paramIndex}`);
      queryParams.push(`%${action}%`);
      paramIndex++;
    }

    if (userId) {
      whereConditions.push(`sl.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const result = await query(`
      SELECT 
        sl.*,
        u.email as user_email,
        u.username as user_username
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM system_logs sl
      ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      logs: result.rows.map(log => ({
        id: log.id,
        userId: log.user_id,
        userEmail: log.user_email,
        username: log.user_username,
        action: log.action,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
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
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to get admin logs' });
  }
});

module.exports = router; 