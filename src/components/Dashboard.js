import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Crown
} from 'lucide-react';
import { chatAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text_to_text');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);

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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    
    try {
      // 如果没有当前对话，先创建一个
      let chatId = currentChat?.id;
      if (!chatId) {
        const createResponse = await chatAPI.create({
          title: inputText.substring(0, 50) + '...',
          aiType: activeTab
        });
        chatId = createResponse.chat.id;
        setCurrentChat(createResponse.chat);
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
          <div className="chat-container">
            <div className="chat-messages">
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
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Brain className="logo-icon" />
            <span>AI平台</span>
          </div>
          <div className="user-info">
            <div className="user-avatar">
                              {(user?.username || user?.name)?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.username || user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
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
        <header className="main-header">
          <div className="header-left">
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
          </div>
        </header>

        <div className="content-area">
          {renderFeatureContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 