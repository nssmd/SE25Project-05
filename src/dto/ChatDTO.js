// 创建对话DTO
export class ChatCreateDTO {
  constructor(data = {}) {
    this.title = data.title || '';
    this.type = data.type || 'text';
    this.model = data.model || 'gpt-3.5-turbo';
    this.initialMessage = data.initialMessage || '';
  }

  // 验证数据
  validate() {
    const errors = [];
    
    if (!this.title || this.title.trim().length === 0) {
      errors.push('对话标题不能为空');
    }
    
    if (this.title.length > 100) {
      errors.push('对话标题不能超过100个字符');
    }
    
    const validTypes = ['text', 'image', 'video', '3d'];
    if (!validTypes.includes(this.type)) {
      errors.push('无效的对话类型');
    }
    
    return errors;
  }

  // 转换为API请求格式
  toApiRequest() {
    return {
      title: this.title.trim(),
      type: this.type,
      model: this.model,
      initialMessage: this.initialMessage
    };
  }
}

// 发送消息DTO
export class MessageSendDTO {
  constructor(data = {}) {
    this.content = data.content || '';
    this.type = data.type || 'text';
    this.attachments = data.attachments || [];
    this.parentId = data.parentId || null;
    this.model = data.model || null;
  }

  // 验证数据
  validate() {
    const errors = [];
    
    if (!this.content || this.content.trim().length === 0) {
      errors.push('消息内容不能为空');
    }
    
    if (this.content.length > 10000) {
      errors.push('消息内容不能超过10000个字符');
    }
    
    const validTypes = ['text', 'image', 'file'];
    if (!validTypes.includes(this.type)) {
      errors.push('无效的消息类型');
    }
    
    // 验证附件
    if (this.attachments.length > 10) {
      errors.push('附件数量不能超过10个');
    }
    
    return errors;
  }

  // 转换为API请求格式
  toApiRequest() {
    return {
      content: this.content.trim(),
      type: this.type,
      attachments: this.attachments,
      parentId: this.parentId,
      model: this.model
    };
  }
}

// 对话搜索DTO
export class ChatSearchDTO {
  constructor(data = {}) {
    this.query = data.query || '';
    this.type = data.type || '';
    this.model = data.model || '';
    this.startDate = data.startDate || null;
    this.endDate = data.endDate || null;
    this.isFavorite = data.isFavorite || null;
    this.isProtected = data.isProtected || null;
    this.page = data.page || 1;
    this.limit = data.limit || 20;
    this.sortBy = data.sortBy || 'created_at';
    this.sortOrder = data.sortOrder || 'desc';
  }

  // 验证数据
  validate() {
    const errors = [];
    
    if (this.query.length > 200) {
      errors.push('搜索关键词不能超过200个字符');
    }
    
    if (this.page < 1) {
      errors.push('页码必须大于0');
    }
    
    if (this.limit < 1 || this.limit > 100) {
      errors.push('每页数量必须在1-100之间');
    }
    
    const validSortBy = ['created_at', 'updated_at', 'title', 'message_count'];
    if (!validSortBy.includes(this.sortBy)) {
      errors.push('无效的排序字段');
    }
    
    const validSortOrder = ['asc', 'desc'];
    if (!validSortOrder.includes(this.sortOrder)) {
      errors.push('无效的排序方向');
    }
    
    return errors;
  }

  // 转换为API请求格式
  toApiRequest() {
    const params = {
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
    
    if (this.query) params.query = this.query;
    if (this.type) params.type = this.type;
    if (this.model) params.model = this.model;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;
    if (this.isFavorite !== null) params.isFavorite = this.isFavorite;
    if (this.isProtected !== null) params.isProtected = this.isProtected;
    
    return params;
  }
}

// 对话更新DTO
export class ChatUpdateDTO {
  constructor(data = {}) {
    this.title = data.title || null;
    this.isFavorite = data.isFavorite || null;
    this.isProtected = data.isProtected || null;
    this.tags = data.tags || null;
    this.expiresAt = data.expiresAt || null;
  }

  // 验证数据
  validate() {
    const errors = [];
    
    if (this.title !== null && this.title.length > 100) {
      errors.push('对话标题不能超过100个字符');
    }
    
    if (this.tags !== null && this.tags.length > 10) {
      errors.push('标签数量不能超过10个');
    }
    
    return errors;
  }

  // 转换为API请求格式
  toApiRequest() {
    const data = {};
    
    if (this.title !== null) data.title = this.title;
    if (this.isFavorite !== null) data.isFavorite = this.isFavorite;
    if (this.isProtected !== null) data.isProtected = this.isProtected;
    if (this.tags !== null) data.tags = this.tags;
    if (this.expiresAt !== null) data.expiresAt = this.expiresAt;
    
    return data;
  }
}

// 对话响应DTO
export class ChatResponseDTO {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.userId || data.user_id;
    this.title = data.title;
    this.type = data.type;
    this.model = data.model;
    this.isProtected = data.isProtected || data.is_protected;
    this.isFavorite = data.isFavorite || data.is_favorite;
    this.status = data.status;
    this.messageCount = data.messageCount || data.message_count;
    this.lastMessageAt = data.lastMessageAt || data.last_message_at;
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;
    this.tags = data.tags || [];
    this.expiresAt = data.expiresAt || data.expires_at;
    this.lastMessage = data.lastMessage || null;
  }

  // 获取类型标签
  getTypeLabel() {
    const labels = {
      'text': '文本对话',
      'image': '图像生成',
      'video': '视频生成',
      '3d': '3D模型'
    };
    return labels[this.type] || '未知类型';
  }

  // 获取格式化的创建时间
  getFormattedCreatedAt() {
    if (!this.createdAt) return '';
    return new Date(this.createdAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 检查是否过期
  isExpired() {
    if (!this.expiresAt || this.isProtected) {
      return false;
    }
    return new Date(this.expiresAt) < new Date();
  }
} 