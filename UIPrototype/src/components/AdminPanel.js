import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, MessageSquare, Shield, Ban, 
  CheckCircle, XCircle, Search, Eye, MessageCircle,
  UserCheck, UserX, AlertTriangle, Crown
} from 'lucide-react';
import { adminAPI } from '../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleUpdateUser, setRoleUpdateUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sentMessages, setSentMessages] = useState([]);

  // 加载用户数据
  useEffect(() => {
    loadUsers();
    loadSentMessages();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('开始加载用户数据...');
      const response = await adminAPI.getUsers({
        keyword: searchQuery,
        page: 0,
        size: 50
      });
      console.log('用户数据响应:', response);
      
      // 后端返回的是Spring Page对象，用户数据在content字段中
      const userList = response.content || [];
      setUsers(userList);
      console.log('设置用户列表:', userList);
    } catch (error) {
      console.error('加载用户数据失败:', error);
      alert('加载用户数据失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载已发送消息
  const loadSentMessages = async () => {
    try {
      const messages = await adminAPI.getSentMessages();
      setSentMessages(messages.content || messages || []);
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  // 发送广播消息
  const sendBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) {
      alert('请输入广播消息内容');
      return;
    }

    try {
      setIsLoading(true);
      
      // 发送广播消息给所有用户
      const activeUsers = users.filter(u => u.status === 'active');
      const promises = activeUsers.map(user => 
        adminAPI.sendMessage(user.id, {
          title: '系统广播',
          content: broadcastMessage
        })
      );
      
      await Promise.all(promises);
      
      alert(`广播消息已发送给 ${activeUsers.length} 个活跃用户`);
      setBroadcastMessage('');
      loadSentMessages();
      
    } catch (error) {
      console.error('发送广播失败:', error);
      alert('发送广播失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 切换用户状态
  const toggleUserStatus = async (userId) => {
    try {
      setIsLoading(true);
      const user = users.find(u => u.id === userId);
      const newStatus = user.status === 'active' ? 'banned' : 'active';
      
      await adminAPI.updateUserStatus(userId, newStatus);
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      ));
    } catch (error) {
      console.error('更新用户状态失败:', error);
      alert('更新用户状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 切换用户权限
  const togglePermission = async (userId, permission) => {
    try {
      setIsLoading(true);
      const user = users.find(u => u.id === userId);
      const currentPermissions = getStandardPermissions(user);
      const newPermissions = {
        ...currentPermissions,
        [permission]: !currentPermissions[permission]
      };
      
      console.log('更新权限:', userId, permission, '当前权限:', currentPermissions, '新权限:', newPermissions);
      
      await adminAPI.updateUserPermissions(userId, newPermissions);
      
      // 更新本地状态，将权限保存为JSON字符串格式（与后端一致）
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, permissions: JSON.stringify(newPermissions) }
          : user
      ));
      
      console.log('权限更新成功');
    } catch (error) {
      console.error('更新用户权限失败:', error);
      alert('更新用户权限失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 发送消息给用户
  const sendMessageToUser = async () => {
    if (!selectedUser || !messageText.trim()) return;
    
    try {
      setIsLoading(true);
      
      await adminAPI.sendMessage(selectedUser.id, {
        title: '管理员消息',
        content: messageText
      });
      
      alert(`消息已发送给 ${selectedUser.username}`);
      setMessageText('');
      setSelectedUser(null);
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 打开角色修改对话框
  const openRoleModal = (user) => {
    setRoleUpdateUser(user);
    setNewRole(user.role);
    setRoleChangeReason('');
    setShowRoleModal(true);
  };

  // 修改用户角色
  const updateUserRole = async () => {
    if (!roleUpdateUser || !newRole || !roleChangeReason.trim()) {
      alert('请填写完整的角色信息和修改原因');
      return;
    }

    try {
      setIsLoading(true);
      
      const updatedUser = await adminAPI.updateUserRole(roleUpdateUser.id, {
        role: newRole,
        reason: roleChangeReason
      });
      
      // 更新本地用户列表
      setUsers(prev => prev.map(user => 
        user.id === roleUpdateUser.id ? updatedUser : user
      ));
      
      alert(`用户 ${roleUpdateUser.username} 的角色已更新为 ${getRoleName(newRole)}`);
      setShowRoleModal(false);
      setRoleUpdateUser(null);
      setNewRole('');
      setRoleChangeReason('');
    } catch (error) {
      console.error('修改用户角色失败:', error);
      alert('修改用户角色失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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
      text_to_text: '文生文',
      text_to_image: '文生图',
      image_to_image: '图生图',
      image_to_text: '图生文',
      text_to_video: '文生视频',
      text_to_3d: '文生3D',
      chat: '基础聊天',
      file_upload: '文件上传',
      data_export: '数据导出'
    };
    return names[key] || key;
  };

  // 获取标准权限列表（处理后端返回的权限数据）
  const getStandardPermissions = (user) => {
    // 如果permissions是对象且不为null，直接返回
    if (typeof user.permissions === 'object' && user.permissions !== null) {
      return user.permissions;
    }

    // 如果permissions是JSON字符串，尝试解析
    if (typeof user.permissions === 'string' && user.permissions.trim().startsWith('{')) {
      try {
        return JSON.parse(user.permissions);
      } catch (e) {
        console.warn('无法解析用户权限JSON:', user.permissions);
      }
    }

    // 如果permissions是其他字符串格式或解析失败，根据角色返回标准权限
    const rolePermissions = {
      admin: {
        text_to_text: true,
        text_to_image: true,
        image_to_image: true,
        image_to_text: true,
        text_to_video: true,
        text_to_3d: true,
        chat: true,
        file_upload: true,
        data_export: true
      },
      support: {
        text_to_text: true,
        text_to_image: false,
        image_to_image: false,
        image_to_text: true,
        text_to_video: false,
        text_to_3d: false,
        chat: true,
        file_upload: true,
        data_export: false
      },
      user: {
        text_to_text: true,
        text_to_image: false,
        image_to_image: false,
        image_to_text: false,
        text_to_video: false,
        text_to_3d: false,
        chat: true,
        file_upload: false,
        data_export: false
      }
    };

    return rolePermissions[user.role] || rolePermissions.user;
  };
  
  // 搜索变化时重新加载数据
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadUsers();
    }, 500);
    
    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

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
            
            {/* 调试信息 */}
            {users.length === 0 && !isLoading && (
              <div className="no-users-message">
                <p>暂无用户数据</p>
                <p>用户总数: {users.length}</p>
                <p>过滤后用户数: {filteredUsers.length}</p>
              </div>
            )}
            
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
                    className="action-btn role"
                    onClick={() => openRoleModal(user)}
                    disabled={isLoading}
                  >
                    <Crown size={16} />
                    改角色
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
                  {Object.entries(getStandardPermissions(user)).map(([key, enabled]) => (
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
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows="4"
              />
              <button 
                className="broadcast-btn"
                onClick={sendBroadcastMessage}
                disabled={!broadcastMessage.trim() || isLoading}
              >
                <MessageSquare size={16} />
                {isLoading ? '发送中...' : '发送广播'}
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

      {/* 修改角色弹窗 */}
      {showRoleModal && roleUpdateUser && (
        <div className="modal-overlay">
          <div className="role-modal">
            <div className="modal-header">
              <h3>修改用户角色</h3>
              <button 
                className="close-btn"
                onClick={() => setShowRoleModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="user-info-section">
                <div className="user-avatar">
                  {roleUpdateUser.username.charAt(0)}
                </div>
                <div>
                  <div className="user-name">{roleUpdateUser.username}</div>
                  <div className="user-email">{roleUpdateUser.email}</div>
                  <div className="current-role">
                    当前角色: <span className={`role-badge ${roleUpdateUser.role}`}>
                      {getRoleIcon(roleUpdateUser.role)}
                      {getRoleName(roleUpdateUser.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>新角色</label>
                <select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                  className="role-select"
                >
                  <option value="user">普通用户</option>
                  <option value="support">客服</option>
                  <option value="admin">管理员</option>
                </select>
              </div>

              <div className="form-group">
                <label>修改原因 *</label>
                <textarea
                  placeholder="请说明修改角色的原因..."
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  rows="3"
                  className="reason-textarea"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowRoleModal(false)}
              >
                取消
              </button>
              <button 
                className="confirm-btn"
                onClick={updateUserRole}
                disabled={!newRole || !roleChangeReason.trim() || isLoading}
              >
                <Crown size={16} />
                确认修改
              </button>
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