import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, MessageSquare, Filter, X, ArrowLeft } from 'lucide-react';
import { historyAPI } from '../services/api';
import './HistorySearch.css';

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
      const response = await historyAPI.getChats({
        keyword: query,
        timeFilter: currentFilters.dateRange,
        aiType: currentFilters.aiType,
        isFavorite: currentFilters.isBookmarked,
        page: 1,
        limit: 20
      });
      
      setSearchResults(response.chats);
    } catch (error) {
      console.error('搜索历史记录失败:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

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
    return names[type] || '未知';
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
        <div className="user-info">
          <span>{user?.username || user?.name}</span>
          <button onClick={onLogout} className="logout-btn">退出</button>
        </div>
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
              <option value="image-to-image">图生图</option>
              <option value="image-to-text">图生文</option>
              <option value="text-to-video">文生视频</option>
              <option value="text-to-3d">文生3D</option>
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
                        {formatDate(item.date)}
                      </span>
                      <span className="result-time">
                        <Clock size={14} />
                        {item.time}
                      </span>
                    </div>
                    {item.isBookmarked && (
                      <span className="bookmark-indicator">⭐</span>
                    )}
                  </div>
                  
                  <h3 className="result-title">{item.title}</h3>
                  <p className="result-preview">{item.preview}</p>
                  
                  <div className="result-footer">
                    <span className="message-count">
                      <MessageSquare size={14} />
                      {item.messageCount} 条消息
                    </span>
                    <div className="result-actions">
                      <button className="action-btn">查看</button>
                      <button className="action-btn secondary">继续对话</button>
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