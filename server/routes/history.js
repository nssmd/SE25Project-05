const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, logAction } = require('../middleware/auth');

const router = express.Router();

// 应用认证
router.use(authenticateToken);

// 获取用户的所有对话列表
router.get('/chats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      aiType = '', 
      timeFilter = '', 
      favoriteOnly = false 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['c.user_id = $1'];
    let queryParams = [userId];
    let paramIndex = 2;

    // 搜索关键词
    if (search) {
      whereConditions.push(`(c.title ILIKE $${paramIndex} OR EXISTS (
        SELECT 1 FROM messages m 
        WHERE m.chat_id = c.id AND m.content ILIKE $${paramIndex}
      ))`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // AI功能类型筛选
    if (aiType) {
      whereConditions.push(`c.ai_type = $${paramIndex}`);
      queryParams.push(aiType);
      paramIndex++;
    }

    // 时间筛选
    if (timeFilter) {
      let timeCondition = '';
      switch (timeFilter) {
        case 'today':
          timeCondition = `c.created_at >= CURRENT_DATE`;
          break;
        case 'week':
          timeCondition = `c.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
          break;
        case 'month':
          timeCondition = `c.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
          break;
      }
      if (timeCondition) {
        whereConditions.push(timeCondition);
      }
    }

    // 仅收藏
    if (favoriteOnly === 'true') {
      whereConditions.push('c.is_favorite = true');
    }

    const whereClause = whereConditions.join(' AND ');

    // 获取对话列表
    const chatQuery = `
      SELECT 
        c.id,
        c.title,
        c.ai_type,
        c.is_favorite,
        c.is_protected,
        c.created_at,
        c.updated_at,
        (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
      FROM chats c
      WHERE ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await query(chatQuery, queryParams);

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chats c
      WHERE ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // 记录搜索操作
    if (search || aiType || timeFilter || favoriteOnly === 'true') {
      await logAction(userId, 'HISTORY_SEARCHED', { 
        search, 
        aiType, 
        timeFilter, 
        favoriteOnly,
        resultsCount: result.rows.length
      }, req.ip, req.get('User-Agent'));
    }

    res.json({
      chats: result.rows.map(chat => ({
        id: chat.id,
        title: chat.title,
        aiType: chat.ai_type,
        isFavorite: chat.is_favorite,
        isProtected: chat.is_protected,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
        lastMessage: chat.last_message ? chat.last_message.substring(0, 100) + '...' : '',
        messageCount: parseInt(chat.message_count || 0)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// 获取对话详情
router.get('/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // 获取对话基本信息
    const chatResult = await query(`
      SELECT id, title, ai_type, is_favorite, is_protected, created_at, updated_at
      FROM chats
      WHERE id = $1 AND user_id = $2
    `, [chatId, userId]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const chat = chatResult.rows[0];

    // 获取最近的消息
    const messagesResult = await query(`
      SELECT id, role, content, created_at
      FROM messages
      WHERE chat_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [chatId]);

    res.json({
      chat: {
        id: chat.id,
        title: chat.title,
        aiType: chat.ai_type,
        isFavorite: chat.is_favorite,
        isProtected: chat.is_protected,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at
      },
      recentMessages: messagesResult.rows.reverse().map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at
      }))
    });

  } catch (error) {
    console.error('Get chat detail error:', error);
    res.status(500).json({ error: 'Failed to get chat detail' });
  }
});

// 获取搜索建议
router.get('/search-suggestions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { query: searchQuery } = req.query;

    if (!searchQuery || searchQuery.length < 2) {
      return res.json({ suggestions: [] });
    }

    // 搜索相关的对话标题
    const titleSuggestions = await query(`
      SELECT DISTINCT title
      FROM chats
      WHERE user_id = $1 AND title ILIKE $2
      ORDER BY updated_at DESC
      LIMIT 5
    `, [userId, `%${searchQuery}%`]);

    // 搜索相关的消息内容关键词
    const contentSuggestions = await query(`
      SELECT DISTINCT substring(content from 1 for 50) as snippet
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE c.user_id = $1 AND m.content ILIKE $2
      ORDER BY m.created_at DESC
      LIMIT 5
    `, [userId, `%${searchQuery}%`]);

    const suggestions = [
      ...titleSuggestions.rows.map(row => ({ type: 'title', text: row.title })),
      ...contentSuggestions.rows.map(row => ({ type: 'content', text: row.snippet }))
    ];

    res.json({ suggestions });

  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ error: 'Failed to get search suggestions' });
  }
});

