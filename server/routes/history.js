const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, logAction, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 应用认证和速率限制
router.use(authenticateToken);
router.use(rateLimit(60000, 30)); // 每分钟最多30个请求
44
// 搜索对话历史
router.get('/search', async (req, res) => {
  try {
    const { 
      keyword = '', 
      timeFilter = 'all', 
      aiType = 'all',
      isFavorite,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const userId = req.user.userId;

    // 构建查询条件
    let whereConditions = ['c.user_id = ?'];
    let params = [userId];

    // 关键词搜索
    if (keyword.trim()) {
      whereConditions.push('(c.title LIKE ? OR EXISTS (SELECT 1 FROM messages m WHERE m.chat_id = c.id AND m.content LIKE ?))');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 时间过滤
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        whereConditions.push('DATE(c.created_at) = DATE(NOW())');
        break;
      case 'week':
        whereConditions.push('c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
        break;
      case 'month':
        whereConditions.push('c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
        break;
    }

    // AI类型过滤
    if (aiType !== 'all') {
      whereConditions.push('c.ai_type = ?');
      params.push(aiType);
    }

    // 收藏过滤
    if (isFavorite !== undefined) {
      whereConditions.push('c.is_favorite = ?');
      params.push(isFavorite === 'true');
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 获取对话列表
    const chatsResult = await query(`
      SELECT 
        c.id,
        c.title,
        c.ai_type,
        c.is_favorite,
        c.is_protected,
        c.message_count,
        c.last_activity,
        c.created_at,
        c.updated_at,
        (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at ASC LIMIT 1) as first_message
      FROM chats c
      WHERE ${whereClause}
      ORDER BY c.last_activity DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // 获取总数
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM chats c
      WHERE ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    const chats = chatsResult.rows.map(chat => ({
      id: chat.id,
      title: chat.title,
      aiType: chat.ai_type,
      isFavorite: chat.is_favorite,
      isProtected: chat.is_protected,
      messageCount: chat.message_count,
      preview: chat.first_message ? chat.first_message.substring(0, 100) + '...' : 'No messages',
      lastActivity: chat.last_activity,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at
    }));

    // 记录搜索日志
    await logAction(userId, 'HISTORY_SEARCHED', { 
      keyword, 
      timeFilter, 
      aiType, 
      isFavorite,
      resultsCount: chats.length 
    }, req.ip, req.get('User-Agent'));

    res.json({
      chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      filters: {
        keyword,
        timeFilter,
        aiType,
        isFavorite
      }
    });

  } catch (error) {
    console.error('History search error:', error);
    res.status(500).json({ error: 'Failed to search history' });
  }
});

// 获取对话详情（包含所有消息）
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // 验证对话归属
    const chatResult = await query(`
      SELECT id, title, ai_type, is_favorite, is_protected, message_count, created_at, updated_at
      FROM chats
      WHERE id = ? AND user_id = ?
    `, [chatId, userId]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const chat = chatResult.rows[0];

    // 获取所有消息
    const messagesResult = await query(`
      SELECT id, role, content, metadata, created_at
      FROM messages
      WHERE chat_id = ?
      ORDER BY created_at ASC
    `, [chatId]);

    const messages = messagesResult.rows.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      metadata: typeof msg.metadata === 'string' ? JSON.parse(msg.metadata || '{}') : msg.metadata,
      createdAt: msg.created_at
    }));

    // 记录查看日志
    await logAction(userId, 'CHAT_VIEWED', { 
      chatId,
      title: chat.title
    }, req.ip, req.get('User-Agent'));

    res.json({
      chat: {
        id: chat.id,
        title: chat.title,
        aiType: chat.ai_type,
        isFavorite: chat.is_favorite,
        isProtected: chat.is_protected,
        messageCount: chat.message_count,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at
      },
      messages
    });

  } catch (error) {
    console.error('Get chat detail error:', error);
    res.status(500).json({ error: 'Failed to get chat detail' });
  }
});

// 批量删除对话
router.post('/batch-delete', async (req, res) => {
  try {
    const { chatIds } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ error: 'Invalid chat IDs' });
    }

    // 验证所有对话归属且非保护状态
    const placeholders = chatIds.map(() => '?').join(',');
    const chatResult = await query(`
      SELECT id, title, is_protected
      FROM chats
      WHERE id IN (${placeholders}) AND user_id = ?
    `, [...chatIds, userId]);

    if (chatResult.rows.length !== chatIds.length) {
      return res.status(404).json({ error: 'Some chats not found or access denied' });
    }

    // 检查是否有保护的对话
    const protectedChats = chatResult.rows.filter(chat => chat.is_protected);
    if (protectedChats.length > 0) {
      return res.status(403).json({ 
        error: 'Cannot delete protected chats',
        protectedChats: protectedChats.map(chat => ({ id: chat.id, title: chat.title }))
      });
    }

    // 删除消息和对话
    await query(`DELETE FROM messages WHERE chat_id IN (${placeholders})`, chatIds);
    await query(`DELETE FROM chats WHERE id IN (${placeholders})`, chatIds);

    // 记录操作日志
    await logAction(userId, 'BATCH_DELETE_CHATS', { 
      chatIds,
      deletedCount: chatIds.length
    }, req.ip, req.get('User-Agent'));

    res.json({ 
      message: `Successfully deleted ${chatIds.length} chats`,
      deletedCount: chatIds.length
    });

  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: 'Failed to delete chats' });
  }
});

// 批量设置收藏状态
router.post('/batch-favorite', async (req, res) => {
  try {
    const { chatIds, isFavorite } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ error: 'Invalid chat IDs' });
    }

    if (typeof isFavorite !== 'boolean') {
      return res.status(400).json({ error: 'isFavorite must be a boolean' });
    }

    // 验证所有对话归属
    const placeholders = chatIds.map(() => '?').join(',');
    const chatResult = await query(`
      SELECT id
      FROM chats
      WHERE id IN (${placeholders}) AND user_id = ?
    `, [...chatIds, userId]);

    if (chatResult.rows.length !== chatIds.length) {
      return res.status(404).json({ error: 'Some chats not found or access denied' });
    }

    // 更新收藏状态
    await query(`
      UPDATE chats 
      SET is_favorite = ?, updated_at = NOW()
      WHERE id IN (${placeholders})
    `, [isFavorite, ...chatIds]);

    // 记录操作日志
    await logAction(userId, 'BATCH_FAVORITE_CHATS', { 
      chatIds,
      isFavorite,
      updatedCount: chatIds.length
    }, req.ip, req.get('User-Agent'));

    res.json({ 
      message: `Successfully ${isFavorite ? 'favorited' : 'unfavorited'} ${chatIds.length} chats`,
      updatedCount: chatIds.length
    });

  } catch (error) {
    console.error('Batch favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
});

// 导出对话历史
router.post('/export', async (req, res) => {
  try {
    const { chatIds, format = 'json' } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ error: 'Invalid chat IDs' });
    }

    // 验证所有对话归属
    const placeholders = chatIds.map(() => '?').join(',');
    const chatResult = await query(`
      SELECT c.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', m.id,
                 'role', m.role,
                 'content', m.content,
                 'metadata', m.metadata,
                 'created_at', m.created_at
               )
             ) as messages
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.id IN (${placeholders}) AND c.user_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [...chatIds, userId]);

    if (chatResult.rows.length !== chatIds.length) {
      return res.status(404).json({ error: 'Some chats not found or access denied' });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      chatCount: chatResult.rows.length,
      chats: chatResult.rows.map(chat => ({
        id: chat.id,
        title: chat.title,
        aiType: chat.ai_type,
        isFavorite: chat.is_favorite,
        isProtected: chat.is_protected,
        messageCount: chat.message_count,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
        messages: typeof chat.messages === 'string' ? JSON.parse(chat.messages) : chat.messages
      }))
    };

    // 记录导出日志
    await logAction(userId, 'CHATS_EXPORTED', { 
      chatIds,
      format,
      chatCount: chatResult.rows.length
    }, req.ip, req.get('User-Agent'));

    if (format === 'txt') {
      // 生成文本格式
      let txtContent = `聊天记录导出\n导出时间: ${exportData.exportedAt}\n聊天数量: ${exportData.chatCount}\n\n`;
      
      exportData.chats.forEach((chat, index) => {
        txtContent += `=========== 对话 ${index + 1}: ${chat.title} ===========\n`;
        txtContent += `AI类型: ${chat.aiType}\n`;
        txtContent += `创建时间: ${chat.createdAt}\n`;
        txtContent += `消息数量: ${chat.messageCount}\n\n`;
        
        if (chat.messages && chat.messages.length > 0) {
          chat.messages.forEach(msg => {
            txtContent += `[${msg.role.toUpperCase()}] ${msg.created_at}\n${msg.content}\n\n`;
          });
        }
        
        txtContent += '\n';
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="chat-history.txt"');
      res.send(txtContent);
    } else {
      // 默认JSON格式
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="chat-history.json"');
      res.json(exportData);
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export chat history' });
  }
});

// 获取历史统计信息
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 获取各种统计数据
    const [totalChats, totalMessages, favoriteChats, protectedChats, aiTypeStats] = await Promise.all([
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
      `, [userId])
    ]);

    // 最近7天的活动统计
    const activityResult = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as chat_count
      FROM chats
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [userId]);

    const stats = {
      total: {
        chats: parseInt(totalChats.rows[0].count),
        messages: parseInt(totalMessages.rows[0].count),
        favorites: parseInt(favoriteChats.rows[0].count),
        protected: parseInt(protectedChats.rows[0].count)
      },
      aiTypes: aiTypeStats.rows.reduce((acc, row) => {
        acc[row.ai_type] = parseInt(row.count);
        return acc;
      }, {}),
      recentActivity: activityResult.rows.map(row => ({
        date: row.date,
        chatCount: parseInt(row.chat_count)
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router; 