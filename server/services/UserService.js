const UserRepository = require('../repositories/UserRepository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class UserService {
  
  // 用户注册
  async register(userData) {
    try {
      // 验证输入数据
      this.validateUserData(userData);
      
      // 检查邮箱是否已存在
      const existingUserByEmail = await UserRepository.findByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error('该邮箱已被注册');
      }
      
      // 检查用户名是否已存在
      const existingUserByUsername = await UserRepository.findByUsername(userData.username);
      if (existingUserByUsername) {
        throw new Error('该用户名已被使用');
      }
      
      // 创建用户
      const user = await UserRepository.create(userData);
      
      // 生成JWT token
      const token = this.generateToken(user);
      
      // 返回用户信息（不包含密码）
      const userResponse = this.formatUserResponse(user);
      
      return {
        user: userResponse,
        token,
        message: '注册成功'
      };
      
    } catch (error) {
      console.error('UserService.register error:', error);
      throw error;
    }
  }

  // 用户登录
  async login(credentials) {
    try {
      const { email, password, rememberMe } = credentials;
      
      if (!email || !password) {
        throw new Error('邮箱和密码不能为空');
      }
      
      // 查找用户
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        throw new Error('用户不存在或密码错误');
      }
      
      // 检查用户状态
      if (user.status === 'disabled') {
        throw new Error('账户已被禁用，请联系管理员');
      }
      
      if (user.status === 'pending') {
        throw new Error('账户尚未激活，请检查邮箱验证');
      }
      
      // 检查账户是否被锁定
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        throw new Error('账户已被锁定，请稍后再试');
      }
      
      // 验证密码
      const isPasswordValid = await UserRepository.verifyPassword(user, password);
      if (!isPasswordValid) {
        // 增加失败尝试次数
        await UserRepository.incrementLoginAttempts(user.id);
        
        // 如果尝试次数过多，锁定账户
        if (user.login_attempts >= 4) {
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 锁定30分钟
          await UserRepository.lockAccount(user.id, lockUntil);
          throw new Error('登录失败次数过多，账户已被锁定30分钟');
        }
        
        throw new Error('用户不存在或密码错误');
      }
      
      // 登录成功，重置登录尝试次数
      await UserRepository.resetLoginAttempts(user.id);
      
      // 更新最后登录时间
      await UserRepository.updateLastLogin(user.id);
      
      // 生成JWT token
      const tokenExpiry = rememberMe ? '30d' : '1d';
      const token = this.generateToken(user, tokenExpiry);
      
      // 返回用户信息
      const userResponse = this.formatUserResponse(user);
      
      return {
        user: userResponse,
        token,
        message: '登录成功'
      };
      
    } catch (error) {
      console.error('UserService.login error:', error);
      throw error;
    }
  }

  // 获取用户资料
  async getProfile(userId) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      return this.formatUserResponse(user);
    } catch (error) {
      console.error('UserService.getProfile error:', error);
      throw error;
    }
  }

  // 更新用户资料
  async updateProfile(userId, updateData) {
    try {
      // 验证更新数据
      this.validateUpdateData(updateData);
      
      // 如果更新邮箱，检查是否已存在
      if (updateData.email) {
        const existsByEmail = await UserRepository.existsByEmail(updateData.email, userId);
        if (existsByEmail) {
          throw new Error('该邮箱已被其他用户使用');
        }
      }
      
      // 如果更新用户名，检查是否已存在
      if (updateData.username) {
        const existsByUsername = await UserRepository.existsByUsername(updateData.username, userId);
        if (existsByUsername) {
          throw new Error('该用户名已被其他用户使用');
        }
      }
      
      // 更新用户信息
      const updatedUser = await UserRepository.update(userId, updateData);
      
      return {
        user: this.formatUserResponse(updatedUser),
        message: '资料更新成功'
      };
      
    } catch (error) {
      console.error('UserService.updateProfile error:', error);
      throw error;
    }
  }

  // 修改密码
  async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;
      
      if (!currentPassword || !newPassword) {
        throw new Error('当前密码和新密码不能为空');
      }
      
      if (newPassword.length < 6) {
        throw new Error('新密码至少需要6个字符');
      }
      
      // 获取用户信息
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 验证当前密码
      const isCurrentPasswordValid = await UserRepository.verifyPassword(user, currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('当前密码错误');
      }
      
      // 检查新密码是否与当前密码相同
      const isSamePassword = await UserRepository.verifyPassword(user, newPassword);
      if (isSamePassword) {
        throw new Error('新密码不能与当前密码相同');
      }
      
      // 更新密码
      await UserRepository.updatePassword(userId, newPassword);
      
      return {
        message: '密码修改成功'
      };
      
    } catch (error) {
      console.error('UserService.changePassword error:', error);
      throw error;
    }
  }

  // 获取用户列表（管理员功能）
  async getUserList(options = {}) {
    try {
      return await UserRepository.findAll(options);
    } catch (error) {
      console.error('UserService.getUserList error:', error);
      throw error;
    }
  }

  // 更新用户状态（管理员功能）
  async updateUserStatus(userId, status) {
    try {
      const validStatuses = ['active', 'disabled', 'pending'];
      if (!validStatuses.includes(status)) {
        throw new Error('无效的用户状态');
      }
      
      const updatedUser = await UserRepository.update(userId, { status });
      
      return {
        user: this.formatUserResponse(updatedUser),
        message: '用户状态更新成功'
      };
      
    } catch (error) {
      console.error('UserService.updateUserStatus error:', error);
      throw error;
    }
  }

  // 更新用户角色（管理员功能）
  async updateUserRole(userId, role) {
    try {
      const validRoles = ['user', 'admin', 'customer_service'];
      if (!validRoles.includes(role)) {
        throw new Error('无效的用户角色');
      }
      
      const updatedUser = await UserRepository.update(userId, { role });
      
      return {
        user: this.formatUserResponse(updatedUser),
        message: '用户角色更新成功'
      };
      
    } catch (error) {
      console.error('UserService.updateUserRole error:', error);
      throw error;
    }
  }

  // 删除用户（管理员功能）
  async deleteUser(userId) {
    try {
      await UserRepository.softDelete(userId);
      
      return {
        message: '用户删除成功'
      };
      
    } catch (error) {
      console.error('UserService.deleteUser error:', error);
      throw error;
    }
  }

  // 获取用户统计信息
  async getStatistics() {
    try {
      return await UserRepository.getStatistics();
    } catch (error) {
      console.error('UserService.getStatistics error:', error);
      throw error;
    }
  }

  // 验证JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new Error('无效的token');
    }
  }

  // 生成JWT token
  generateToken(user, expiresIn = '1d') {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn });
  }

  // 格式化用户响应数据（移除敏感信息）
  formatUserResponse(user) {
    const { password, login_attempts, locked_until, ...userResponse } = user;
    
    // 转换字段名为驼峰命名
    return {
      ...userResponse,
      realName: user.real_name,
      emailVerified: user.email_verified,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      preferences: typeof user.preferences === 'string' 
        ? JSON.parse(user.preferences) 
        : user.preferences
    };
  }

  // 验证用户数据
  validateUserData(userData) {
    const errors = [];
    
    if (!userData.username || userData.username.length < 3) {
      errors.push('用户名至少需要3个字符');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      errors.push('用户名只能包含字母、数字和下划线');
    }
    
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('请输入有效的邮箱地址');
    }
    
    if (!userData.password || userData.password.length < 6) {
      errors.push('密码至少需要6个字符');
    }
    
    if (userData.phone && !/^1[3-9]\d{9}$/.test(userData.phone)) {
      errors.push('请输入有效的手机号码');
    }
    
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  }

  // 验证更新数据
  validateUpdateData(updateData) {
    const errors = [];
    
    if (updateData.username && updateData.username.length < 3) {
      errors.push('用户名至少需要3个字符');
    }
    
    if (updateData.username && !/^[a-zA-Z0-9_]+$/.test(updateData.username)) {
      errors.push('用户名只能包含字母、数字和下划线');
    }
    
    if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
      errors.push('请输入有效的邮箱地址');
    }
    
    if (updateData.phone && !/^1[3-9]\d{9}$/.test(updateData.phone)) {
      errors.push('请输入有效的手机号码');
    }
    
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  }
}

module.exports = new UserService(); 