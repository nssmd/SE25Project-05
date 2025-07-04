import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Image, 
  FileText, 
  Video, 
  Box, 
  Brain, 
  History, 
  Settings, 
  LogOut, 
  Plus,
  Send,
  Upload,
  Cpu,
  Cloud,
  Search,
  Database,
  Shield,
  User,
  Crown,
  Trash2,
  Star,
  Lock,
  MoreVertical,
  Mail,
  Bell,
  Menu
} from 'lucide-react';
import { chatAPI } from '../services/api';
import ThemeToggle from './ThemeToggle';
import './Dashboard.css';
import UserCorner from "./UserCorner";

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('text_to_text');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, chatId: null });
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = React.useRef(null);

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const aiModels = [
    { id: 'gpt-4', name: 'GPT-4', type: 'cloud', description: '最强大的语言模型' },
    { id: 'claude-3', name: 'Claude-3', type: 'cloud', description: '优秀的对话模型' },
    { id: 'custom-model-1', name: '自定义模型 1', type: 'local', description: '本地部署的专用模型' },
    { id: 'custom-model-2', name: '自定义模型 2', type: 'local', description: '微调后的图像模型' },
  ];

  const features = [
    { id: 'text_to_text', name: '文生文', icon: MessageSquare, description: '文本对话生成' },
    { id: 'text_to_image', name: '文生图', icon: Image, description: '根据文本生成图像' },
    { id: 'image_to_image', name: '图生图', icon: Image, description: '图像风格转换' },
    { id: 'image_to_text', name: '图生文', icon: FileText, description: '图像内容描述' },
    { id: 'text_to_video', name: '文生视频', icon: Video, description: '文本生成视频' },
    { id: 'text_to_3d', name: '文生3D', icon: Box, description: '文本生成3D模型' },
  ];

  useEffect(() => {
    // 组件加载时获取对话列表
    loadChatList();
    
    // 检查是否从历史搜索页面传入了chatId
    if (location.state?.chatId && location.state?.activeFeature === 'chat') {
      setActiveTab('text_to_text'); // 设置为聊天功能
      // 等待对话列表加载完成后再设置当前对话
      setTimeout(() => {
        const targetChat = chatList.find(chat => chat.id === location.state.chatId);
        if (targetChat) {
          switchChat(targetChat);
        }
      }, 500);
    }
  }, []);

  // 监听chatList变化，处理从历史搜索页面传入的chatId
  useEffect(() => {
    if (location.state?.chatId && chatList.length > 0) {
      const targetChat = chatList.find(chat => chat.id === location.state.chatId);
      if (targetChat && !currentChat) {
        switchChat(targetChat);
        // 清除location state避免重复处理
        navigate(location.pathname, { replace: true });
      }
    }
  }, [chatList, location.state]);

  // 加载对话列表
  const loadChatList = async () => {
    setIsLoadingChats(true);
    try {
      const response = await fetch('http://localhost:8080/api/history/chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('获取到的对话列表:', data);
        setChatList(data.chats || []);
      } else {
        console.error('获取对话列表失败，状态码:', response.status);
      }
    } catch (error) {
      console.error('加载对话列表失败:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // 创建新对话
  const createNewChat = async () => {
    try {
      const newChat = {
        id: null,
        title: '新对话',
        aiType: activeTab,
        messageCount: 0,
        lastActivity: new Date()
      };
      
      setCurrentChat(newChat);
      setChatHistory([]);
      
      // 重新加载对话列表
      await loadChatList();
    } catch (error) {
      console.error('创建新对话失败:', error);
    }
  };

  // 切换对话
  const switchChat = async (chat) => {
    if (currentChat?.id === chat.id) return;
    
    try {
      setCurrentChat(chat);
      setChatHistory([]);
      setIsLoading(true);
      
      // 获取对话的消息历史
      if (chat.id) {
        const response = await fetch(`http://localhost:8080/api/history/chats/${chat.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('获取到的对话消息:', data);
          setChatHistory(data.messages || []);
        } else {
          console.error('获取对话消息失败，状态码:', response.status);
        }
      }
    } catch (error) {
      console.error('切换对话失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除对话
  const deleteChat = async (chatId) => {
    if (!window.confirm('确定要删除这个对话吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      const response = await chatAPI.delete(chatId);
      if (response.success) {
        // 如果删除的是当前对话，切换到新对话
        if (currentChat?.id === chatId) {
          setCurrentChat(null);
          setChatHistory([]);
        }
        
        // 重新加载对话列表
        await loadChatList();
      }
    } catch (error) {
      console.error('删除对话失败:', error);
    }
  };

  // 切换收藏状态
  const toggleFavorite = async (chatId) => {
    try {
      await chatAPI.toggleFavorite(chatId);
      
      // 重新加载对话列表以更新状态
      await loadChatList();
      
      // 如果是当前聊天，也更新当前聊天状态
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => ({
          ...prev,
          isFavorite: !prev.isFavorite
        }));
      }
      
      // 关闭上下文菜单
      setContextMenu({ show: false, x: 0, y: 0, chatId: null });
    } catch (error) {
      console.error('切换收藏失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 切换保护状态
  const toggleProtection = async (chatId) => {
    try {
      await chatAPI.toggleProtection(chatId);
      
      // 重新加载对话列表以更新状态
      await loadChatList();
      
      // 如果是当前聊天，也更新当前聊天状态
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => ({
          ...prev,
          isProtected: !prev.isProtected
        }));
      }
      
      // 关闭上下文菜单
      setContextMenu({ show: false, x: 0, y: 0, chatId: null });
    } catch (error) {
      console.error('切换保护失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 显示右键菜单
  const showContextMenu = (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      chatId: chatId
    });
  };

  // 关闭右键菜单
  const hideContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, chatId: null });
  };

  // 点击页面其他地方关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        hideContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    
    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}小时前`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    
    try {
      // 如果没有当前对话，先创建一个
      let chatId = currentChat?.id;
      if (!chatId) {
        const createResponse = await chatAPI.create({
          title: inputText.substring(0, 50) + (inputText.length > 50 ? '...' : ''),
          aiType: activeTab
        });
        chatId = createResponse.chat.id;
        setCurrentChat(createResponse.chat);
        // 重新加载对话列表
        await loadChatList();
      }
      
      // 添加用户消息到界面
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: inputText,
        createdAt: new Date()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      // 发送消息到后端
      const response = await chatAPI.sendMessage(chatId, {
        content: inputText,
        role: 'user'
      });
      
      // 添加AI响应到界面
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response,
        createdAt: new Date()
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
      
      // 更新对话列表中的最后活动时间
      await loadChatList();
      
    } catch (error) {
      console.error('发送消息失败:', error);
      // 显示错误消息
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '抱歉，发送消息时出现错误，请稍后重试。',
        createdAt: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputText('');
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const renderFeatureContent = () => {
    const currentFeature = features.find(f => f.id === activeTab);
    
    return (
      <div className="feature-content">
        <div className="feature-header">
          <div className="feature-title">
            <currentFeature.icon className="feature-icon" />
            <div>
              <h2>{currentFeature.name}</h2>
              <p>{currentFeature.description}</p>
            </div>
          </div>
          
          <div className="model-selector">
            <label>选择模型:</label>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-select"
            >
              {aiModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.type === 'cloud' ? '云端' : '本地'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeTab === 'text_to_text' && (
          <div className="chat-layout">
            {/* 对话列表侧边栏 */}
            <div className={`chat-list-sidebar ${showChatList ? 'visible' : 'hidden'}`}>
              <div className="chat-list-header">
                <h3>对话历史</h3>
                <div className="chat-list-actions">
                  <button 
                    className="new-chat-btn"
                    onClick={createNewChat}
                    title="新建对话"
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    className="hide-sidebar-btn"
                    onClick={() => setShowChatList(false)}
                    title="隐藏侧边栏"
                  >
                    <History size={16} />
                  </button>
                </div>
              </div>
                
              <div className="chat-list">
                {isLoadingChats ? (
                  <div className="loading-chats">加载中...</div>
                ) : chatList.length === 0 ? (
                  <div className="empty-chats">
                    <MessageSquare size={24} />
                    <p>还没有对话记录</p>
                    <button onClick={createNewChat} className="start-chat-btn">
                      开始对话
                    </button>
                  </div>
                ) : (
                  chatList.map(chat => (
                    <div 
                      key={chat.id}
                      className={`chat-item ${currentChat?.id === chat.id ? 'active' : ''}`}
                      onClick={() => switchChat(chat)}
                      onContextMenu={(e) => showContextMenu(e, chat.id)}
                    >
                      <div className="chat-item-content">
                        <div className="chat-title">
                          {chat.title || '新对话'}
                        </div>
                        <div className="chat-meta">
                          <span className="message-count">
                            {chat.messageCount || 0} 条消息
                          </span>
                          <span className="last-activity">
                            {formatTime(chat.lastActivity)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="chat-actions">
                        {chat.isFavorite && <Star size={12} className="favorite-icon" />}
                        {chat.isProtected && <Lock size={12} className="protected-icon" />}
                        <button 
                          className="more-actions-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            showContextMenu(e, chat.id);
                          }}
                          title="更多操作"
                        >
                          <MoreVertical size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* 对话区域 */}
            <div className="chat-container">
              <div className="chat-header">
                <div className="chat-header-left">
                  <button 
                    className={`toggle-chat-list ${!showChatList ? 'prominent' : ''}`}
                    onClick={() => setShowChatList(!showChatList)}
                    title={showChatList ? '隐藏对话列表' : '显示对话列表'}
                  >
                    <History size={16} />
                    {!showChatList && <span className="toggle-text">显示历史</span>}
                  </button>
                  {!showHeader && (
                    <button 
                      className="toggle-header-btn prominent"
                      onClick={() => setShowHeader(true)}
                      title="显示顶部栏"
                    >
                      <Settings size={16} />
                      <span className="toggle-text">显示顶栏</span>
                    </button>
                  )}
                </div>
                <div className="current-chat-info">
                  <h4>{currentChat?.title || '新对话'}</h4>
                  {currentChat?.messageCount > 0 && (
                    <span className="chat-message-count">
                      {currentChat.messageCount} 条消息
                    </span>
                  )}
                </div>
              </div>
              
              <div className="chat-messages">
                {chatHistory.length === 0 && !isLoading && (
                  <div className="empty-chat">
                    <MessageSquare size={48} />
                    <h3>开始新的对话</h3>
                    <p>在下方输入框中输入您的问题，开始与AI对话</p>
                  </div>
                )}
                
                {chatHistory.map(message => (
                  <div key={message.id} className={`message ${message.role}`}>
                    <div className="message-content">
                      {message.content}
                    </div>
                    <div className="message-meta">
                      <span className="timestamp">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="message assistant loading">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                
                {/* 用于滚动到底部的隐藏元素 */}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="输入您的问题..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputText.trim()}
                  className="send-button"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'text_to_text' && (
          <div className="feature-placeholder">
            <div className="placeholder-content">
              <Upload size={48} />
              <h3>功能正在开发中</h3>
              <p>
                {activeTab === 'text_to_image' && '文本生成图像功能即将上线'}
                {activeTab === 'image_to_image' && '图像风格转换功能即将上线'}
                {activeTab === 'image_to_text' && '图像内容识别功能即将上线'}
                {activeTab === 'text_to_video' && '文本生成视频功能即将上线'}
                {activeTab === 'text_to_3d' && '文本生成3D模型功能即将上线'}
              </p>
              <p>敬请期待！</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* 移动端侧边栏遮罩 */}
      {showSidebar && (
        <div 
          className="sidebar-overlay"
          onClick={() => setShowSidebar(false)}
        />
      )}
      {/* 右键上下文菜单 */}
      {contextMenu.show && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
        >
          <div className="context-menu-item" onClick={() => toggleFavorite(contextMenu.chatId)}>
            <Star size={14} />
            <span>
              {chatList.find(chat => chat.id === contextMenu.chatId)?.isFavorite ? '取消收藏' : '添加收藏'}
            </span>
          </div>
          <div className="context-menu-item" onClick={() => toggleProtection(contextMenu.chatId)}>
            <Lock size={14} />
            <span>
              {chatList.find(chat => chat.id === contextMenu.chatId)?.isProtected ? '取消保护' : '设为保护'}
            </span>
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item delete" onClick={() => {
            hideContextMenu();
            deleteChat(contextMenu.chatId);
          }}>
            <Trash2 size={14} />
            <span>删除对话</span>
          </div>
        </div>
      )}
      <aside className={`sidebar ${showSidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Brain className="logo-icon" />
            <span>AI平台</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3>AI功能</h3>
            {features.map(feature => (
              <button
                key={feature.id}
                className={`nav-item ${activeTab === feature.id ? 'active' : ''}`}
                onClick={() => setActiveTab(feature.id)}
              >
                <feature.icon className="nav-icon" />
                <span>{feature.name}</span>
              </button>
            ))}
          </div>

          <div className="nav-section">
            <h3>工具</h3>
            <button 
              className="nav-item"
              onClick={() => navigate('/finetuning')}
            >
              <Cpu className="nav-icon" />
              <span>数据微调</span>
            </button>
            <button 
              className="nav-item"
              onClick={() => navigate('/history')}
            >
              <Search className="nav-icon" />
              <span>历史搜索</span>
            </button>
            <button 
              className="nav-item"
              onClick={() => navigate('/data-management')}
            >
              <Database className="nav-icon" />
              <span>数据管理</span>
            </button>
            <button 
              className="nav-item"
              onClick={() => navigate('/profile')}
            >
              <User className="nav-icon" />
              <span>个人中心</span>
            </button>
            <button 
              className="nav-item"
              onClick={() => navigate('/messages')}
            >
              <Mail className="nav-icon" />
              <span>消息中心</span>
            </button>
            {/* 管理员专用功能 */}
            {user?.role === 'admin' && (
              <button 
                className="nav-item admin-only"
                onClick={() => navigate('/admin')}
              >
                <Crown className="nav-icon" />
                <span>管理员面板</span>
              </button>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <LogOut className="nav-icon" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className={`main-header ${showHeader ? 'visible' : 'hidden'}`}>
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu size={20} />
            </button>
            <h1>AI工作台</h1>
            <p>选择下方功能开始您的AI之旅</p>
          </div>
          <div className="header-right">
            <div className="model-status">
              <div className="status-item">
                <Cloud size={16} />
                <span>云端模型: 4个</span>
              </div>
              <div className="status-item">
                <Cpu size={16} />
                <span>本地模型: 2个</span>
              </div>
            </div>
            <ThemeToggle variant="button" />
            <button 
              className="hide-header-btn"
              onClick={() => setShowHeader(false)}
              title="隐藏顶部栏"
            >
              <Settings size={16} />
            </button>
          </div>
          <UserCorner user={user} onLogout={onLogout} />
        </header>

        <div className="content-area">
          {renderFeatureContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 