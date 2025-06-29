const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, logAction, rateLimit } = require('../middleware/auth');

const router = express.Router();

// 应用认证和速率限制
router.use(authenticateToken);
router.use(rateLimit(60000, 10)); // 每分钟最多10个请求

// 获取用户设置
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(`
      SELECT * FROM user_settings WHERE user_id = ?
    `, [userId]);

    if (result.rows.length === 0) {
      // 如果没有设置记录，创建默认设置
      await query(`
        INSERT INTO user_settings (user_id) VALUES (?)
      `, [userId]);

      return res.json({
        autoCleanupEnabled: false,
        retentionDays: 30,
        maxChats: 100,
        protectedChats: 10,
        cleanupFrequency: 'daily',
        notifications: {}
      });
    }

    const settings = result.rows[0];
    res.json({
      autoCleanupEnabled: settings.auto_cleanup_enabled,
      retentionDays: settings.retention_days,
      maxChats: settings.max_chats,
      protectedChats: settings.protected_chats,
      cleanupFrequency: settings.cleanup_frequency,
      notifications: settings.notifications
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// 更新用户设置
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      autoCleanupEnabled,
      retentionDays,
      maxChats,
      protectedChats,
      cleanupFrequency,
      notifications
    } = req.body;

    // 验证输入
    if (retentionDays && (retentionDays < 1 || retentionDays > 365)) {
      return res.status(400).json({ error: 'Retention days must be between 1 and 365' });
    }

    if (maxChats && (maxChats < 1 || maxChats > 10000)) {
      return res.status(400).json({ error: 'Max chats must be between 1 and 10000' });
    }

    if (protectedChats && (protectedChats < 0 || protectedChats > 1000)) {
      return res.status(400).json({ error: 'Protected chats must be between 0 and 1000' });
    }

    const result = await query(`
      UPDATE user_settings 
      SET 
        auto_cleanup_enabled = COALESCE(?, auto_cleanup_enabled),
        retention_days = COALESCE(?, retention_days),
        max_chats = COALESCE(?, max_chats),
        protected_chats = COALESCE(?, protected_chats),
        cleanup_frequency = COALESCE(?, cleanup_frequency),
        notifications = COALESCE(?, notifications),
        updated_at = NOW()
      WHERE user_id = ?
    `, [
      autoCleanupEnabled,
      retentionDays,
      maxChats,
      protectedChats,
      cleanupFrequency,
      notifications ? JSON.stringify(notifications) : null,
      userId
    ]);

    // MySQL使用affectedRows检查是否更新成功
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    // 重新获取更新后的设置
    const updatedSettingsResult = await query(`
      SELECT * FROM user_settings WHERE user_id = ?
    `, [userId]);
    
    const updatedSettings = updatedSettingsResult.rows[0];

    // 记录操作日志
    await logAction(userId, 'SETTINGS_UPDATED', {
      autoCleanupEnabled,
      retentionDays,
      maxChats,
      protectedChats,
      cleanupFrequency
    }, req.ip, req.get('User-Agent'));
    res.json({
      message: 'Settings updated successfully',
      autoCleanupEnabled: updatedSettings.auto_cleanup_enabled,
      retentionDays: updatedSettings.retention_days,
      maxChats: updatedSettings.max_chats,
      protectedChats: updatedSettings.protected_chats,
      cleanupFrequency: updatedSettings.cleanup_frequency,
      notifications: updatedSettings.notifications
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 获取数据统计
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user.userId;

    // 获取用户设置
    const settingsResult = await query(`
      SELECT retention_days, max_chats, protected_chats
      FROM user_settings 
      WHERE user_id = ?
    `, [userId]);

    const settings = settingsResult.rows[0] || {
      retention_days: 30,
      max_chats: 100,
      protected_chats: 10
    };

    // 总对话数
    const totalChatsResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      WHERE user_id = ?
    `, [userId]);

    // 过期对话数（根据保留天数计算）
    const expiredChatsResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      WHERE user_id = ? 
        AND is_protected = false
        AND created_at < DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [userId, settings.retention_days]);

    // 保护对话数
    const protectedChatsResult = await query(`
      SELECT COUNT(*) as total
      FROM chats
      WHERE user_id = ? AND is_protected = true
    `, [userId]);

    // 存储占用（估算）
    const storageResult = await query(`
      SELECT 
        COUNT(c.*) as chat_count,
        COUNT(m.*) as message_count,
        COALESCE(SUM(LENGTH(m.content)), 0) as total_content_size
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.user_id = ?
    `, [userId]);

    const storage = storageResult.rows[0];
    const estimatedStorageMB = Math.round((parseInt(storage.total_content_size) / 1024 / 1024) * 100) / 100;

    // 最近7天的对话创建趋势
    const trendResult = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM chats
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [userId]);

    res.json({
      totalChats: parseInt(totalChatsResult.rows[0].total),
      expiredChats: parseInt(expiredChatsResult.rows[0].total),
      protectedChats: parseInt(protectedChatsResult.rows[0].total),
      storageUsed: estimatedStorageMB,
      maxChats: settings.max_chats,
      maxProtectedChats: settings.protected_chats,
      retentionDays: settings.retention_days,
      totalMessages: parseInt(storage.message_count),
      weeklyTrend: trendResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count)
      }))
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// 立即清理过期数据
router.post('/cleanup', async (req, res) => {
  try {
    const userId = req.user.userId;

    // 获取用户设置
    const settingsResult = await query(`
      SELECT retention_days FROM user_settings WHERE user_id = $1
    `, [userId]);

    const retentionDays = settingsResult.rows[0]?.retention_days || 30;

    await transaction(async (client) => {
      // 获取要删除的对话
      const expiredChatsResult = await client.query(`
        SELECT id, title
        FROM chats
        WHERE user_id = $1 
          AND is_protected = false
          AND created_at < CURRENT_DATE - INTERVAL '${retentionDays} days'
      `, [userId]);

      const expiredChatIds = expiredChatsResult.rows.map(chat => chat.id);

      if (expiredChatIds.length === 0) {
        return { deletedCount: 0, deletedChats: [] };
      }

      // 删除过期对话的消息
      await client.query(`
        DELETE FROM messages WHERE chat_id = ANY($1)
      `, [expiredChatIds]);

      // 删除过期对话
      await client.query(`
        DELETE FROM chats WHERE id = ANY($1)
      `, [expiredChatIds]);

      return {
        deletedCount: expiredChatIds.length,
        deletedChats: expiredChatsResult.rows.map(chat => ({
          id: chat.id,
          title: chat.title
        }))
      };
    });

    // 记录操作日志
    await logAction(userId, 'DATA_CLEANUP', {
      retentionDays,
      deletedCount: result.deletedCount
    }, req.ip, req.get('User-Agent'));

    res.json({
      message: 'Data cleanup completed successfully',
      deletedCount: result.deletedCount,
      deletedChats: result.deletedChats
    });

  } catch (error) {
    console.error('Data cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup data' });
  }
});

// 删除所有数据（危险操作）
router.delete('/all', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { confirmText } = req.body;

    // 确认文本验证
    if (confirmText !== 'DELETE ALL MY DATA') {
      return res.status(400).json({ 
        error: 'Confirmation text is incorrect. Please type exactly: DELETE ALL MY DATA' 
      });
    }

    await transaction(async (client) => {
      // 获取要删除的所有对话
      const allChatsResult = await client.query(`
        SELECT COUNT(*) as total
        FROM chats
        WHERE user_id = $1
      `, [userId]);

      const totalChats = parseInt(allChatsResult.rows[0].total);

      // 删除所有消息
      await client.query(`
        DELETE FROM messages 
        WHERE chat_id IN (SELECT id FROM chats WHERE user_id = $1)
      `, [userId]);

      // 删除所有对话
      await client.query(`
        DELETE FROM chats WHERE user_id = $1
      `, [userId]);

      // 重置用户设置为默认值
      await client.query(`
        UPDATE user_settings 
        SET 
          auto_cleanup_enabled = false,
          retention_days = 30,
          max_chats = 100,
          protected_chats = 10,
          cleanup_frequency = 'daily',
          notifications = '{}',
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `, [userId]);

      return totalChats;
    });

    // 记录操作日志
    await logAction(userId, 'ALL_DATA_DELETED', {
      deletedChats: totalChats
    }, req.ip, req.get('User-Agent'));

    res.json({
      message: 'All data deleted successfully',
      deletedChats: totalChats
    });

  } catch (error) {
    console.error('Delete all data error:', error);
    res.status(500).json({ error: 'Failed to delete all data' });
  }
});

// 导出数据
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.userId;

    // 获取用户的所有对话
    const chatsResult = await query(`
      SELECT id, title, ai_type, is_favorite, is_protected, created_at, updated_at
      FROM chats
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    // 获取所有消息
    const messagesResult = await query(`
      SELECT m.id, m.chat_id, m.role, m.content, m.metadata, m.created_at
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE c.user_id = $1
      ORDER BY m.created_at ASC
    `, [userId]);

    // 获取用户设置
    const settingsResult = await query(`
      SELECT * FROM user_settings WHERE user_id = $1
    `, [userId]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: userId,
      chats: chatsResult.rows,
      messages: messagesResult.rows,
      settings: settingsResult.rows[0] || {},
      summary: {
        totalChats: chatsResult.rows.length,
        totalMessages: messagesResult.rows.length,
        favoriteChats: chatsResult.rows.filter(chat => chat.is_favorite).length,
        protectedChats: chatsResult.rows.filter(chat => chat.is_protected).length
      }
    };

    // 记录操作日志
    await logAction(userId, 'DATA_EXPORTED', {
      totalChats: exportData.summary.totalChats,
      totalMessages: exportData.summary.totalMessages
    }, req.ip, req.get('User-Agent'));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ai-platform-data-${Date.now()}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router; 