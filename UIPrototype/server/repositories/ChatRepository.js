const { query, transaction } = require('../config/database');

class ChatRepository {
  
  // 根据ID查找聊天
  async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM chats WHERE id = ? AND status != "deleted"',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('ChatRepository.findById error:', error);
      throw error;
    }
  }

  // 根据用户ID查找聊天列表
  async findByUserId(userId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        isFavorite, 
        isProtected, 
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;
      
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE user_id = ? AND status != "deleted"';
      const queryParams = [userId];
      
      if (type) {
        whereClause += ' AND type = ?';
        queryParams.push(type);
      }
      
      if (isFavorite !== undefined) {
        whereClause += ' AND is_favorite = ?';
        queryParams.push(isFavorite);
      }
      
      if (isProtected !== undefined) {
        whereClause += ' AND is_protected = ?';
        queryParams.push(isProtected);
      }
      
      if (search) {
        whereClause += ' AND title LIKE ?';
        queryParams.push(`%${search}%`);
      }
      
      // 验证排序字段
      const validSortFields = ['created_at', 'updated_at', 'title', 'message_count', 'last_message_at'];
      const validSortOrder = ['ASC', 'DESC'];
      
      const orderBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const order = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      // 获取总数
      const countResult = await query(
        `SELECT COUNT(*) as total FROM chats ${whereClause}`,
        queryParams
      );
      const total = countResult.rows[0].total;
      
      // 获取数据
      queryParams.push(limit, offset);
      const result = await query(`
        SELECT * FROM chats ${whereClause}
        ORDER BY ${orderBy} ${order}
        LIMIT ? OFFSET ?
      `, queryParams);
      
      return {
        chats: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('ChatRepository.findByUserId error:', error);
      throw error;
    }
  }

  // 创建新聊天
  async create(chatData) {
    try {
      const result = await query(`
        INSERT INTO chats (
          user_id, title, type, model, is_protected, is_favorite,
          status, tags, metadata, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        chatData.user_id || chatData.userId,
        chatData.title,
        chatData.type || 'text',
        chatData.model || 'gpt-3.5-turbo',
        chatData.is_protected || chatData.isProtected || false,
        chatData.is_favorite || chatData.isFavorite || false,
        chatData.status || 'active',
        JSON.stringify(chatData.tags || []),
        JSON.stringify(chatData.metadata || {}),
        chatData.expires_at || chatData.expiresAt || null
      ]);
      
      return this.findById(result.rows.insertId);
    } catch (error) {
      console.error('ChatRepository.create error:', error);
      throw error;
    }
  }

  // 更新聊天信息
  async update(id, updateData) {
    try {
      const updateFields = [];
      const updateValues = [];
      
      if (updateData.title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(updateData.title);
      }
      if (updateData.is_favorite !== undefined || updateData.isFavorite !== undefined) {
        updateFields.push('is_favorite = ?');
        updateValues.push(updateData.is_favorite || updateData.isFavorite);
      }
      if (updateData.is_protected !== undefined || updateData.isProtected !== undefined) {
        updateFields.push('is_protected = ?');
        updateValues.push(updateData.is_protected || updateData.isProtected);
      }
      if (updateData.tags !== undefined) {
        updateFields.push('tags = ?');
        updateValues.push(JSON.stringify(updateData.tags));
      }
      if (updateData.metadata !== undefined) {
        updateFields.push('metadata = ?');
        updateValues.push(JSON.stringify(updateData.metadata));
      }
      if (updateData.expires_at !== undefined || updateData.expiresAt !== undefined) {
        updateFields.push('expires_at = ?');
        updateValues.push(updateData.expires_at || updateData.expiresAt);
      }
      if (updateData.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updateData.status);
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);
      
      await query(
        `UPDATE chats SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      return this.findById(id);
    } catch (error) {
      console.error('ChatRepository.update error:', error);
      throw error;
    }
  }

  // 更新消息计数
  async updateMessageCount(chatId) {
    try {
      await query(`
        UPDATE chats 
        SET message_count = (
          SELECT COUNT(*) FROM messages WHERE chat_id = ?
        ),
        last_message_at = (
          SELECT MAX(created_at) FROM messages WHERE chat_id = ?
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [chatId, chatId, chatId]);
    } catch (error) {
      console.error('ChatRepository.updateMessageCount error:', error);
      throw error;
    }
  }

  // 删除聊天（软删除）
  async softDelete(id) {
    try {
      await query(
        'UPDATE chats SET status = "deleted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('ChatRepository.softDelete error:', error);
      throw error;
    }
  }

  // 批量删除聊天
  async batchDelete(chatIds) {
    try {
      const placeholders = chatIds.map(() => '?').join(',');
      await query(
        `UPDATE chats SET status = "deleted", updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        chatIds
      );
      return true;
    } catch (error) {
      console.error('ChatRepository.batchDelete error:', error);
      throw error;
    }
  }

  // 批量更新收藏状态
  async batchUpdateFavorite(chatIds, isFavorite) {
    try {
      const placeholders = chatIds.map(() => '?').join(',');
      await query(
        `UPDATE chats SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        [isFavorite, ...chatIds]
      );
      return true;
    } catch (error) {
      console.error('ChatRepository.batchUpdateFavorite error:', error);
      throw error;
    }
  }

  // 批量更新保护状态
  async batchUpdateProtection(chatIds, isProtected) {
    try {
      const placeholders = chatIds.map(() => '?').join(',');
      await query(
        `UPDATE chats SET is_protected = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        [isProtected, ...chatIds]
      );
      return true;
    } catch (error) {
      console.error('ChatRepository.batchUpdateProtection error:', error);
      throw error;
    }
  }

  // 获取过期的聊天
  async findExpiredChats() {
    try {
      const result = await query(`
        SELECT * FROM chats 
        WHERE expires_at IS NOT NULL 
          AND expires_at < NOW() 
          AND is_protected = false 
          AND status != "deleted"
      `);
      return result.rows;
    } catch (error) {
      console.error('ChatRepository.findExpiredChats error:', error);
      throw error;
    }
  }

  // 检查用户聊天数量限制
  async getUserChatCount(userId) {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM chats WHERE user_id = ? AND status != "deleted"',
        [userId]
      );
      return result.rows[0].count;
    } catch (error) {
      console.error('ChatRepository.getUserChatCount error:', error);
      throw error;
    }
  }

  // 获取聊天统计信息
  async getStatistics(userId = null) {
    try {
      let whereClause = 'WHERE status != "deleted"';
      const params = [];
      
      if (userId) {
        whereClause += ' AND user_id = ?';
        params.push(userId);
      }
      
      const result = await query(`
        SELECT 
          COUNT(*) as total_chats,
          COUNT(CASE WHEN type = 'text' THEN 1 END) as text_chats,
          COUNT(CASE WHEN type = 'image' THEN 1 END) as image_chats,
          COUNT(CASE WHEN type = 'video' THEN 1 END) as video_chats,
          COUNT(CASE WHEN type = '3d' THEN 1 END) as model_3d_chats,
          COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorite_chats,
          COUNT(CASE WHEN is_protected = true THEN 1 END) as protected_chats,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as chats_this_week,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as chats_this_month
        FROM chats ${whereClause}
      `, params);
      
      return result.rows[0];
    } catch (error) {
      console.error('ChatRepository.getStatistics error:', error);
      throw error;
    }
  }

  // 搜索聊天内容
  async searchChats(userId, searchOptions = {}) {
    try {
      const {
        query: searchQuery,
        type,
        model,
        startDate,
        endDate,
        isFavorite,
        isProtected,
        page = 1,
        limit = 20
      } = searchOptions;
      
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE c.user_id = ? AND c.status != "deleted"';
      const queryParams = [userId];
      
      if (searchQuery) {
        whereClause += ` AND (
          c.title LIKE ? OR 
          EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.chat_id = c.id AND m.content LIKE ?
          )
        )`;
        const searchPattern = `%${searchQuery}%`;
        queryParams.push(searchPattern, searchPattern);
      }
      
      if (type) {
        whereClause += ' AND c.type = ?';
        queryParams.push(type);
      }
      
      if (model) {
        whereClause += ' AND c.model = ?';
        queryParams.push(model);
      }
      
      if (startDate) {
        whereClause += ' AND c.created_at >= ?';
        queryParams.push(startDate);
      }
      
      if (endDate) {
        whereClause += ' AND c.created_at <= ?';
        queryParams.push(endDate);
      }
      
      if (isFavorite !== undefined) {
        whereClause += ' AND c.is_favorite = ?';
        queryParams.push(isFavorite);
      }
      
      if (isProtected !== undefined) {
        whereClause += ' AND c.is_protected = ?';
        queryParams.push(isProtected);
      }
      
      // 获取总数
      const countResult = await query(
        `SELECT COUNT(DISTINCT c.id) as total FROM chats c ${whereClause}`,
        queryParams
      );
      const total = countResult.rows[0].total;
      
      // 获取数据
      queryParams.push(limit, offset);
      const result = await query(`
        SELECT DISTINCT c.* FROM chats c ${whereClause}
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
      `, queryParams);
      
      return {
        chats: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('ChatRepository.searchChats error:', error);
      throw error;
    }
  }
}

module.exports = new ChatRepository(); 