// 获取用户统计信息
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    // 总对话数
    const totalChatsResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      WHERE user_id = $1
    `, [userId]);

    // 各类型对话数量
    const aiTypeStatsResult = await query(`
      SELECT ai_type, COUNT(*) as count
      FROM chats
      WHERE user_id = $1
      GROUP BY ai_type
      ORDER BY count DESC
    `, [userId]);

    // 收藏对话数
    const favoriteChatsResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      WHERE user_id = $1 AND is_favorite = true
    `, [userId]);

    // 保护对话数
    const protectedChatsResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      WHERE user_id = $1 AND is_protected = true
    `, [userId]);

    // 今日对话数
    const todayChatsResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      WHERE user_id = $1 AND created_at >= CURRENT_DATE
    `, [userId]);

    // 本周对话数
    const weekChatsResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `, [userId]);

    // 总消息数
    const totalMessagesResult = await query(`
      SELECT COUNT(*) as total
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE c.user_id = $1
    `, [userId]);

    res.json({
      totalChats: parseInt(totalChatsResult.rows[0].total),
      favoriteChats: parseInt(favoriteChatsResult.rows[0].total),
      protectedChats: parseInt(protectedChatsResult.rows[0].total),
      todayChats: parseInt(todayChatsResult.rows[0].total),
      weekChats: parseInt(weekChatsResult.rows[0].total),
      totalMessages: parseInt(totalMessagesResult.rows[0].total),
      aiTypeStats: aiTypeStatsResult.rows.map(row => ({
        type: row.ai_type,
        count: parseInt(row.count)
      }))
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// 批量操作对话
router.post('/batch-operation', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { operation, chatIds } = req.body;

    if (!operation || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ error: 'Invalid operation or chat IDs' });
    }

    // 验证所有对话都属于当前用户
    const chatValidationResult = await query(`
      SELECT id, is_protected
      FROM chats
      WHERE id = ANY($1) AND user_id = $2
    `, [chatIds, userId]);

    if (chatValidationResult.rows.length !== chatIds.length) {
      return res.status(403).json({ error: 'Some chats not found or access denied' });
    }

    let affectedCount = 0;

    switch (operation) {
      case 'delete':
        // 检查是否有保护的对话
        const protectedChats = chatValidationResult.rows.filter(chat => chat.is_protected);
        if (protectedChats.length > 0) {
          return res.status(403).json({ 
            error: 'Cannot delete protected chats',
            protectedChatIds: protectedChats.map(chat => chat.id)
          });
        }

        // 删除消息和对话
        await query('DELETE FROM messages WHERE chat_id = ANY($1)', [chatIds]);
        const deleteResult = await query('DELETE FROM chats WHERE id = ANY($1) AND user_id = $2', [chatIds, userId]);
        affectedCount = deleteResult.rowCount;
        break;

      case 'favorite':
        const favoriteResult = await query(`
          UPDATE chats 
          SET is_favorite = true, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) AND user_id = $2
        `, [chatIds, userId]);
        affectedCount = favoriteResult.rowCount;
        break;

      case 'unfavorite':
        const unfavoriteResult = await query(`
          UPDATE chats 
          SET is_favorite = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) AND user_id = $2
        `, [chatIds, userId]);
        affectedCount = unfavoriteResult.rowCount;
        break;

      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    // 记录批量操作日志
    await logAction(userId, 'BATCH_OPERATION', { 
      operation, 
      chatIds, 
      affectedCount 
    }, req.ip, req.get('User-Agent'));

    res.json({
      message: `Batch ${operation} completed successfully`,
      affectedCount
    });

  } catch (error) {
    console.error('Batch operation error:', error);
    res.status(500).json({ error: 'Batch operation failed' });
  }
});

module.exports = router; 