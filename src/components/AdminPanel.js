import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, MessageSquare, Shield, Ban, 
  CheckCircle, XCircle, Search, Eye, MessageCircle,
  UserCheck, UserX, AlertTriangle, Crown
} from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 模拟用户数据
  useEffect(() => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        username: '张三',
        role: 'user',
        status: 'active',
        lastLogin: '2024-01-20 14:30',
        chatCount: 45,
        permissions: {
          textToText: true,
          textToImage: true,
          imageToImage: false,
          imageToText: true,
          textToVideo: false,
          textTo3d: false
        }
      },
      {
        id: '2',
        email: 'user2@example.com',
        username: '李四',
        role: 'user',
        status: 'banned',
        lastLogin: '2024-01-19 09:15',
        chatCount: 23,
        permissions: {
          textToText: false,
          textToImage: false,
          imageToImage: false,
          imageToText: false,
          textToVideo: false,
          textTo3d: false
        }
      },
      {
        id: '3',
        email: 'support@example.com',
        username: '客服小王',
        role: 'support',
        status: 'active',
        lastLogin: '2024-01-20 16:45',
        chatCount: 156,
        permissions: {
          textToText: true,
          textToImage: true,
          imageToImage: true,
          imageToText: true,
          textToVideo: true,
          textTo3d: true
        }
      }
    ];
    setUsers(mockUsers);
  }, []);

  // 过滤用户
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 切换用户状态
  const toggleUserStatus = async (userId) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'banned' : 'active' }
        : user
    ));
    setIsLoading(false);
  };

  // 切换用户权限
  const togglePermission = async (userId, permission) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            permissions: {
              ...user.permissions,
              [permission]: !user.permissions[permission]
            }
          }
        : user
    ));
    setIsLoading(false);
  };

  // 发送消息给用户
  const sendMessageToUser = async () => {
    if (!selectedUser || !messageText.trim()) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`消息已发送给 ${selectedUser.username}`);
    setMessageText('');
    setSelectedUser(null);
    setIsLoading(false);
  };

  // 获取角色显示名称
  const getRoleName = (role) => {
    const roleNames = {
      'admin': '管理员',
      'support': '客服',
      'user': '普通用户'
    };
    return roleNames[role] || '未知';
  };

  // 获取角色图标
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown size={16} />;
      case 'support': return <MessageCircle size={16} />;
      default: return <Users size={16} />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    return status === 'active' ? '#10b981' : '#ef4444';
  };

  // 获取权限名称
  const getPermissionName = (key) => {
    const names = {
      textToText: '文生文',
      textToImage: '文生图',
      imageToImage: '图生图',
      imageToText: '图生文',
      textToVideo: '文生视频',
      textTo3d: '文生3D'
    };
    return names[key] || key;
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>管理员面板</h2>
        <p>用户管理、权限控制和系统监控</p>
      </div>

      {/* 标签导航 */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={20} />
          用户管理
        </button>
        <button 
          className={`admin-tab ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Shield size={20} />
          权限管理
        </button>
        <button 
          className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquare size={20} />
          消息管理
        </button>
      </div>

      {/* 用户管理 */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>用户管理</h3>
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="users-table">
            <div className="table-header">
              <div>用户信息</div>
              <div>角色</div>
              <div>状态</div>
              <div>最后登录</div>
              <div>对话数</div>
              <div>操作</div>
            </div>
            
            {filteredUsers.map(user => (
              <div key={user.id} className="table-row">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.username.charAt(0)}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.username}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                
                <div className="user-role">
                  <span className={`role-badge ${user.role}`}>
                    {getRoleIcon(user.role)}
                    {getRoleName(user.role)}
                  </span>
                </div>
                
                <div className="user-status">
                  <span 
                    className={`status-indicator ${user.status}`}
                    style={{ backgroundColor: getStatusColor(user.status) }}
                  >
                    {user.status === 'active' ? '正常' : '禁用'}
                  </span>
                </div>
                
                <div className="user-login">{user.lastLogin}</div>
                <div className="user-chats">{user.chatCount}</div>
                
                <div className="user-actions">
                  <button 
                    className={`action-btn ${user.status === 'active' ? 'ban' : 'unban'}`}
                    onClick={() => toggleUserStatus(user.id)}
                    disabled={isLoading}
                  >
                    {user.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                    {user.status === 'active' ? '禁用' : '解禁'}
                  </button>
                  <button 
                    className="action-btn message"
                    onClick={() => setSelectedUser(user)}
                  >
                    <MessageSquare size={16} />
                    发消息
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 权限管理 */}
      {activeTab === 'permissions' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>权限管理</h3>
            <p>管理用户的AI功能访问权限</p>
          </div>

          <div className="permissions-grid">
            {filteredUsers.map(user => (
              <div key={user.id} className="permission-card">
                <div className="card-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.username.charAt(0)}
                    </div>
                    <div>
                      <div className="user-name">{user.username}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'active' ? '正常' : '禁用'}
                  </span>
                </div>

                <div className="permissions-list">
                  {Object.entries(user.permissions).map(([key, enabled]) => (
                    <div key={key} className="permission-item">
                      <span className="permission-name">
                        {getPermissionName(key)}
                      </span>
                      <button
                        className={`permission-toggle ${enabled ? 'enabled' : 'disabled'}`}
                        onClick={() => togglePermission(user.id, key)}
                        disabled={isLoading || user.status === 'banned'}
                      >
                        {enabled ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {enabled ? '已启用' : '已禁用'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 消息管理 */}
      {activeTab === 'messages' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>消息管理</h3>
            <p>向用户发送系统消息和通知</p>
          </div>

          <div className="message-section">
            <div className="broadcast-panel">
              <h4>广播消息</h4>
              <textarea
                placeholder="输入要发送给所有用户的消息..."
                rows="4"
              />
              <button className="broadcast-btn">
                <MessageSquare size={16} />
                发送广播
              </button>
            </div>

            <div className="recent-messages">
              <h4>最近消息</h4>
              <div className="message-list">
                <div className="message-item">
                  <div className="message-info">
                    <span className="message-type">系统通知</span>
                    <span className="message-time">2024-01-20 15:30</span>
                  </div>
                  <div className="message-content">
                    系统将于今晚22:00进行维护，预计持续1小时
                  </div>
                  <div className="message-stats">
                    <span>已读: 156</span>
                    <span>未读: 23</span>
                  </div>
                </div>

                <div className="message-item">
                  <div className="message-info">
                    <span className="message-type">功能更新</span>
                    <span className="message-time">2024-01-19 10:15</span>
                  </div>
                  <div className="message-content">
                    新增文生视频功能，欢迎体验！
                  </div>
                  <div className="message-stats">
                    <span>已读: 201</span>
                    <span>未读: 8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 发送消息弹窗 */}
      {selectedUser && (
        <div className="message-modal-overlay">
          <div className="message-modal">
            <div className="modal-header">
              <h3>发送消息给 {selectedUser.username}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <textarea
                placeholder="输入消息内容..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows="4"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setSelectedUser(null)}
              >
                取消
              </button>
              <button 
                className="send-btn"
                onClick={sendMessageToUser}
                disabled={!messageText.trim() || isLoading}
              >
                <MessageSquare size={16} />
                发送消息
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 