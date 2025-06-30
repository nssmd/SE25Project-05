// 用户注册DTO
export class UserRegisterDTO {
  constructor(data = {}) {
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.confirmPassword = data.confirmPassword || '';
    this.realName = data.realName || '';
    this.phone = data.phone || '';
    this.department = data.department || '';
  }

  // 验证数据
  validate() {
    const errors = [];
    
    if (!this.username || this.username.length < 3) {
      errors.push('用户名至少需要3个字符');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(this.username)) {
      errors.push('用户名只能包含字母、数字和下划线');
    }
    
    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('请输入有效的邮箱地址');
    }
    
    if (!this.password || this.password.length < 6) {
      errors.push('密码至少需要6个字符');
    }
    
    if (this.password !== this.confirmPassword) {
      errors.push('两次输入的密码不一致');
    }
    
    if (this.phone && !/^1[3-9]\d{9}$/.test(this.phone)) {
      errors.push('请输入有效的手机号码');
    }
    
    return errors;
  }

  // 转换为API请求格式
  toApiRequest() {
    return {
      username: this.username,
      email: this.email,
      password: this.password,
      realName: this.realName,
      phone: this.phone,
      department: this.department
    };
  }
}

// 用户登录DTO
export class UserLoginDTO {
  constructor(data = {}) {
    this.email = data.email || '';
    this.password = data.password || '';
    this.rememberMe = data.rememberMe || false;
  }

  // 验证数据
  validate() {
    const errors = [];
    
    if (!this.email) {
      errors.push('请输入邮箱地址');
    }
    
    if (!this.password) {
      errors.push('请输入密码');
    }
    
    return errors;
  }

  // 转换为API请求格式
  toApiRequest() {
    return {
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe
    };
  }
}

// 用户资料更新DTO
export class UserProfileUpdateDTO {
  constructor(data = {}) {
    this.username = data.username || '';
    this.realName = data.realName || '';
    this.phone = data.phone || '';
    this.department = data.department || '';
    this.avatar = data.avatar || '';
    this.preferences = data.preferences || {};
  }

  // 验证数据
  validate() {
    const errors = [];
    
    if (this.username && this.username.length < 3) {
      errors.push('用户名至少需要3个字符');
    }
    
    if (this.phone && !/^1[3-9]\d{9}$/.test(this.phone)) {
      errors.push('请输入有效的手机号码');
    }
    
    return errors;
  }

  // 转换为API请求格式
  toApiRequest() {
    return {
      username: this.username,
      realName: this.realName,
      phone: this.phone,
      department: this.department,
      avatar: this.avatar,
      preferences: this.preferences
    };
  }
}

// 密码修改DTO
export class PasswordChangeDTO {
  constructor(data = {}) {
    this.currentPassword = data.currentPassword || '';
    this.newPassword = data.newPassword || '';
    this.confirmPassword = data.confirmPassword || '';
  }

  // 验证数据
  validate() {
    const errors = [];
    
    if (!this.currentPassword) {
      errors.push('请输入当前密码');
    }
    
    if (!this.newPassword || this.newPassword.length < 6) {
      errors.push('新密码至少需要6个字符');
    }
    
    if (this.newPassword !== this.confirmPassword) {
      errors.push('两次输入的新密码不一致');
    }
    
    if (this.currentPassword === this.newPassword) {
      errors.push('新密码不能与当前密码相同');
    }
    
    return errors;
  }

  // 转换为API请求格式
  toApiRequest() {
    return {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    };
  }
}

// 用户响应DTO
export class UserResponseDTO {
  constructor(data = {}) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.realName = data.realName || data.real_name;
    this.phone = data.phone;
    this.department = data.department;
    this.role = data.role;
    this.status = data.status;
    this.avatar = data.avatar;
    this.preferences = data.preferences;
    this.createdAt = data.createdAt || data.created_at;
    this.lastLogin = data.lastLogin || data.last_login;
    this.emailVerified = data.emailVerified || data.email_verified;
  }

  // 获取显示名称
  getDisplayName() {
    return this.realName || this.username;
  }

  // 检查权限
  hasPermission(permission) {
    // 根据角色判断权限
    const rolePermissions = {
      'admin': ['all'],
      'customer_service': ['chat', 'view_user_info', 'customer_service'],
      'user': ['chat', 'profile_edit', 'data_management']
    };
    
    const userPermissions = rolePermissions[this.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }
} 