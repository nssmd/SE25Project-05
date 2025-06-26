import React, { useState } from 'react';
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
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text-to-text');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const aiModels = [
    { id: 'gpt-4', name: 'GPT-4', type: 'cloud', description: '最强大的语言模型' },
    { id: 'claude-3', name: 'Claude-3', type: 'cloud', description: '优秀的对话模型' },
    { id: 'custom-model-1', name: '自定义模型 1', type: 'local', description: '本地部署的专用模型' },
    { id: 'custom-model-2', name: '自定义模型 2', type: 'local', description: '微调后的图像模型' },
  ];

  const features = [
    { id: 'text-to-text', name: '文生文', icon: MessageSquare, description: '文本对话生成' },
    { id: 'text-to-image', name: '文生图', icon: Image, description: '根据文本生成图像' },
    { id: 'image-to-image', name: '图生图', icon: Image, description: '图像风格转换' },
    { id: 'image-to-text', name: '图生文', icon: FileText, description: '图像内容描述' },
    { id: 'text-to-video', name: '文生视频', icon: Video, description: '文本生成视频' },
    { id: 'text-to-3d', name: '文生3D', icon: Box, description: '文本生成3D模型' },
  ];

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setChatHistory(prev => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 模拟AI响应
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: `这是${aiModels.find(m => m.id === selectedModel)?.name}的响应：${inputText}`,
        timestamp: new Date(),
        model: selectedModel,
      };

      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
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

        {activeTab === 'text-to-text' && (
          <div className="chat-container">
            <div className="chat-messages">
              {chatHistory.map(message => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-meta">
                    {message.type === 'ai' && <span className="model-tag">{message.model}</span>}
                    <span className="timestamp">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message ai loading">
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

        {activeTab !== 'text-to-text' && (
          <div className="feature-placeholder">
            <div className="placeholder-content">
              <Upload size={48} />
              <h3>功能开发中</h3>
              <p>
                {activeTab === 'text-to-image' && '上传图片或输入文本描述来生成图像'}
                {activeTab === 'image-to-image' && '上传图片进行风格转换'}
                {activeTab === 'image-to-text' && '上传图片获取内容描述'}
                {activeTab === 'text-to-video' && '输入文本描述生成视频'}
                {activeTab === 'text-to-3d' && '输入文本描述生成3D模型'}
              </p>
              <button className="upload-button">
                <Upload size={20} />
                上传文件
              </button>
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
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
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