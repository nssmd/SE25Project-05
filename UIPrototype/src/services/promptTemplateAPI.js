const API_BASE_URL = 'http://localhost:8080';

// 获取认证token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// 通用API请求函数
const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const promptTemplateAPI = {
  // 获取模板分类
  getCategories: async () => {
    try {
      return await apiRequest('/prompt-templates/categories');
    } catch (error) {
      console.error('获取模板分类失败:', error);
      throw error;
    }
  },

  // 获取模板列表
  getTemplates: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.categoryId !== null && params.categoryId !== undefined) {
        queryParams.append('categoryId', params.categoryId);
      }
      if (params.keyword) {
        queryParams.append('keyword', params.keyword);
      }
      if (params.type) {
        queryParams.append('type', params.type);
      }
      if (params.page !== undefined) {
        queryParams.append('page', params.page);
      }
      if (params.size !== undefined) {
        queryParams.append('size', params.size);
      }

      const url = `/prompt-templates${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await apiRequest(url);
    } catch (error) {
      console.error('获取模板列表失败:', error);
      throw error;
    }
  },

  // 获取精选模板
  getFeaturedTemplates: async () => {
    try {
      return await apiRequest('/prompt-templates/featured');
    } catch (error) {
      console.error('获取精选模板失败:', error);
      throw error;
    }
  },

  // 获取热门模板
  getPopularTemplates: async () => {
    try {
      return await apiRequest('/prompt-templates/popular');
    } catch (error) {
      console.error('获取热门模板失败:', error);
      throw error;
    }
  },

  // 获取最新模板
  getLatestTemplates: async () => {
    try {
      return await apiRequest('/prompt-templates/latest');
    } catch (error) {
      console.error('获取最新模板失败:', error);
      throw error;
    }
  },

  // 根据AI模型获取推荐模板
  getRecommendedTemplates: async (aiModel) => {
    try {
      return await apiRequest(`/prompt-templates/recommended?aiModel=${encodeURIComponent(aiModel)}`);
    } catch (error) {
      console.error('获取推荐模板失败:', error);
      throw error;
    }
  },

  // 获取模板详情
  getTemplateById: async (id) => {
    try {
      return await apiRequest(`/prompt-templates/${id}`);
    } catch (error) {
      console.error('获取模板详情失败:', error);
      throw error;
    }
  },

  // 创建模板
  createTemplate: async (templateData) => {
    try {
      return await apiRequest('/prompt-templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
    } catch (error) {
      console.error('创建模板失败:', error);
      throw error;
    }
  },

  // 更新模板
  updateTemplate: async (id, templateData) => {
    try {
      return await apiRequest(`/prompt-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
    } catch (error) {
      console.error('更新模板失败:', error);
      throw error;
    }
  },

  // 删除模板
  deleteTemplate: async (templateId) => {
    try {
      return await apiRequest(`/prompt-templates/${templateId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('删除模板失败:', error);
      throw error;
    }
  },

  // 点赞/取消点赞模板
  toggleLike: async (id) => {
    try {
      return await apiRequest(`/prompt-templates/${id}/like`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('点赞操作失败:', error);
      throw error;
    }
  },

  // 使用模板（记录使用统计）
  useTemplate: async (id, aiModel) => {
    try {
      return await apiRequest(`/prompt-templates/${id}/use`, {
        method: 'POST',
        body: JSON.stringify({ aiModel }),
      });
    } catch (error) {
      console.error('使用模板失败:', error);
      throw error;
    }
  },
};

export default promptTemplateAPI; 