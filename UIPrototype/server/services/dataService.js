const { query, transaction } = require('../config/database');

// 清理过期对话数据
const cleanupExpiredChats = async () => {
  try {
    console.log('开始执行数据清理任务...');
    
    // 获取所有启用自动清理的用户设置
    const autoCleanupUsers = await query(`
      SELECT user_id, retention_days
      FROM user_settings
      WHERE auto_cleanup_enabled = true
    `);

    let totalDeletedChats = 0;
    let totalDeletedMessages = 0;

    for (const userSetting of autoCleanupUsers.rows) {
      const { user_id, retention_days } = userSetting;
      
      await transaction(async (client) => {
        // 获取过期的对话
        const expiredChatsResult = await client.query(`
          SELECT id, title
          FROM chats
          WHERE user_id = $1 
            AND is_protected = false
            AND created_at < CURRENT_DATE - INTERVAL '${retention_days} days'
        `, [user_id]);

        if (expiredChatsResult.rows.length === 0) {
          return;
        }

        const expiredChatIds = expiredChatsResult.rows.map(chat => chat.id);

        // 统计要删除的消息数量
        const messageCountResult = await client.query(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE chat_id = ANY($1)
        `, [expiredChatIds]);

        const messageCount = parseInt(messageCountResult.rows[0].count);

        // 删除消息
        await client.query(`
          DELETE FROM messages WHERE chat_id = ANY($1)
        `, [expiredChatIds]);

        // 删除对话
        await client.query(`
          DELETE FROM chats WHERE id = ANY($1)
        `, [expiredChatIds]);

        totalDeletedChats += expiredChatIds.length;
        totalDeletedMessages += messageCount;

        console.log(`用户 ${user_id}: 删除了 ${expiredChatIds.length} 个对话和 ${messageCount} 条消息`);
      });
    }

    console.log(`数据清理完成: 总共删除 ${totalDeletedChats} 个对话和 ${totalDeletedMessages} 条消息`);
    
    return {
      deletedChats: totalDeletedChats,
      deletedMessages: totalDeletedMessages,
      processedUsers: autoCleanupUsers.rows.length
    };

  } catch (error) {
    console.error('数据清理失败:', error);
    throw error;
  }
};

// 获取系统健康统计
const getSystemHealthStats = async () => {
  try {
    // 用户统计
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_this_month
      FROM users
    `);

    // 对话统计
    const chatStats = await query(`
      SELECT 
        COUNT(*) as total_chats,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as chats_this_week,
        COUNT(CASE WHEN is_protected = true THEN 1 END) as protected_chats
      FROM chats
    `);

    // 消息统计
    const messageStats = await query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as messages_this_week
      FROM messages
    `);

    return {
      users: {
        total: parseInt(userStats.rows[0].total_users),
        active: parseInt(userStats.rows[0].active_users),
        activeThisMonth: parseInt(userStats.rows[0].active_this_month)
      },
      chats: {
        total: parseInt(chatStats.rows[0].total_chats),
        thisWeek: parseInt(chatStats.rows[0].chats_this_week),
        protected: parseInt(chatStats.rows[0].protected_chats)
      },
      messages: {
        total: parseInt(messageStats.rows[0].total_messages),
        thisWeek: parseInt(messageStats.rows[0].messages_this_week)
      }
    };

  } catch (error) {
    console.error('获取系统健康统计失败:', error);
    throw error;
  }
};

module.exports = {
  cleanupExpiredChats,
  getSystemHealthStats
}; 