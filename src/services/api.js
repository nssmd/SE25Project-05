import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.baseURL + config.url, config.data);
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // 返回更友好的错误信息
    const message = error.response?.data?.message || error.response?.data?.error || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: (userData) => api.post('/auth/register', userData),
  
  // 用户登录
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 验证token
  verify: () => api.get('/auth/verify'),
  
  // 注销
  logout: () => api.post('/auth/logout'),
  
  // 修改密码
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
};

// 聊天相关API
export const chatAPI = {
  // 创建新对话
  create: (chatData) => api.post('/chat/create', chatData),
  
  // 发送消息
  sendMessage: (chatId, messageData) => api.post(`/chat/${chatId}/message`, messageData),
  
  // 获取对话消息
  getMessages: (chatId, params = {}) => api.get(`/chat/${chatId}/messages`, { params }),
  
  // 删除对话
  delete: (chatId) => api.delete(`/chat/${chatId}`),
  
  // 更新对话标题
  updateTitle: (chatId, title) => api.patch(`/chat/${chatId}/title`, { title }),
  
  // 切换收藏状态
  toggleFavorite: (chatId) => api.patch(`/chat/${chatId}/favorite`),
  
  // 切换保护状态
  toggleProtection: (chatId) => api.patch(`/chat/${chatId}/protect`),
};

// 历史记录相关API
export const historyAPI = {
  // 获取对话列表
  getChats: (params = {}) => api.get('/history/chats', { params }),
  
  // 获取对话详情
  getChatDetail: (chatId) => api.get(`/history/chats/${chatId}`),
  
  // 获取搜索建议
  getSearchSuggestions: (query) => api.get('/history/search-suggestions', { params: { query } }),
  
  // 获取用户统计信息
  getStats: () => api.get('/history/stats'),
  
  // 批量操作对话
  batchOperation: (operation, chatIds) => api.post('/history/batch-operation', { operation, chatIds }),
};

// 数据管理相关API
export const dataAPI = {
  // 获取用户设置
  getSettings: () => api.get('/data/settings'),
  
  // 更新用户设置
  updateSettings: (settings) => api.put('/data/settings', settings),
  
  // 获取数据统计
  getStatistics: () => api.get('/data/statistics'),
  
  // 立即清理过期数据
  cleanup: () => api.post('/data/cleanup'),
  
  // 删除所有数据
  deleteAll: (confirmText) => api.delete('/data/all', { data: { confirmText } }),
  
  // 导出数据
  exportData: () => api.get('/data/export'),
};

// 用户相关API
export const userAPI = {
  // 获取用户profile
  getProfile: () => api.get('/user/profile'),
  
  // 更新用户profile
  updateProfile: (userData) => api.put('/user/profile', userData),
  
  // 获取用户权限
  getPermissions: () => api.get('/user/permissions'),
  
  // 获取使用统计
  getUsageStats: () => api.get('/user/usage-stats'),
  
  // 获取活动日志
  getActivityLogs: (params = {}) => api.get('/user/activity-logs', { params }),
  
  // 消息相关
  getMessages: () => api.get('/user/messages'),
  markMessageAsRead: (messageId) => api.patch(`/user/messages/${messageId}/read`),
  deleteMessage: (messageId) => api.delete(`/user/messages/${messageId}`),
  
  // 客服对话
  getSupportChat: () => api.get('/user/support/chat'),
  sendToSupport: (messageData) => api.post('/user/support/message', messageData),
};

// 管理员相关API
export const adminAPI = {
  // 获取所有用户
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  
  // 更新用户状态
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }),
  
  // 更新用户权限
  updateUserPermissions: (userId, permissions) => api.patch(`/admin/users/${userId}/permissions`, { permissions }),
  
  // 修改用户角色
  updateUserRole: (userId, roleData) => api.put(`/admin/users/${userId}/role`, roleData),
  
  // 发送消息给指定用户
  sendMessage: (userId, messageData) => api.post(`/admin/users/${userId}/message`, messageData),
  
  // 获取发送的消息历史
  getSentMessages: (params = {}) => api.get('/admin/messages/sent', { params }),
  
  // 获取系统统计
  getStatistics: () => api.get('/admin/statistics'),
  
  // 获取系统日志
  getLogs: (params = {}) => api.get('/admin/logs', { params }),
};

// 工具函数
export const apiUtils = {
  // 设置认证token
  setAuthToken: (token) => {
    localStorage.setItem('authToken', token);
  },
  
  // 清除认证token
  clearAuthToken: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  // 获取当前token
  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },
  
  // 检查是否已登录
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
  
  // 获取当前用户信息
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // 保存用户信息
  setCurrentUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  // 检查用户角色
  hasRole: (role) => {
    const user = apiUtils.getCurrentUser();
    return user?.role === role;
  },
  
  // 检查用户权限
  hasPermission: (permission) => {
    const user = apiUtils.getCurrentUser();
    return user?.permissions?.[permission] === true;
  },
};

// 导出默认api实例
export default api; 