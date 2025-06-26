import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, MessageSquare, Filter, X } from 'lucide-react';
import './HistorySearch.css';

const HistorySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    aiType: 'all',
    isBookmarked: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // 模拟历史对话数据
  const mockHistory = [
    {
      id: '1',
      title: '如何优化React性能',
      preview: '我想了解React应用的性能优化方法...',
      aiType: 'text-to-text',
      date: '2024-01-20',
      time: '14:30',
      messageCount: 12,
      isBookmarked: true
    },
    {
      id: '2',
      title: '生成AI头像',
      preview: '帮我生成一个专业的商务头像...',
      aiType: 'text-to-image',
      date: '2024-01-19',
      time: '09:15',
      messageCount: 8,
      isBookmarked: false
    },
    {
      id: '3',
      title: '数据分析代码',
      preview: '写一个Python数据分析脚本...',
      aiType: 'text-to-text',
      date: '2024-01-18',
      time: '16:45',
      messageCount: 15,
      isBookmarked: true
    },
    {
      id: '4',
      title: '图像风格转换',
      preview: '把这张照片转换成油画风格...',
      aiType: 'image-to-image',
      date: '2024-01-17',
      time: '11:20',
      messageCount: 6,
      isBookmarked: false
    },
    {
      id: '5',
      title: '视频脚本创作',
      preview: '帮我写一个科技产品介绍视频的脚本...',
      aiType: 'text-to-video',
      date: '2024-01-16',
      time: '13:10',
      messageCount: 20,
      isBookmarked: true
    }
  ];

  // 搜索功能
  const handleSearch = (query, currentFilters = filters) => {
    setIsLoading(true);
    
    // 模拟API调用延迟
    setTimeout(() => {
      let results = mockHistory;

      // 关键字搜索
      if (query.trim()) {
        results = results.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.preview.toLowerCase().includes(query.toLowerCase())
        );
      }

      // 日期过滤
      if (currentFilters.dateRange !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        
        switch (currentFilters.dateRange) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
          default:
            break;
        }
        
        results = results.filter(item => new Date(item.date) >= filterDate);
      }

      // AI类型过滤
      if (currentFilters.aiType !== 'all') {
        results = results.filter(item => item.aiType === currentFilters.aiType);
      }

      // 书签过滤
      if (currentFilters.isBookmarked) {
        results = results.filter(item => item.isBookmarked);
      }

      setSearchResults(results);
      setIsLoading(false);
    }, 300);
  };

  // 搜索输入变化
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, filters]);

  // 获取AI类型图标
  const getAiTypeIcon = (type) => {
    const icons = {
      'text-to-text': '💬',
      'text-to-image': '🎨',
      'image-to-image': '🖼️',
      'image-to-text': '📝',
      'text-to-video': '🎥',
      'text-to-3d': '🎲'
    };
    return icons[type] || '💬';
  };

  // 获取AI类型名称
  const getAiTypeName = (type) => {
    const names = {
      'text-to-text': '文生文',
      'text-to-image': '文生图',
      'image-to-image': '图生图',
      'image-to-text': '图生文',
      'text-to-video': '文生视频',
      'text-to-3d': '文生3D'
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
      <div className="search-header">
        <h2>历史记录搜索</h2>
        <p>搜索您的对话历史，快速找到需要的内容</p>
      </div>

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
  );
};

export default HistorySearch; 