import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import './Auth.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误提示
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱格式';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // 尝试使用真实API，如果不可用则回退到模拟模式
      try {
        const { authAPI, apiUtils } = await import('../services/api');
        
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        
        // 保存token和用户信息
        apiUtils.setAuthToken(response.token);
        apiUtils.setCurrentUser(response.user);
        
        onLogin(response.user);
      } catch (apiError) {
        console.warn('API不可用，使用演示模式:', apiError.message);
        
        // 回退到演示模式
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 根据邮箱模拟不同角色
        let role = 'user';
        let name = '普通用户';
        
        if (formData.email.includes('admin')) {
          role = 'admin';
          name = '管理员';
        } else if (formData.email.includes('support')) {
          role = 'support';
          name = '客服';
        }
        
        // 模拟成功登录
        const userData = {
          id: 1,
          name: name,
          email: formData.email,
          role: role,
          avatar: null
        };
        
        // 模拟保存到localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        onLogin(userData);
      }
    } catch (error) {
      setErrors({ submit: '登录失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <User className="logo-icon" />
            <span>AI平台</span>
          </div>
          <h1>欢迎回来</h1>
          <p>登录您的账户以继续使用我们的AI服务</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="输入您的邮箱"
                className={errors.email ? 'error' : ''}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="输入您的密码"
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {errors.submit && <div className="error-text">{errors.submit}</div>}

          <button 
            type="submit" 
            className={`auth-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="auth-footer">
          <div className="demo-accounts">
            <h4>演示账户：</h4>
            <div className="demo-list">
              <div className="demo-item">
                <strong>普通用户：</strong> user@example.com
              </div>
              <div className="demo-item">
                <strong>客服：</strong> support@example.com
              </div>
              <div className="demo-item">
                <strong>管理员：</strong> admin@example.com
              </div>
            </div>
            <p className="demo-note">密码：任意6位字符</p>
          </div>
          
          <p>
            还没有账户？{' '}
            <Link to="/register" className="auth-link">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 