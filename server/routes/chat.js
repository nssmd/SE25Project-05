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
      WHERE user_id = $1 AND is_protected = false
    `, [userId]);

    const userSettingsResult = await query(`
      SELECT max_chats 
      FROM user_settings 
      WHERE user_id = $1
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
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, title || 'New Chat', aiType]);

    const chat = result.rows[0];

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
      WHERE id = $1 AND user_id = $2
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
        VALUES ($1, $2, $3)
        RETURNING *
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
        case 'voice_to_text':
          aiResponse = `语音转文字结果：${content}`;
          break;
        case 'text_to_voice':
          aiResponse = `语音合成完成。音频文件URL: /api/generated-audio/${uuidv4()}.mp3`;
          break;
        case 'file_analysis':
          aiResponse = `文件分析完成。文件内容摘要：${content.substring(0, 100)}...`;
          break;
        default:
          aiResponse = `收到消息：${content}`;
      }

      // 保存AI响应
      const aiMessageResult = await client.query(`
        INSERT INTO messages (chat_id, role, content, metadata)
        VALUES ($1, 'assistant', $2, $3)
        RETURNING *
      `, [chatId, aiResponse, JSON.stringify({ aiType, processedAt: new Date() })]);

      // 更新对话的更新时间
      await client.query(`
        UPDATE chats 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [chatId]);

      return {
        userMessage: userMessageResult.rows[0],
        aiMessage: aiMessageResult.rows[0]
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
      WHERE id = $1 AND user_id = $2
    `, [chatId, userId]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT id, role, content, metadata, created_at
      FROM messages
      WHERE chat_id = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
    `, [chatId, limit, offset]);

    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM messages
      WHERE chat_id = $1
    `, [chatId]);

    const total = parseInt(totalResult.rows[0].total);

    res.json({
      messages: result.rows.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
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
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// 删除对话
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // 验证对话归属
    const chatResult = await query(`
      SELECT title, is_protected 
      FROM chats 
      WHERE id = $1 AND user_id = $2
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
      await client.query('DELETE FROM messages WHERE chat_id = $1', [chatId]);
      // 删除对话
      await client.query('DELETE FROM chats WHERE id = $1', [chatId]);
    });

    // 记录操作日志
    await logAction(userId, 'CHAT_DELETED', { 
      chatId, 
      title: chat.title 
    }, req.ip, req.get('User-Agent'));

    res.json({ message: 'Chat deleted successfully' });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// 更新对话标题
router.patch('/:chatId/title', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user.userId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await query(`
      UPDATE chats 
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING title
    `, [title, chatId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    // 记录操作日志
    await logAction(userId, 'CHAT_TITLE_UPDATED', { 
      chatId, 
      newTitle: title 
    }, req.ip, req.get('User-Agent'));

    res.json({ 
      message: 'Chat title updated successfully',
      title: result.rows[0].title
    });

  } catch (error) {
    console.error('Update chat title error:', error);
    res.status(500).json({ error: 'Failed to update chat title' });
  }
});

// 切换收藏状态
router.patch('/:chatId/favorite', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const result = await query(`
      UPDATE chats 
      SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING is_favorite
    `, [chatId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const isFavorite = result.rows[0].is_favorite;

    // 记录操作日志
    await logAction(userId, 'CHAT_FAVORITE_TOGGLED', { 
      chatId, 
      isFavorite 
    }, req.ip, req.get('User-Agent'));

    res.json({ 
      message: 'Favorite status updated successfully',
      isFavorite
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
});

// 切换保护状态
router.patch('/:chatId/protect', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // 检查保护对话数量限制
    const protectedCountResult = await query(`
      SELECT COUNT(*) as count 
      FROM chats 
      WHERE user_id = $1 AND is_protected = true
    `, [userId]);

    const userSettingsResult = await query(`
      SELECT protected_chats 
      FROM user_settings 
      WHERE user_id = $1
    `, [userId]);

    const maxProtected = userSettingsResult.rows[0]?.protected_chats || 10;
    const currentProtected = parseInt(protectedCountResult.rows[0].count);

    // 检查当前对话状态
    const chatResult = await query(`
      SELECT is_protected 
      FROM chats 
      WHERE id = $1 AND user_id = $2
    `, [chatId, userId]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const currentlyProtected = chatResult.rows[0].is_protected;

    // 如果要设置为保护状态，检查数量限制
    if (!currentlyProtected && currentProtected >= maxProtected) {
      return res.status(429).json({ 
        error: 'Maximum protected chat limit reached.' 
      });
    }

    const result = await query(`
      UPDATE chats 
      SET is_protected = NOT is_protected, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING is_protected
    `, [chatId, userId]);

    const isProtected = result.rows[0].is_protected;

    // 记录操作日志
    await logAction(userId, 'CHAT_PROTECTION_TOGGLED', { 
      chatId, 
      isProtected 
    }, req.ip, req.get('User-Agent'));

    res.json({ 
      message: 'Protection status updated successfully',
      isProtected
    });

  } catch (error) {
    console.error('Toggle protection error:', error);
    res.status(500).json({ error: 'Failed to toggle protection status' });
  }
});

module.exports = router; 