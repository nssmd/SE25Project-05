const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserRepository {
  
  // 根据ID查找用户
  async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = ? AND status != "deleted"',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('UserRepository.findById error:', error);
      throw error;
    }
  }

  // 根据邮箱查找用户
  async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = ? AND status != "deleted"',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('UserRepository.findByEmail error:', error);
      throw error;
    }
  }

  // 根据用户名查找用户
  async findByUsername(username) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = ? AND status != "deleted"',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('UserRepository.findByUsername error:', error);
      throw error;
    }
  }

  // 创建新用户
  async create(userData) {
    try {
      // 密码加密
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const result = await query(`
        INSERT INTO users (
          username, email, password, real_name, phone, department,
          role, status, preferences, email_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.username,
        userData.email,
        hashedPassword,
        userData.realName || userData.real_name || null,
        userData.phone || null,
        userData.department || null,
        userData.role || 'user',
        userData.status || 'active',
        JSON.stringify(userData.preferences || {}),
        userData.emailVerified || userData.email_verified || false
      ]);
      
      return this.findById(result.rows.insertId);
    } catch (error) {
      console.error('UserRepository.create error:', error);
      throw error;
    }
  }

  // 更新用户信息
  async update(id, updateData) {
    try {
      const updateFields = [];
      const updateValues = [];
      
      // 动态构建更新字段
      if (updateData.username !== undefined) {
        updateFields.push('username = ?');
        updateValues.push(updateData.username);
      }
      if (updateData.realName !== undefined || updateData.real_name !== undefined) {
        updateFields.push('real_name = ?');
        updateValues.push(updateData.realName || updateData.real_name);
      }
      if (updateData.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(updateData.phone);
      }
      if (updateData.department !== undefined) {
        updateFields.push('department = ?');
        updateValues.push(updateData.department);
      }
      if (updateData.avatar !== undefined) {
        updateFields.push('avatar = ?');
        updateValues.push(updateData.avatar);
      }
      if (updateData.preferences !== undefined) {
        updateFields.push('preferences = ?');
        updateValues.push(JSON.stringify(updateData.preferences));
      }
      if (updateData.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updateData.status);
      }
      if (updateData.role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(updateData.role);
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);
      
      await query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      return this.findById(id);
    } catch (error) {
      console.error('UserRepository.update error:', error);
      throw error;
    }
  }

  // 更新密码
  async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await query(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id]
      );
      
      return true;
    } catch (error) {
      console.error('UserRepository.updatePassword error:', error);
      throw error;
    }
  }

  // 验证密码
  async verifyPassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('UserRepository.verifyPassword error:', error);
      throw error;
    }
  }

  // 更新最后登录时间
  async updateLastLogin(id) {
    try {
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('UserRepository.updateLastLogin error:', error);
      throw error;
    }
  }

  // 增加登录尝试次数
  async incrementLoginAttempts(id) {
    try {
      await query(
        'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('UserRepository.incrementLoginAttempts error:', error);
      throw error;
    }
  }

  // 重置登录尝试次数
  async resetLoginAttempts(id) {
    try {
      await query(
        'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('UserRepository.resetLoginAttempts error:', error);
      throw error;
    }
  }

  // 锁定用户账户
  async lockAccount(id, lockUntil) {
    try {
      await query(
        'UPDATE users SET locked_until = ? WHERE id = ?',
        [lockUntil, id]
      );
    } catch (error) {
      console.error('UserRepository.lockAccount error:', error);
      throw error;
    }
  }

  // 获取所有用户（分页）
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, role, status, search } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE status != "deleted"';
      const queryParams = [];
      
      if (role) {
        whereClause += ' AND role = ?';
        queryParams.push(role);
      }
      
      if (status) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }
      
      if (search) {
        whereClause += ' AND (username LIKE ? OR email LIKE ? OR real_name LIKE ?)';
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }
      
      // 获取总数
      const countResult = await query(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        queryParams
      );
      const total = countResult.rows[0].total;
      
      // 获取数据
      queryParams.push(limit, offset);
      const result = await query(`
        SELECT id, username, email, real_name, phone, department, role, status,
               avatar, email_verified, last_login, created_at, updated_at
        FROM users ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, queryParams);
      
      return {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('UserRepository.findAll error:', error);
      throw error;
    }
  }

  // 删除用户（软删除）
  async softDelete(id) {
    try {
      await query(
        'UPDATE users SET status = "deleted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('UserRepository.softDelete error:', error);
      throw error;
    }
  }

  // 检查邮箱是否已存在
  async existsByEmail(email, excludeId = null) {
    try {
      let whereClause = 'WHERE email = ? AND status != "deleted"';
      const params = [email];
      
      if (excludeId) {
        whereClause += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await query(
        `SELECT COUNT(*) as count FROM users ${whereClause}`,
        params
      );
      
      return result.rows[0].count > 0;
    } catch (error) {
      console.error('UserRepository.existsByEmail error:', error);
      throw error;
    }
  }

  // 检查用户名是否已存在
  async existsByUsername(username, excludeId = null) {
    try {
      let whereClause = 'WHERE username = ? AND status != "deleted"';
      const params = [username];
      
      if (excludeId) {
        whereClause += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await query(
        `SELECT COUNT(*) as count FROM users ${whereClause}`,
        params
      );
      
      return result.rows[0].count > 0;
    } catch (error) {
      console.error('UserRepository.existsByUsername error:', error);
      throw error;
    }
  }

  // 获取用户统计信息
  async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'disabled' THEN 1 END) as disabled_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN role = 'customer_service' THEN 1 END) as cs_users,
          COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_this_month,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
        FROM users 
        WHERE status != 'deleted'
      `);
      
      return result.rows[0];
    } catch (error) {
      console.error('UserRepository.getStatistics error:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository(); 