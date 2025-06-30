import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Mail, 
  Clock, 
  Bot, 
  User,
  Minimize2,
  Maximize2,
  HelpCircle,
  Search,
  Trash2,
  Copy,
  MoreHorizontal
} from 'lucide-react';
import './CustomerService.css';

const CustomerService = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '您好！我是AI智能客服，很高兴为您服务。请问有什么可以帮助您的吗？',
      timestamp: new Date(),
    }
  ]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const messagesEndRef = useRef(null);

  const faqs = [
    {
      id: 1,
      category: '账户相关',
      question: '如何注册账户？',
      answer: '点击注册按钮，填写邮箱和密码即可完成注册。注册后会收到验证邮件，请及时验证。'
    },
    {
      id: 2,
      category: '账户相关',
      question: '忘记密码怎么办？',
      answer: '在登录页面点击"忘记密码"，输入注册邮箱，系统会发送重置密码的链接到您的邮箱。'
    },
    {
      id: 3,
      category: '使用相关',
      question: '如何使用AI对话功能？',
      answer: '登录后进入主界面，选择"文生文"功能，在输入框中输入您的问题，点击发送即可开始对话。'
    },
    {
      id: 4,
      category: '使用相关',
      question: '支持哪些AI模型？',
      answer: '我们支持GPT-4、Claude-3等主流AI模型，同时支持用户上传自定义模型进行微调。'
    },
    {
      id: 5,
      category: '数据微调',
      question: '如何上传训练数据？',
      answer: '进入"数据微调"页面，点击上传区域，选择JSON格式的训练数据文件。文件格式要求包含input和output字段。'
    },
    {
      id: 6,
      category: '数据微调',
      question: '训练需要多长时间？',
      answer: '训练时间取决于数据量和模型复杂度，一般在30分钟到几小时不等。您可以在训练管理页面查看进度。'
    },
    {
      id: 7,
      category: '计费相关',
      question: '如何查看使用量？',
      answer: '在个人中心的"账单管理"页面可以查看详细的使用量统计和费用明细。'
    },
    {
      id: 8,
      category: '计费相关',
      question: '支持哪些支付方式？',
      answer: '支持微信支付、支付宝、银行卡等多种支付方式。'
    }
  ];

  const quickReplies = [
    '如何开始使用？',
    '价格是多少？',
    '支持的文件格式',
    '如何联系技术支持？'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, newMessage]);
    setMessage('');

    // 模拟AI回复
    setTimeout(() => {
      const botReply = {
        id: Date.now() + 1,
        type: 'bot',
        content: getBotReply(message),
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, botReply]);
    }, 1000);
  };

  const getBotReply = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('价格') || lowerMessage.includes('费用')) {
      return '我们提供多种套餐选择：基础版免费，专业版99元/月，企业版199元/月。每个套餐都有不同的功能和使用量限制。您可以在个人中心查看详细信息。';
    } else if (lowerMessage.includes('注册') || lowerMessage.includes('账户')) {
      return '注册很简单！点击"注册"按钮，填写邮箱和密码即可。如果遇到问题，请检查邮箱格式是否正确，密码是否至少6位。';
    } else if (lowerMessage.includes('微调') || lowerMessage.includes('训练')) {
      return '数据微调功能允许您上传自己的数据来训练专属AI模型。支持JSON格式，请确保数据包含input和output字段。训练完成后可以在主界面使用您的自定义模型。';
    } else if (lowerMessage.includes('联系') || lowerMessage.includes('技术支持')) {
      return '您可以通过以下方式联系我们：\n📧 邮箱：support@aiplatform.com\n📞 电话：400-123-4567\n🕒 服务时间：工作日 9:00-18:00';
    } else {
      return '感谢您的咨询！如果我的回答没有解决您的问题，您可以查看常见问题或联系人工客服。我们会尽快为您提供帮助。';
    }
  };

  const handleQuickReply = (reply) => {
    setMessage(reply);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const deleteMessage = (messageId) => {
    if (window.confirm('确定要删除这条消息吗？')) {
      setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
      showNotification('消息已删除');
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      showNotification('消息已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
      showNotification('复制失败，请重试');
    });
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqCategories = [...new Set(faqs.map(faq => faq.category))];

  if (!isOpen) return null;

  return (
    <div className={`customer-service ${isMinimized ? 'minimized' : ''}`}>
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
      <div className="cs-header">
        <div className="cs-title">
          <MessageCircle size={20} />
          <span>在线客服</span>
        </div>
        <div className="cs-controls">
          <button 
            className="cs-btn"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button className="cs-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="cs-content">
          <div className="cs-tabs">
            <button 
              className={`cs-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              在线咨询
            </button>
            <button 
              className={`cs-tab ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              常见问题
            </button>
            <button 
              className={`cs-tab ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              联系我们
            </button>
          </div>

          <div className="cs-body">
            {activeTab === 'chat' && (
              <div className="chat-section">
                <div className="chat-messages">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`chat-message ${msg.type}`}>
                      <div className="message-avatar">
                        {msg.type === 'bot' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className="message-content">
                        <div className="message-text">{msg.content}</div>
                        <div className="message-time">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="message-actions">
                          <button 
                            className="action-btn copy"
                            onClick={() => copyMessage(msg.content)}
                            title="复制消息"
                          >
                            <Copy size={12} />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => deleteMessage(msg.id)}
                            title="删除消息"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="quick-replies">
                  {quickReplies.map((reply, index) => (
                    <button 
                      key={index}
                      className="quick-reply-btn"
                      onClick={() => handleQuickReply(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                <div className="chat-input">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="输入您的问题..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={handleSendMessage} className="send-btn">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="faq-section">
                <div className="faq-search">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="搜索问题..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="faq-categories">
                  {faqCategories.map(category => (
                    <div key={category} className="faq-category">
                      <h4>{category}</h4>
                      {filteredFaqs
                        .filter(faq => faq.category === category)
                        .map(faq => (
                          <details key={faq.id} className="faq-item">
                            <summary>
                              <HelpCircle size={16} />
                              {faq.question}
                            </summary>
                            <div className="faq-answer">
                              {faq.answer}
                            </div>
                          </details>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="contact-section">
                <div className="contact-info">
                  <div className="contact-item">
                    <Mail size={20} />
                    <div>
                      <h4>邮箱支持</h4>
                      <p>support@aiplatform.com</p>
                      <span>24小时内回复</span>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <Phone size={20} />
                    <div>
                      <h4>电话支持</h4>
                      <p>400-123-4567</p>
                      <span>工作日 9:00-18:00</span>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <Clock size={20} />
                    <div>
                      <h4>服务时间</h4>
                      <p>在线客服：24/7</p>
                      <span>人工客服：工作日 9:00-18:00</span>
                    </div>
                  </div>
                </div>

                <div className="contact-form">
                  <h4>留言板</h4>
                  <form>
                    <div className="form-group">
                      <label>主题</label>
                      <select>
                        <option>技术问题</option>
                        <option>账单问题</option>
                        <option>功能建议</option>
                        <option>其他</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>详细描述</label>
                      <textarea 
                        rows={4} 
                        placeholder="请详细描述您遇到的问题..."
                      />
                    </div>
                    <button type="submit" className="submit-btn">
                      提交留言
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerService; 