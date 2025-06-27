import { authAPI, userAPI } from './api';

class UserService {
  constructor() {
    this.currentUser = null;
  }

  // 用户登录
  async login(credentials) {
    try {
      const response = await authAPI.login(credentials);
      
      // Spring Boot直接返回AuthResponse对象
      if (response && response.user) {
        this.currentUser = response.user;
        
        // 保存到localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('authToken', response.token);
        
        return { success: true, user: response.user, token: response.token };
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      console.error('UserService login error:', error);
      throw error;
    }
  }

  // 用户注册
  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      
      // Spring Boot直接返回AuthResponse对象
      if (response && response.user) {
        this.currentUser = response.user;
        
        // 保存到localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('authToken', response.token);
        
        return { success: true, user: response.user, token: response.token };
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      console.error('UserService register error:', error);
      throw error;
    }
  }

  // 验证token
  async verify() {
    try {
      const response = await authAPI.verify();
      
      if (response.success && response.user) {
        this.currentUser = response.user;
        return response;
      } else {
        // Token无效，清除本地存储
        this.logout();
        throw new Error('Token验证失败');
      }
    } catch (error) {
      console.error('UserService verify error:', error);
      this.logout();
      throw error;
    }
  }

  // 用户注销
  async logout() {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('UserService logout error:', error);
    } finally {
      // 清除本地存储
      this.currentUser = null;
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    }
  }

  // 修改密码
  async changePassword(passwords) {
    try {
      const response = await authAPI.changePassword(passwords);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || '修改密码失败');
      }
    } catch (error) {
      console.error('UserService changePassword error:', error);
      throw error;
    }
  }

  // 获取用户profile
  async getProfile() {
    try {
      const response = await userAPI.getProfile();
      
      if (response.success && response.user) {
        this.currentUser = response.user;
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      } else {
        throw new Error(response.error || '获取用户信息失败');
      }
    } catch (error) {
      console.error('UserService getProfile error:', error);
      throw error;
    }
  }

  // 更新用户profile
  async updateProfile(userData) {
    try {
      const response = await userAPI.updateProfile(userData);
      
      if (response.success && response.user) {
        this.currentUser = response.user;
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      } else {
        throw new Error(response.error || '更新用户信息失败');
      }
    } catch (error) {
      console.error('UserService updateProfile error:', error);
      throw error;
    }
  }

  // 获取当前用户信息
  getCurrentUser() {
    if (!this.currentUser) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
        } catch (error) {
          console.error('解析用户信息失败:', error);
          localStorage.removeItem('user');
        }
      }
    }
    return this.currentUser;
  }

  // 检查是否已登录
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // 获取权限
  async getPermissions() {
    try {
      const response = await userAPI.getPermissions();
      
      if (response.success) {
        return response.permissions;
      } else {
        throw new Error(response.error || '获取权限失败');
      }
    } catch (error) {
      console.error('UserService getPermissions error:', error);
      throw error;
    }
  }

  // 获取使用统计
  async getUsageStats() {
    try {
      const response = await userAPI.getUsageStats();
      
      if (response.success) {
        return response.stats;
      } else {
        throw new Error(response.error || '获取使用统计失败');
      }
    } catch (error) {
      console.error('UserService getUsageStats error:', error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService; 