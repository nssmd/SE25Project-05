import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Settings, 
  Bell, 
  Shield, 
  CreditCard, 
  Download, 
  Upload,
  Edit,
  Save,
  X
} from 'lucide-react';
import './Profile.css';

const Profile = ({ user, onLogout, onUpdateUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatar: user?.avatar || null
  });

  const tabs = [
    { id: 'profile', name: '个人信息', icon: User },
    { id: 'settings', name: '账户设置', icon: Settings },
    { id: 'notifications', name: '通知设置', icon: Bell },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'billing', name: '账单管理', icon: CreditCard }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // 模拟保存用户信息
    onUpdateUser(formData);
    setIsEditing(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          avatar: e.target.result
        }));
      };
      reader.readAsDataURL(file);
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
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="头像" className="user-avatar-large" />
                  ) : (
                    <div className="user-avatar-large placeholder">
                      {formData.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  {isEditing && (
                    <label className="avatar-upload">
                      <Upload size={16} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
                <div className="profile-actions">
                  {!isEditing ? (
                    <button className="btn-primary" onClick={() => setIsEditing(true)}>
                      <Edit size={16} />
                      编辑资料
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button className="btn-success" onClick={handleSave}>
                        <Save size={16} />
                        保存
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
                    <label>姓名</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
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
                    />
                  </div>
                  <div className="form-group">
                    <label>手机号</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="请输入手机号"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>个人简介</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="介绍一下自己..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>使用统计</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">1,234</div>
                    <div className="stat-label">总对话次数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">56</div>
                    <div className="stat-label">生成图片</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">12</div>
                    <div className="stat-label">训练模型</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">89h</div>
                    <div className="stat-label">使用时长</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="tab-content">
            <div className="settings-section">
              <h3>界面设置</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>深色模式</h4>
                  <p>切换到深色主题</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>语言设置</h4>
                  <p>选择界面语言</p>
                </div>
                <select className="setting-select">
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="settings-section">
              <h3>隐私设置</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>数据收集</h4>
                  <p>允许收集使用数据以改善服务</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>对话历史</h4>
                  <p>保存对话记录</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="tab-content">
            <div className="settings-section">
              <h3>推送通知</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>训练完成通知</h4>
                  <p>模型训练完成时通知我</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>系统更新</h4>
                  <p>新功能和更新通知</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>邮件通知</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <h4>周报摘要</h4>
                  <p>每周发送使用报告</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="tab-content">
            <div className="settings-section">
              <h3>密码安全</h3>
              <button className="btn-primary">修改密码</button>
              <button className="btn-secondary">启用双因素认证</button>
            </div>

            <div className="settings-section">
              <h3>登录记录</h3>
              <div className="login-records">
                <div className="login-record">
                  <div className="record-info">
                    <div className="device">Windows PC - Chrome</div>
                    <div className="time">2024-01-16 14:30</div>
                  </div>
                  <div className="location">北京市</div>
                </div>
                <div className="login-record">
                  <div className="record-info">
                    <div className="device">iPhone - Safari</div>
                    <div className="time">2024-01-15 09:15</div>
                  </div>
                  <div className="location">上海市</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="tab-content">
            <div className="billing-overview">
              <div className="billing-card">
                <h3>当前套餐</h3>
                <div className="plan-info">
                  <div className="plan-name">专业版</div>
                  <div className="plan-price">¥99/月</div>
                </div>
                <button className="btn-primary">升级套餐</button>
              </div>
            </div>

            <div className="settings-section">
              <h3>账单历史</h3>
              <div className="billing-history">
                <div className="billing-item">
                  <div className="billing-info">
                    <div className="billing-date">2024-01-01</div>
                    <div className="billing-desc">专业版月费</div>
                  </div>
                  <div className="billing-amount">¥99</div>
                  <button className="btn-link">
                    <Download size={16} />
                    下载
                  </button>
                </div>
                <div className="billing-item">
                  <div className="billing-info">
                    <div className="billing-date">2023-12-01</div>
                    <div className="billing-desc">专业版月费</div>
                  </div>
                  <div className="billing-amount">¥99</div>
                  <button className="btn-link">
                    <Download size={16} />
                    下载
                  </button>
                </div>
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
      <header className="profile-header-bar">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={20} />
          <span className="back-text">返回</span>
        </button>
        <h1>个人中心</h1>
        <button onClick={onLogout} className="logout-btn">
          退出
        </button>
      </header>

      <div className="profile-container">
        <nav className="profile-sidebar">
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
        </nav>

        <main className="profile-main">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default Profile; 