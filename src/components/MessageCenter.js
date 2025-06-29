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
  Mail
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

  useEffect(() => {
    loadMessages();
    loadSupportChat();
  }, []);

  // 加载接收到的消息
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getMessages();
      console.log('加载的消息数据:', response);
      
      // 处理分页响应
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

  // 加载客服对话
  const loadSupportChat = async () => {
    try {
      const response = await userAPI.getSupportChat();
      console.log('客服对话数据:', response);
      setSupportChat(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('加载客服对话失败:', error);
      setSupportChat([]);
    }
  };

  // 发送消息给客服
  const sendToSupport = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsLoading(true);
      
      await userAPI.sendToSupport({
        content: newMessage
      });

      // 添加到本地对话记录
      const newChatMessage = {
        id: Date.now(),
        messageType: 'SUPPORT',
        content: newMessage,
        createdAt: new Date().toISOString(),
        fromUserId: user.id,
        isRead: true
      };

      setSupportChat(prev => [...prev, newChatMessage]);
      setNewMessage('');
      
      // 重新加载客服对话以获取最新数据
      setTimeout(loadSupportChat, 1000);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败: ' + error.message);
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
      await userAPI.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      alert('删除消息失败');
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 获取未读消息数量
  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className="message-center">
      <div className="message-center-header">
        <div className="header-left">
          <h1>消息中心</h1>
          <p>查看系统消息和客服对话</p>
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
            系统消息
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <MessageSquare size={20} />
            客服对话
          </button>
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
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message-item ${!message.isRead ? 'unread' : ''}`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.isRead) {
                        markAsRead(message.id);
                      }
                    }}
                  >
                    <div className="message-header">
                      <h4 className="message-title">
                        {message.subject || '系统通知'}
                      </h4>
                      <div className="message-meta">
                        <span className="message-time">
                          {formatTime(message.createdAt)}
                        </span>
                        <span className={`message-status ${message.isRead ? 'read' : 'unread'}`}>
                          {message.isRead ? '已读' : '未读'}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(message.id);
                          }}
                        >
                          <CheckCircle size={14} />
                          标记已读
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(message.id);
                        }}
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 客服对话 */}
        {activeTab === 'support' && (
          <div className="tab-content">
            <div className="chat-section">
              <div className="chat-messages">
                {supportChat.length === 0 ? (
                  <div className="empty-state">
                    <MessageSquare size={48} />
                    <h3>开始与客服对话</h3>
                    <p>有任何问题，随时联系我们的客服团队</p>
                  </div>
                ) : (
                  supportChat.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`chat-message ${msg.fromUserId === user.id ? 'user' : 'support'}`}
                    >
                      <div className={`message-avatar ${msg.fromUserId === user.id ? 'user' : 'support'}`}>
                        {msg.fromUserId === user.id ? 
                          (user?.username?.charAt(0) || 'U') : 
                          'S'
                        }
                      </div>
                      <div className="message-bubble">
                        <div className="message-text">{msg.content}</div>
                        <div className="message-timestamp">
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="chat-input-section">
                <textarea
                  className="chat-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="输入您的问题或建议..."
                  rows="3"
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendToSupport();
                    }
                  }}
                />
                <button 
                  className="send-btn"
                  onClick={sendToSupport}
                  disabled={!newMessage.trim() || isLoading}
                >
                  <Send size={18} />
                  {isLoading ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;