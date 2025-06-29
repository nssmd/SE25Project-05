const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { authenticateToken, requirePermission, logAction, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 应用认证和速率限制
router.use(authenticateToken);
router.use(rateLimit(60000, 20)); // 每分钟最多20个请求

// 创建新对话
router.post('/create', async (req, res) => {
  try {
    const { title, aiType = 'text_to_text' } = req.body;
    const userId = req.user.userId;

    // 检查用户权限
    const hasPermission = await require('../middleware/auth').checkPermission(userId, aiType);
    if (!hasPermission) {
      return res.status(403).json({ 
        error: `No permission for ${aiType} feature` 
      });
    }

    // 检查用户对话数量限制
    const chatCountResult = await query(`
      SELECT COUNT(*) as count 
      FROM chats 
      WHERE user_id = ? AND is_protected = false
    `, [userId]);

    const userSettingsResult = await query(`
      SELECT max_chats 
      FROM user_settings 
      WHERE user_id = ?
    `, [userId]);

    const maxChats = userSettingsResult.rows[0]?.max_chats || 100;
    const currentChats = parseInt(chatCountResult.rows[0].count);

    if (currentChats >= maxChats) {
      return res.status(429).json({ 
        error: 'Maximum chat limit reached. Please delete some chats or upgrade your plan.' 
      });
    }

    const result = await query(`
      INSERT INTO chats (user_id, title, ai_type)
      VALUES (?, ?, ?)
    `, [userId, title || 'New Chat', aiType]);

    // 获取创建的对话信息
    const chatResult = await query(`
      SELECT * FROM chats WHERE id = ?
    `, [result.insertId]);
    
    const chat = chatResult.rows[0];

    // 记录操作日志
    await logAction(userId, 'CHAT_CREATED', { 
      chatId: chat.id, 
      title: chat.title, 
      aiType 
    }, req.ip, req.get('User-Agent'));

    res.status(201).json({
      message: 'Chat created successfully',
      chat: {
        id: chat.id,
        title: chat.title,
        aiType: chat.ai_type,
        isFavorite: chat.is_favorite,
        isProtected: chat.is_protected,
        createdAt: chat.created_at
      }
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// 发送消息
router.post('/:chatId/message', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, role = 'user' } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // 验证对话归属
    const chatResult = await query(`
      SELECT ai_type 
      FROM chats 
      WHERE id = ? AND user_id = ?
    `, [chatId, userId]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const aiType = chatResult.rows[0].ai_type;

    // 检查用户权限
    const hasPermission = await require('../middleware/auth').checkPermission(userId, aiType);
    if (!hasPermission) {
      return res.status(403).json({ 
        error: `No permission for ${aiType} feature` 
      });
    }

    await transaction(async (client) => {
      // 保存用户消息
      const userMessageResult = await client.query(`
        INSERT INTO messages (chat_id, role, content)
        VALUES (?, ?, ?)
      `, [chatId, role, content]);

      // 模拟AI响应（实际项目中这里会调用AI API）
      let aiResponse = '';
      switch (aiType) {
        case 'text_to_text':
          aiResponse = `这是对"${content}"的AI回复。在实际项目中，这里会调用真实的AI API服务。`;
          break;
        case 'text_to_image':
          aiResponse = `已生成基于"${content}"的图像。图像URL: /api/generated-images/${uuidv4()}.jpg`;
          break;
        case 'image_to_text':
          aiResponse = `图像分析结果：这是一张包含${content}相关内容的图片，我可以看到...`;
          break;
        case 'text_to_audio':
          aiResponse = `语音合成完成。音频文件URL: /api/generated-audio/${uuidv4()}.mp3`;
          break;
        case 'audio_to_text':
          aiResponse = `语音转文字结果：${content}`;
          break;
        case 'multimodal':
          aiResponse = `多模态分析完成。综合处理结果：${content.substring(0, 100)}...`;
          break;
        default:
          aiResponse = `收到消息：${content}`;
      }

      // 保存AI响应
      const aiMessageResult = await client.query(`
        INSERT INTO messages (chat_id, role, content, metadata)
        VALUES (?, 'assistant', ?, ?)
      `, [chatId, aiResponse, JSON.stringify({ aiType, processedAt: new Date() })]);

      // 更新对话的更新时间和消息计数
      await client.query(`
        UPDATE chats 
        SET updated_at = NOW(), last_activity = NOW(), message_count = message_count + 2
        WHERE id = ?
      `, [chatId]);

      return {
        userMessage: userMessageResult.insertId,
        aiMessage: aiMessageResult.insertId
      };
    });

    // 记录操作日志
    await logAction(userId, 'MESSAGE_SENT', { 
      chatId, 
      aiType,
      messageLength: content.length 
    }, req.ip, req.get('User-Agent'));

    res.json({
      message: 'Message sent successfully',
      response: aiResponse
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 获取对话消息
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    // 验证对话归属
    const chatResult = await query(`
      SELECT title 
      FROM chats 
      WHERE id = ? AND user_id = ?
    `, [chatId, userId]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 获取消息
    const messagesResult = await query(`
      SELECT id, role, content, metadata, created_at
      FROM messages
      WHERE chat_id = ?
      ORDER BY created_at ASC
      LIMIT ? OFFSET ?
    `, [chatId, parseInt(limit), offset]);

    // 获取总消息数
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM messages
      WHERE chat_id = ?
    `, [chatId]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));

    const messages = messagesResult.rows.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      metadata: typeof msg.metadata === 'string' ? JSON.parse(msg.metadata || '{}') : msg.metadata,
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

// 获取用户的所有对话
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, aiType, search } = req.query;
    const userId = req.user.userId;

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (aiType) {
      whereClause += ' AND ai_type = ?';
      params.push(aiType);
    }

    if (search) {
      whereClause += ' AND title LIKE ?';
      params.push(`%${search}%`);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const chatsResult = await query(`
      SELECT id, title, ai_type, is_favorite, is_protected, message_count, 
             last_activity, created_at, updated_at
      FROM chats
      ${whereClause}
      ORDER BY last_activity DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // 获取总数
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      ${whereClause}
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
      lastActivity: chat.last_activity,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at
    }));

    res.json({
      chats,
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
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// 更新对话（标题、收藏、保护状态）
router.put('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title, isFavorite, isProtected } = req.body;
    const userId = req.user.userId;

    // 验证对话归属
    const chatResult = await query(`
      SELECT id 
      FROM chats 
      WHERE id = ? AND user_id = ?
    `, [chatId, userId]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    let updateFields = [];
    let params = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }

    if (isFavorite !== undefined) {
      updateFields.push('is_favorite = ?');
      params.push(isFavorite);
    }

    if (isProtected !== undefined) {
      updateFields.push('is_protected = ?');
      params.push(isProtected);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    params.push(chatId);

    await query(`
      UPDATE chats 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, params);

    // 记录操作日志
    await logAction(userId, 'CHAT_UPDATED', { 
      chatId, 
      updates: { title, isFavorite, isProtected }
    }, req.ip, req.get('User-Agent'));

    res.json({ message: 'Chat updated successfully' });

  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// 删除对话
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // 验证对话归属
    const chatResult = await query(`
      SELECT is_protected 
      FROM chats 
      WHERE id = ? AND user_id = ?
    `, [chatId, userId]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const chat = chatResult.rows[0];

    if (chat.is_protected) {
      return res.status(403).json({ error: 'Cannot delete protected chat' });
    }

    await transaction(async (client) => {
      // 删除消息
      await client.query('DELETE FROM messages WHERE chat_id = ?', [chatId]);
      
      // 删除对话
      await client.query('DELETE FROM chats WHERE id = ?', [chatId]);
    });

    // 记录操作日志
    await logAction(userId, 'CHAT_DELETED', { chatId }, req.ip, req.get('User-Agent'));

    res.json({ message: 'Chat deleted successfully' });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

module.exports = router; 