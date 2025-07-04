import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, MessageSquare, Filter, X, ArrowLeft } from 'lucide-react';
import { historyAPI } from '../services/api';
import './HistorySearch.css';
import UserCorner from "./UserCorner";

const HistorySearch = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    aiType: 'all',
    isBookmarked: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // 移除模拟数据，使用真实API

  // 搜索功能
  const handleSearch = async (query, currentFilters = filters) => {
    setIsLoading(true);
    
    try {
      const params = {
        page: 0, // 后端使用0开始的分页
        size: 20,
        timeFilter: currentFilters.dateRange,
        aiType: currentFilters.aiType,
        isFavorite: currentFilters.isBookmarked
      };
      
      // 只有当查询不为空时才添加keyword参数
      if (query && query.trim()) {
        params.keyword = query.trim();
      }
      
      console.log('搜索参数:', params);
      const response = await historyAPI.getChats(params);
      console.log('搜索结果:', response);
      
      setSearchResults(response.chats || []);
    } catch (error) {
      console.error('搜索历史记录失败:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件加载时获取所有对话
  useEffect(() => {
    handleSearch(''); // 初始加载所有对话
  }, []);

  // 搜索输入变化
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, filters]);

  // 获取AI类型图标
  const getAiTypeIcon = (type) => {
    const icons = {
      'text_to_text': '💬',
      'text_to_image': '🎨',
      'image_to_image': '🖼️',
      'image_to_text': '📝',
      'text_to_video': '🎥',
      'text_to_3d': '🎲'
    };
    return icons[type] || '💬';
  };

  // 获取AI类型名称
  const getAiTypeName = (type) => {
    const names = {
      'text_to_text': '文生文',
      'text_to_image': '文生图',
      'image_to_image': '图生图',
      'image_to_text': '图生文',
      'text_to_video': '文生视频',
      'text_to_3d': '文生3D'
    };
    return names[type] || '文生文';
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 查看对话详情
  const handleViewChat = async (chatId) => {
    try {
      const response = await historyAPI.getChatDetail(chatId);
      console.log('对话详情:', response);
      // 可以在这里显示对话详情模态框
      alert(`查看对话 ${chatId} 的详情功能待实现`);
    } catch (error) {
      console.error('获取对话详情失败:', error);
      alert('获取对话详情失败');
    }
  };

  // 继续对话
  const handleContinueChat = (chatId) => {
    // 跳转到聊天页面，并设置当前对话ID
    navigate('/dashboard', { 
      state: { 
        activeFeature: 'chat',
        chatId: chatId 
      } 
    });
  };

  return (
    <div className="history-search">
      <header className="page-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={20} />
          返回主界面
        </button>
        <div className="header-content">
          <h1>历史记录搜索</h1>
          <p>搜索您的对话历史，快速找到需要的内容</p>
        </div>
        <UserCorner user={user} onLogout={onLogout} />
      </header>
      
      <div className="search-content">

      {/* 搜索栏 */}
      <div className="search-container">
        <div className="search-input-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="搜索对话标题或内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          筛选
        </button>
      </div>

      {/* 过滤器 */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>时间范围</label>
            <select 
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            >
              <option value="all">全部时间</option>
              <option value="today">今天</option>
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
            </select>
          </div>

          <div className="filter-group">
            <label>AI功能</label>
            <select 
              value={filters.aiType}
              onChange={(e) => setFilters({...filters, aiType: e.target.value})}
            >
              <option value="all">全部功能</option>
              <option value="text-to-text">文生文</option>
              <option value="text-to-image">文生图</option>
              <option value="image-to-text">图生文</option>
              <option value="image-to-image">图生图</option>
              <option value="text-to-3d">文生3D</option>
              <option value="text-to-video">文生视频</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.isBookmarked}
                onChange={(e) => setFilters({...filters, isBookmarked: e.target.checked})}
              />
              <span>仅显示收藏</span>
            </label>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      <div className="search-results">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>搜索中...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="results-header">
              <span>找到 {searchResults.length} 条结果</span>
            </div>
            <div className="results-list">
              {searchResults.map(item => (
                <div key={item.id} className="result-item">
                  <div className="result-header">
                    <div className="result-info">
                      <span className="ai-type-badge">
                        {getAiTypeIcon(item.aiType)} {getAiTypeName(item.aiType)}
                      </span>
                      <span className="result-date">
                        <Calendar size={14} />
                        {formatDate(item.lastActivity || item.createdAt)}
                      </span>
                      <span className="result-time">
                        <Clock size={14} />
                        {new Date(item.lastActivity || item.createdAt).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {item.isFavorite && (
                      <span className="bookmark-indicator">⭐</span>
                    )}
                  </div>
                  
                  <h3 className="result-title">{item.title}</h3>
                  <p className="result-preview">
                    {item.description || `创建于 ${formatDate(item.createdAt)}`}
                  </p>
                  
                  <div className="result-footer">
                    <span className="message-count">
                      <MessageSquare size={14} />
                      {item.messageCount || 0} 条消息
                    </span>
                    <div className="result-actions">
                      <button 
                        className="action-btn"
                        onClick={() => handleViewChat(item.id)}
                      >
                        查看
                      </button>
                      <button 
                        className="action-btn secondary"
                        onClick={() => handleContinueChat(item.id)}
                      >
                        继续对话
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-results">
            <Search size={48} />
            <h3>未找到相关记录</h3>
            <p>尝试调整搜索关键词或筛选条件</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default HistorySearch; 