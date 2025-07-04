import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { userAPI, authAPI } from '../services/api';
import './Profile.css';
import UserCorner from "./UserCorner";

const Profile = ({ user, onLogout, onUpdateUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  const tabs = [
    { id: 'profile', name: '个人信息', icon: User },
    { id: 'security', name: '安全设置', icon: Shield }
  ];

  // 加载用户统计数据
  useEffect(() => {
    loadUserStats();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setFormData({
        username: response.username || '',
        email: response.email || ''
      });
    } catch (error) {
      console.error('加载用户资料失败:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await userAPI.getUsageStats();
      setStats(response);
    } catch (error) {
      console.error('加载用户统计失败:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(formData);
      
      setIsEditing(false);
      alert('个人信息更新成功');
      
      // 重新加载资料
      loadUserProfile();
    } catch (error) {
      console.error('更新个人信息失败:', error);
      alert(error.response?.data || '更新个人信息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 密码表单处理
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('新密码和确认密码不匹配');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('新密码长度不能少于6位');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      alert('密码修改成功');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false
      });
    } catch (error) {
      console.error('密码修改失败:', error);
      
      // 处理不同类型的错误响应
      let errorMessage = '密码修改失败，请重试';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
          
          // 如果有验证错误详情，显示具体字段错误
          if (errorData.details) {
            const details = Object.values(errorData.details).join(', ');
            errorMessage = `${errorData.error}: ${details}`;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-content">
            <div className="profile-header">
              <div className="avatar-section">
                <div className="avatar-container">
                  <div className="user-avatar-large placeholder">
                    {formData.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="profile-actions">
                  {!isEditing ? (
                    <button className="btn-primary" onClick={() => setIsEditing(true)}>
                      <Edit size={16} />
                      编辑资料
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button 
                        className="btn-success" 
                        onClick={handleSave}
                        disabled={loading}
                      >
                        <Save size={16} />
                        {loading ? '保存中...' : '保存'}
                      </button>
                      <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                        <X size={16} />
                        取消
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-form">
              <div className="form-section">
                <h3>基本信息</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>用户名</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div className="form-group">
                    <label>邮箱</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="请输入邮箱"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>使用统计</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{stats?.totalChats || 0}</div>
                    <div className="stat-label">总对话次数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats?.totalMessages || 0}</div>
                    <div className="stat-label">消息总数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats?.favoriteChats || 0}</div>
                    <div className="stat-label">收藏对话</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats?.usageDays || 0}</div>
                    <div className="stat-label">使用天数</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );



      case 'security':
        return (
          <div className="tab-content">
            <div className="security-section">
              <h3>修改密码</h3>
              <div className="password-form">
                <div className="form-group">
                  <label>当前密码</label>
                  <div className="password-input">
                    <input
                      type={passwordForm.showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="请输入当前密码"
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('showCurrentPassword')}
                    >
                      {passwordForm.showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>新密码</label>
                  <div className="password-input">
                    <input
                      type={passwordForm.showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="请输入新密码"
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('showNewPassword')}
                    >
                      {passwordForm.showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>确认新密码</label>
                  <div className="password-input">
                    <input
                      type={passwordForm.showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="请再次输入新密码"
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('showConfirmPassword')}
                    >
                      {passwordForm.showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button 
                  className="btn-primary" 
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  <Key size={16} />
                  {loading ? '修改中...' : '修改密码'}
                </button>
              </div>
            </div>


          </div>
        );



      default:
        return null;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header-bar">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          <span className="back-text">返回</span>
        </button>
        <h1>个人中心</h1>
        <UserCorner user={user} onLogout={onLogout} />
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="profile-main">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile; 