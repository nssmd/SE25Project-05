import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Settings,
  Cpu,
  Cloud,
  Trash2,
  Star,
  Lock,
  Menu
} from 'lucide-react';
import { chatAPI } from '../services/api';
import ThemeToggle from './ThemeToggle';
import './Dashboard.css';
import UserCorner from "./UserCorner";

import { useParams } from 'react-router-dom';

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

  const { featureId } = useParams();

  useEffect(() => {
    if (!featureId) {
      navigate('text_to_text');
      setActiveTab('text_to_text');
    } else {
      setActiveTab(featureId);
    }

    // console.log(location.pathname);
  },[featureId]);

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // 监听窗口大小变化，在桌面端自动显示历史记录列表
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        // 桌面端自动显示历史记录列表
        setShowChatList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      
      // 在移动端创建新对话后自动隐藏历史记录列表
      if (window.innerWidth <= 768) {
        setShowChatList(false);
      }

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
      
      // 在移动端切换对话后自动隐藏历史记录列表
      if (window.innerWidth <= 768) {
        setShowChatList(false);
      }

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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    
    // 在移动端发送消息时自动隐藏历史记录列表，专注于对话
    if (window.innerWidth <= 768) {
      setShowChatList(false);
    }

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

  const contextSet = {
    activeTab: activeTab,
    selectedModel: selectedModel,
    setSelectedModel: setSelectedModel,
    inputText: inputText,
    setInputText: setInputText,
    chatHistory: chatHistory,
    isLoading: isLoading,
    currentChat: currentChat,
    chatList: chatList,
    isLoadingChats: isLoadingChats,
    showChatList: showChatList,
    setShowChatList: setShowChatList,
    showHeader: showHeader,
    setShowHeader: setShowHeader,
    messagesEndRef: messagesEndRef,
    createNewChat: createNewChat,
    showContextMenu: showContextMenu,
    switchChat: switchChat,
    handleSendMessage: handleSendMessage,
  }

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
              <div className="status-item" data-count="4">
                <Cloud size={14} />
                <span>云端模型</span>
              </div>
              <div className="status-item" data-count="2">
                <Cpu size={14} />
                <span>本地模型</span>
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
          <Outlet context={contextSet} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 