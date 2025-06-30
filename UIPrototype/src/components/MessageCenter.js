import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Bell, 
  Users, 
  Send, 
  Clock, 
  CheckCircle, 
  ArrowLeft,
  Trash2,
  Search,
  Mail,
  User,
  Shield,
  Phone,
  MessageCircle,
  UserCircle,
  Headphones,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { userAPI, adminAPI } from '../services/api';
import './MessageCenter.css';

const MessageCenter = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [supportChat, setSupportChat] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [supportStaff, setSupportStaff] = useState([]);
  const [selectedSupport, setSelectedSupport] = useState(null);

  const [notification, setNotification] = useState(null);
  
  // 如果是客服账户，加载客户对话列表
  const [customerChats, setCustomerChats] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // 显示通知
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    console.log('MessageCenter - 当前用户信息:', user);
    console.log('MessageCenter - 用户角色:', user?.role);
    
    loadMessages();
    
    // 普通用户和管理员都可以使用客服对话功能
    if (user?.role === 'user' || user?.role === 'admin') {
      console.log('MessageCenter - 加载客服人员列表 (用户/管理员)');
      loadSupportStaff();
    }
    
    // 只有客服才加载客服工作台数据
    if (user?.role === 'support') {
      console.log('MessageCenter - 加载客服工作台数据 (客服用户)');
      loadCustomerChats();
    }
    
    // 调试：如果用户角色不是预期的，显示警告
    if (user && !['user', 'support', 'admin'].includes(user.role)) {
      console.warn('MessageCenter - 未知的用户角色:', user.role);
    }
  }, [user]);

  // 当选择的客服改变时，重新加载对话
  useEffect(() => {
    if (user?.role === 'user' || user?.role === 'admin') {
      if (selectedSupport) {
    loadSupportChat();
      } else {
        // 没有选择客服时，清空对话记录
        setSupportChat([]);
      }
    }
  }, [selectedSupport, user]);

  // 加载接收到的消息
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getMessages();
      console.log('加载的消息数据:', response);
      
      if (response.content) {
        setMessages(response.content);
      } else if (Array.isArray(response)) {
        setMessages(response);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载客服人员列表
  const loadSupportStaff = async () => {
    try {
      console.log('正在从后端加载客服人员列表...');
      console.log('当前用户:', user);
      console.log('API调用: /user/support/staff');
      
      const response = await userAPI.getSupportStaff();
      console.log('后端客服人员原始响应:', response);
      console.log('响应类型:', typeof response);
      console.log('响应是否为数组:', Array.isArray(response));
      
      // 处理不同的响应格式
      let staffList = [];
      if (Array.isArray(response)) {
        staffList = response;
        console.log('使用响应作为数组');
      } else if (response && response.data && Array.isArray(response.data)) {
        staffList = response.data;
        console.log('使用response.data作为数组');
      } else if (response && Array.isArray(response.content)) {
        staffList = response.content;
        console.log('使用response.content作为数组');
      } else {
        console.log('响应格式不匹配，staffList保持为空数组');
      }
      
      console.log('提取的staffList:', staffList);
      
      // 为每个客服添加在线状态（从后端获取或默认）
      staffList = staffList.map(staff => ({
        ...staff,
        status: staff.status || 'online' // 默认在线状态
      }));
      
      setSupportStaff(staffList);
      console.log('最终设置的客服人员列表:', staffList);
      
      if (staffList.length === 0) {
        showNotification('暂无可用的客服人员，请检查后端数据', 'error');
      } else {
        showNotification(`成功加载 ${staffList.length} 位客服人员`, 'success');
      }
      
    } catch (error) {
      console.error('从后端加载客服人员失败:', error);
      console.error('错误详情:', error.response?.data);
      console.error('错误状态:', error.response?.status);
      showNotification('加载客服人员失败: ' + error.message, 'error');
      setSupportStaff([]); // 只设置空数组，不使用模拟数据
    }
  };

  // 加载客服对话 - 根据选中的客服过滤
  const loadSupportChat = async () => {
    try {
      const response = await userAPI.getSupportChat();
      console.log('客服对话数据:', response);
      
      let allChats = Array.isArray(response) ? response : [];
      
      // 如果选择了特定客服，只显示与该客服的对话
      if (selectedSupport) {
        console.log('过滤对话，选中的客服:', selectedSupport);
        console.log('所有对话:', allChats);
        
        const filteredChats = allChats.filter(chat => {
          console.log('检查消息:', chat);
          
          // 显示用户发送给该客服的消息
          if (chat.senderType === 'USER') {
            // 如果没有指定客服ID，或者指定的客服ID匹配选中的客服
            const chatSupportId = chat.supportId;
            const selectedSupportId = selectedSupport.id;
            
            console.log('用户消息 - chatSupportId:', chatSupportId, 'selectedSupportId:', selectedSupportId);
            
            return chatSupportId === selectedSupportId || 
                   String(chatSupportId) === String(selectedSupportId) ||
                   chatSupportId === null; // 如果没有指定客服，也显示（兼容旧数据）
          }
          
          // 显示该客服回复的消息
          if (chat.senderType === 'SUPPORT') {
            const chatSupportId = chat.supportId || (chat.fromUser && chat.fromUser.id);
            const selectedSupportId = selectedSupport.id;
            
            console.log('客服消息 - chatSupportId:', chatSupportId, 'selectedSupportId:', selectedSupportId);
            
            return chatSupportId === selectedSupportId || 
                   String(chatSupportId) === String(selectedSupportId);
          }
          
          return false;
        });
        
        console.log('过滤后的对话:', filteredChats);
        setSupportChat(filteredChats);
      } else {
        // 没有选择客服时，不显示任何对话
        console.log('没有选择客服，清空对话列表');
        setSupportChat([]);
      }
    } catch (error) {
      console.error('加载客服对话失败:', error);
      setSupportChat([]);
    }
  };

  // 客服加载客户对话列表
  const loadCustomerChats = async () => {
    // 确保只有客服角色才能调用此API
    if (user?.role !== 'support') {
      console.warn('loadCustomerChats - 当前用户不是客服角色，跳过加载:', user?.role);
      return;
    }
    
    try {
      console.log('loadCustomerChats - 开始加载客户对话列表');
      console.log('当前用户:', user);
      console.log('API调用: /admin/support/customer-chats');
      
      // 调用客服专用API获取客户对话
      const response = await adminAPI.getCustomerChats();
      console.log('loadCustomerChats - 原始响应:', response);
      console.log('响应类型:', typeof response);
      console.log('响应是否为数组:', Array.isArray(response));
      
      const customerChatsList = Array.isArray(response) ? response : [];
      setCustomerChats(customerChatsList);
      
      console.log('设置的客户对话列表:', customerChatsList);
      if (customerChatsList.length === 0) {
        showNotification('暂无客户对话记录', 'info');
      } else {
        showNotification(`成功加载 ${customerChatsList.length} 个客户对话`, 'success');
      }
      
    } catch (error) {
      console.error('加载客户对话失败:', error);
      console.error('错误详情:', error.response?.data);
      console.error('错误状态:', error.response?.status);
      
      // 如果是权限错误，显示友好提示
      if (error.message.includes('权限不足') || error.response?.status === 403) {
        showNotification('您没有权限访问客服工作台，请检查用户角色', 'error');
      } else {
        showNotification('加载客户对话失败: ' + error.message, 'error');
      }
      
      setCustomerChats([]);
    }
  };

  // 发送消息给客服
  const sendToSupport = async () => {
    if (!newMessage.trim() || !selectedSupport) {
      if (!selectedSupport) {
        alert('请先选择一位客服人员');
        return;
      }
      return;
    }

    try {
      setIsLoading(true);
      
      await userAPI.sendToSupport({
        content: newMessage,
        supportId: selectedSupport.id
      });

      // 立即在本地添加用户发送的消息
      const newChatMessage = {
        id: Date.now(),
        messageType: 'SUPPORT',
        content: newMessage,
        createdAt: new Date().toISOString(),
        senderType: 'USER',
        fromUserId: user.id,
        fromUser: user,
        isRead: true
      };

      setSupportChat(prev => [...prev, newChatMessage]);
      setNewMessage('');
      
      // 显示成功通知
      showNotification(`消息已发送给 ${selectedSupport.username}`);
      
      // 重新加载对话以获取最新状态
      setTimeout(loadSupportChat, 500);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      showNotification('发送消息失败: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 客服回复客户
  const replyToCustomer = async () => {
    if (!newMessage.trim() || !selectedCustomer) return;

    try {
      setIsLoading(true);
      
      await adminAPI.replyToCustomer({
        customerId: selectedCustomer.id,
        content: newMessage
      });

      setNewMessage('');
      showNotification('消息发送成功', 'success');
      
      // 刷新客户对话列表
      await loadCustomerChats();
      
    } catch (error) {
      console.error('回复客户失败:', error);
      showNotification('回复失败: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 标记消息为已读
  const markAsRead = async (messageId) => {
    try {
      await userAPI.markMessageAsRead(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 删除消息
  const deleteMessage = async (messageId) => {
    if (!window.confirm('确定要删除这条消息吗？')) return;

    try {
      console.log('正在删除消息:', messageId);
      await userAPI.deleteMessage(messageId);
      console.log('消息删除成功');
      
      // 更新本地状态
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      
      // 显示成功通知
      showNotification('消息删除成功');
    } catch (error) {
      console.error('删除消息失败:', error);
      showNotification(`删除消息失败: ${error.message}`, 'error');
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) { // 24小时内
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) { // 7天内
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 获取发信人信息
  const getSenderInfo = (message) => {
    if (message.fromUser) {
      return {
        name: message.fromUser.username || '用户',
        avatar: message.fromUser.username?.charAt(0) || 'U',
        role: message.fromUser.role || 'user'
      };
    }
    
    // 根据消息类型推断
    if (message.messageType === 'BROADCAST') {
      return { name: '系统管理员', avatar: 'S', role: 'admin' };
    } else if (message.messageType === 'SUPPORT') {
      return { name: '客服团队', avatar: 'C', role: 'support' };
    } else {
      return { name: '系统', avatar: 'S', role: 'system' };
    }
  };

  // 获取未读消息数量
  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className="message-center">
      {/* 通知组件 */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'success' && <CheckCircle size={16} />}
            {notification.type === 'error' && <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      <div className="message-center-header">
        <div className="header-left">
          <div className="header-icon">
            <MessageSquare size={28} />
          </div>
          <div className="header-text">
          <h1>消息中心</h1>
            <p>查看系统消息{(user?.role === 'user' || user?.role === 'admin') ? '和客服对话' : user?.role === 'support' ? '和客服工作台' : ''}</p>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          返回主页
        </button>
      </div>

      <div className="message-center-content">
        {/* 标签导航 */}
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <Bell size={20} />
            <span>系统消息</span>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          
          {/* 普通用户和管理员都能看到客服对话 */}
          {(user?.role === 'user' || user?.role === 'admin') && (
          <button 
            className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <MessageSquare size={20} />
              <span>客服对话</span>
            </button>
          )}
          
          {/* 只有客服才能看到客服工作台 */}
          {user?.role === 'support' && (
            <button 
              className={`tab-btn ${activeTab === 'support-desk' ? 'active' : ''}`}
              onClick={() => setActiveTab('support-desk')}
            >
              <Headphones size={20} />
              <span>客服工作台</span>
          </button>
          )}
        </div>

        {/* 系统消息 */}
        {activeTab === 'messages' && (
          <div className="tab-content">

            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>加载消息中...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state">
                <Bell size={48} />
                <h3>暂无消息</h3>
                <p>您还没有收到任何系统消息</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map(message => {
                  const senderInfo = getSenderInfo(message);
                  return (
                  <div 
                    key={message.id} 
                    className={`message-item ${!message.isRead ? 'unread' : ''}`}
                    >
                      <div className="message-avatar">
                        <div className={`avatar ${senderInfo.role}`}>
                          {senderInfo.avatar}
                        </div>
                        <div className="sender-info">
                          <div className="sender-name">{senderInfo.name}</div>
                          <div className="sender-role">
                            {senderInfo.role === 'admin' && <Shield size={12} />}
                            {senderInfo.role === 'support' && <Headphones size={12} />}
                            {senderInfo.role === 'user' && <User size={12} />}
                            {senderInfo.role === 'system' && <Bell size={12} />}
                            <span>
                              {senderInfo.role === 'admin' ? '管理员' : 
                               senderInfo.role === 'support' ? '客服' : 
                               senderInfo.role === 'user' ? '用户' : '系统'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="message-main">
                    <div className="message-header">
                      <h4 className="message-title">
                        {message.subject || '系统通知'}
                      </h4>
                      <div className="message-meta">
                        <span className="message-time">
                              <Clock size={14} />
                          {formatTime(message.createdAt)}
                        </span>
                        <span className={`message-status ${message.isRead ? 'read' : 'unread'}`}>
                              {message.isRead ? (
                                <>
                                  <CheckCircle size={14} />
                                  已读
                                </>
                              ) : (
                                <>
                                  <Mail size={14} />
                                  未读
                                </>
                              )}
                        </span>
                      </div>
                    </div>
                        
                    <div className="message-content">
                      {message.content}
                    </div>
                        
                    <div className="message-actions">
                      {!message.isRead && (
                        <button 
                          className="action-btn mark-read"
                              onClick={() => markAsRead(message.id)}
                              title="标记为已读"
                        >
                          <CheckCircle size={14} />
                          标记已读
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                            onClick={() => deleteMessage(message.id)}
                            title="删除此消息"
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 客服对话（普通用户和管理员） */}
        {activeTab === 'support' && (user?.role === 'user' || user?.role === 'admin') && (
          <div className="tab-content">
            <div className="support-chat-container">
              {/* 客服选择侧边栏 */}
              <div className="support-sidebar">
                <div className="sidebar-header">
                  <h3>
                    <Users size={18} />
                    选择客服人员
                  </h3>
                  <div className="online-count">
                    <div className="status-indicator online"></div>
                    在线: {supportStaff.filter(s => s.status === 'online').length} 人
                  </div>
                </div>
                
                {supportStaff.length === 0 ? (
                  <div className="sidebar-empty">
                    <Headphones size={24} />
                    <p>暂无客服在线</p>
                    <button className="retry-btn" onClick={loadSupportStaff}>
                      刷新
                    </button>
                  </div>
                ) : (
                  <div className="support-list">
                    {supportStaff.map(staff => (
                      <div 
                        key={staff.id}
                        className={`support-item ${selectedSupport?.id === staff.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedSupport(staff);
                          loadSupportChat();
                        }}
                      >
                        <div className="support-avatar">
                          <span>{staff.username?.charAt(0) || 'S'}</span>
                          <div className={`status-dot ${staff.status}`}></div>
                        </div>
                        <div className="support-info">
                          <div className="support-name">{staff.username}</div>
                          <div className="support-status">
                            {staff.status === 'online' ? '在线' : 
                             staff.status === 'busy' ? '忙碌' : '离线'}
                          </div>
                        </div>
                        {selectedSupport?.id === staff.id && (
                          <div className="selected-indicator">
                            <Check size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 对话主区域 */}
              <div className="chat-main">
                {selectedSupport ? (
                  <>
                    {/* 聊天头部 */}
                    <div className="chat-header">
                      <div className="chat-title">
                        <div className="support-avatar-small">
                          <span>{selectedSupport.username?.charAt(0) || 'S'}</span>
                          <div className={`status-dot ${selectedSupport.status}`}></div>
                        </div>
                        <div className="title-info">
                          <h4>{selectedSupport.username}</h4>
                          <span className="role-tag">客服专员</span>
                        </div>
                      </div>
                      <div className="chat-actions">
                        <button className="action-btn" title="刷新对话">
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>

                    {/* 消息区域 */}
                    <div className="chat-messages">
                      {supportChat.length === 0 ? (
                        <div className="chat-empty">
                          <MessageCircle size={48} />
                          <h3>开始与 {selectedSupport.username} 对话</h3>
                          <p>请输入您的问题，我们将尽快为您解答</p>
                        </div>
                      ) : (
                        <div className="messages-list">
                          {supportChat.map((msg, index) => (
                            <div 
                              key={msg.id || index} 
                              className={`message ${msg.senderType === 'USER' ? 'own' : 'other'}`}
                            >
                              <div className="message-content">
                                <div 
                                  className="message-bubble"
                                  style={{
                                    backgroundColor: msg.senderType === 'SUPPORT' ? '#4ade80' : '#e5e7eb',
                                    color: '#000000',
                                    padding: '12px 16px',
                                    borderRadius: '18px',
                                    maxWidth: '70%',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  <div className="message-text" style={{ color: '#000000' }}>
                                    {msg.content}
                                  </div>
                                </div>
                                <div className="message-time" style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                  {formatTime(msg.createdAt)}
                                </div>
                              </div>
                              <div className="message-avatar">
                                <span 
                                  className={msg.senderType === 'USER' ? 'user-avatar' : 'support-avatar'}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: msg.senderType === 'USER' ? '#3b82f6' : '#10b981',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {msg.senderType === 'USER' ? 
                                    (user?.username?.charAt(0) || 'U') : 
                                    (selectedSupport.username?.charAt(0) || 'S')
                                  }
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                )}
              </div>

                    {/* 输入区域 */}
                    <div 
                      className="chat-input"
                      style={{
                        padding: '20px',
                        backgroundColor: '#ffffff',
                        borderTop: '1px solid #e5e7eb',
                        borderRadius: '0 0 12px 12px'
                      }}
                    >
                      <div 
                        className="input-container"
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '16px',
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s ease'
                        }}
                      >
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={`向 ${selectedSupport.username} 发送消息...`}
                          rows="1"
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendToSupport();
                    }
                  }}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            resize: 'none',
                            outline: 'none',
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#374151',
                            padding: '8px 0',
                            minHeight: '20px',
                            maxHeight: '80px',
                            fontFamily: 'inherit'
                          }}
                          onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                          }}
                />
                <button 
                          className="send-button"
                  onClick={sendToSupport}
                  disabled={!newMessage.trim() || isLoading}
                          style={{
                            backgroundColor: newMessage.trim() ? '#10b981' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            transform: newMessage.trim() ? 'scale(1)' : 'scale(0.95)',
                            boxShadow: newMessage.trim() ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (newMessage.trim()) {
                              e.target.style.backgroundColor = '#059669';
                              e.target.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (newMessage.trim()) {
                              e.target.style.backgroundColor = '#10b981';
                              e.target.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          {isLoading ? (
                            <div 
                              className="loading-spinner"
                              style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid transparent',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}
                            ></div>
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-selection">
                    <MessageSquare size={64} />
                    <h3>选择客服人员</h3>
                    <p>请从左侧选择一位客服人员开始对话</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 客服工作台 */}
        {activeTab === 'support-desk' && user?.role === 'support' && (
          <div className="tab-content" style={{ height: 'calc(100vh - 200px)' }}>
            <div 
              className="support-desk"
              style={{
                display: 'flex',
                height: '100%',
                gap: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <div 
                className="desk-sidebar"
                style={{
                  width: '300px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>客户列表</h3>
                  <button
                    onClick={loadCustomerChats}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div 
                  className="customer-list"
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}
                >
                  {customerChats.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 20px',
                      color: '#6b7280',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      margin: '20px 0'
                    }}>
                      <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>暂无客户对话</h4>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        等待客户发起对话
                      </p>
                      <button
                        onClick={loadCustomerChats}
                        style={{
                          marginTop: '12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        刷新列表
                      </button>
                    </div>
                  ) : (
                    customerChats.map(chat => (
                      <div 
                        key={chat.id}
                        className={`customer-item ${selectedCustomer?.id === chat.id ? 'selected' : ''}`}
                        onClick={() => setSelectedCustomer(chat)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          marginBottom: '8px',
                          backgroundColor: selectedCustomer?.id === chat.id ? '#e0f2fe' : '#ffffff',
                          border: selectedCustomer?.id === chat.id ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div className="customer-avatar">
                          <UserCircle size={32} style={{ color: '#3b82f6' }} />
                        </div>
                        <div className="customer-info">
                          <div className="customer-name" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {chat.customerName}
                          </div>
                          <div className="last-message" style={{ fontSize: '12px', color: '#6b7280' }}>
                            {chat.lastMessage || '暂无消息'}
                          </div>
                          <div className="message-time" style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {formatTime(chat.updatedAt)}
                          </div>
                        </div>
                        {chat.unreadCount > 0 && (
                          <span 
                            className="unread-badge"
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              borderRadius: '10px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              position: 'absolute',
                              top: '8px',
                              right: '8px'
                            }}
                          >
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div 
                className="desk-main"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {selectedCustomer ? (
                  <>
                    <div 
                      className="chat-header"
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexShrink: 0
                      }}
                    >
                      <UserCircle size={24} style={{ color: '#3b82f6' }} />
                      <span style={{ fontWeight: '600', fontSize: '16px', color: '#374151' }}>
                        与 {selectedCustomer.customerName} 的对话
                      </span>
                    </div>

                    <div 
                      className="chat-messages"
                      style={{
                        flex: 1,
                        padding: '16px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {selectedCustomer.messages?.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`chat-message ${msg.isFromCustomer ? 'customer' : 'support'}`}
                          style={{
                            display: 'flex',
                            justifyContent: msg.isFromCustomer ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end',
                            gap: '8px'
                          }}
                        >
                          {/* 客服头像（左侧） */}
                          {!msg.isFromCustomer && (
                            <div 
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}
                            >
                              {user?.username?.charAt(0) || 'S'}
                            </div>
                          )}
                          
                          <div 
                            className="message-bubble"
                            style={{
                              backgroundColor: msg.isFromCustomer ? '#e3f2fd' : '#e8f5e8',
                              color: '#000000',
                              padding: '12px 16px',
                              borderRadius: '18px',
                              maxWidth: '70%',
                              wordBreak: 'break-word',
                              border: msg.isFromCustomer ? '1px solid #2196f3' : '1px solid #4caf50'
                            }}
                          >
                            <div className="message-text" style={{ color: '#000000', fontWeight: '500' }}>
                              {msg.content}
                            </div>
                            <div 
                              className="message-timestamp"
                              style={{ 
                                fontSize: '11px', 
                                color: '#666666', 
                                marginTop: '4px'
                              }}
                            >
                              {formatTime(msg.createdAt)}
                            </div>
                          </div>
                          
                          {/* 客户头像（右侧） */}
                          {msg.isFromCustomer && (
                            <div 
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}
                            >
                              {selectedCustomer.customerName?.charAt(0) || 'C'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div 
                      className="chat-input-section"
                      style={{
                        padding: '16px 20px',
                        backgroundColor: '#ffffff',
                        borderTop: '1px solid #e5e7eb',
                        flexShrink: 0
                      }}
                    >
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '16px',
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s ease',
                          maxWidth: '100%'
                        }}
                      >
                        <textarea
                          className="chat-input"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="回复客户..."
                          rows="1"
                          disabled={isLoading}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              replyToCustomer();
                            }
                          }}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            resize: 'none',
                            outline: 'none',
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#374151',
                            padding: '8px 0',
                            minHeight: '20px',
                            maxHeight: '80px',
                            fontFamily: 'inherit'
                          }}
                          onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                          }}
                        />
                        <button 
                          className="send-btn"
                          onClick={replyToCustomer}
                          disabled={!newMessage.trim() || isLoading}
                          style={{
                            backgroundColor: newMessage.trim() ? '#10b981' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            transform: newMessage.trim() ? 'scale(1)' : 'scale(0.95)',
                            boxShadow: newMessage.trim() ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (newMessage.trim()) {
                              e.target.style.backgroundColor = '#059669';
                              e.target.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (newMessage.trim()) {
                              e.target.style.backgroundColor = '#10b981';
                              e.target.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          {isLoading ? (
                            <div 
                              className="loading-spinner"
                              style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid transparent',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}
                            ></div>
                          ) : (
                  <Send size={18} />
                          )}
                </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div 
                    className="empty-state"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      textAlign: 'center',
                      color: '#6b7280',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      margin: '20px',
                      padding: '60px 40px'
                    }}
                  >
                    <Users size={64} style={{ marginBottom: '24px', opacity: 0.4 }} />
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#374151' }}>选择客户开始对话</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>
                      从左侧客户列表中选择一个客户来查看对话历史或发送消息
                    </p>
                    {customerChats.length === 0 && (
                      <div style={{ 
                        backgroundColor: '#e0f2fe', 
                        border: '1px solid #0ea5e9',
                        borderRadius: '8px',
                        padding: '16px',
                        marginTop: '20px'
                      }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#0369a1' }}>
                          💡 提示：目前没有客户对话记录。当用户通过客服对话功能联系时，会在左侧列表中显示。
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;