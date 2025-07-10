import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
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
  X,
  Paperclip,
  Download,
  AlertCircle,
  DollarSign,
  ArrowLeft,
  Menu
} from 'lucide-react';
import { chatAPI, aiAPI, fileAPI, promptTemplateAPI } from '../services/api';
import ThemeToggle from './ThemeToggle';
import './Dashboard.css';
import './PromptTemplateLibrary.css';
import UserCorner from "./UserCorner";

import { useParams } from 'react-router-dom';

const Dashboard = ({ user, onLogout, showSidebar, setShowSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('text_to_text');
  const [selectedModel, setSelectedModel] = useState('');
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, chatId: null });
  const [aiStatus, setAiStatus] = useState({ available: false, model: '', service: '检查中...' });
  const [isMobile, setIsMobile] = useState(false);
  
  // 新增状态：模型管理
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelDetails, setModelDetails] = useState({});
  
  // 按功能分类的模型配置
  const [modelsByFeature, setModelsByFeature] = useState({
    text_to_text: [], // 文本对话模型
    smart_image_generation: [], // 图像生成模型
    text_to_3d: [] // 3D生成模型
  });
  
  // 新增状态：文件上传
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  
  // 图片上传拖拽状态
  const [dragOverChat, setDragOverChat] = useState(false);
  
  // 图像生成相关状态
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
  const [imageGenerationSize, setImageGenerationSize] = useState('1024*1024');
  const [imageGenerationStyle, setImageGenerationStyle] = useState('<auto>');
  const [supportedSizes, setSupportedSizes] = useState(['1024*1024', '720*1280', '1280*720']);
  const [supportedStyles, setSupportedStyles] = useState(['<auto>', '<watercolor>', '<flat illustration>', '<anime>', '<photography>', '<chinese painting>', '<digital art>']);

  const [referenceImage, setReferenceImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);

  // AI模板库相关状态
  const [templateCategories, setTemplateCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [featuredTemplates, setFeaturedTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [templateSearchKeyword, setTemplateSearchKeyword] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showTemplateDetail, setShowTemplateDetail] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 创建模板表单状态
  const [createTemplateForm, setCreateTemplateForm] = useState({
    title: '',
    description: '',
    content: '',
    categoryId: '',
    aiModel: ''
  });
  
  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const { featureId } = useParams();

  // 更新特性列表，合并智能对话和智能生图功能
  const features = [
    { id: 'text_to_text', name: '智能对话', icon: MessageSquare, description: '与AI进行智能对话，支持文本和图片输入' },
    { id: 'smart_image_generation', name: '智能生图', icon: Image, description: '智能图像生成 - 支持文生图和图生图', available: true },
    { id: 'prompt_template_library', name: 'AI模板库', icon: Brain, description: 'Prompt模板管理与分享平台', available: true },
    { id: 'text_to_3d', name: '文生3D', icon: Box, description: '文本生成3D模型', available: false },
  ];

  useEffect(() => {
    if (!featureId) {
      navigate('text_to_text');
      setActiveTab('text_to_text');
    } else {
      setActiveTab(featureId);
    }
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
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (!mobile) {
        // 桌面端自动显示历史记录列表
        setShowChatList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 组件加载时获取对话列表和模型列表
    loadChatList();
    loadAvailableModels();
    checkAIStatus();
    loadImageGenerationConfig();
    loadTemplateData();
    
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

  // 当切换功能标签时，处理图片状态和模型选择
  useEffect(() => {
    // 如果不是智能对话功能，清空已上传的图片
    if (activeTab !== 'text_to_text') {
      setUploadedImages([]);
    }
    // 如果不是智能生图功能，清空图像生成相关状态
    if (activeTab !== 'smart_image_generation') {
      setImageGenerationPrompt('');
      setReferenceImage(null);
      setGeneratedImages([]);
    }
    
    // 切换页面时更新模型选择
    updateModelForFeature(activeTab);
  }, [activeTab]);

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

  // 根据功能更新模型选择
  const updateModelForFeature = (featureId) => {
    const currentFeatureModels = modelsByFeature[featureId] || [];
    if (currentFeatureModels.length > 0) {
      // 优先选择免费模型
      const freeModel = currentFeatureModels.find(model => model.free);
      const defaultModel = freeModel || currentFeatureModels[0];
      setSelectedModel(defaultModel.id);
      
      // 更新AI状态显示
      setAiStatus(prev => ({
        ...prev,
        model: defaultModel.name
      }));
    }
  };

  // 新增：加载可用的AI模型并按功能分类
  const loadAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await aiAPI.getModels();
      console.log('获取到的模型API响应:', response);
      
      // 处理后端响应格式，转换为前端需要的格式
      const models = response.models ? response.models.map(model => ({
        id: model.modelId,
        name: model.displayName,
        description: model.description,
        supportsImages: model.supportsImage,
        free: model.inputPrice === 0,
        type: 'text' // 从API获取的都是文本模型
      })) : [];
      
      console.log('转换后的模型列表:', models);
      setAvailableModels(models);
      
      // 按功能分类模型
      const categorizedModels = categorizeModels(models);
      setModelsByFeature(categorizedModels);
      
      // 设置默认模型 - 根据当前活动页面选择
      const currentFeatureModels = categorizedModels[activeTab] || [];
      if (currentFeatureModels.length > 0 && !selectedModel) {
        const freeModel = currentFeatureModels.find(model => model.free);
        const defaultModel = freeModel || currentFeatureModels[0];
        setSelectedModel(defaultModel.id);
        
        // 更新AI状态显示
        setAiStatus(prev => ({
          ...prev,
          model: defaultModel.name
        }));
        
        // 加载默认模型的详细信息
        await loadModelDetails(defaultModel.id);
      }
    } catch (error) {
      console.error('加载模型列表失败:', error);
      
      // 如果API失败，使用预定义的模型列表
      const fallbackModels = getFallbackModels();
      setAvailableModels(fallbackModels.all);
      setModelsByFeature(fallbackModels.categorized);
      
      const currentFeatureModels = fallbackModels.categorized[activeTab] || [];
      if (currentFeatureModels.length > 0) {
        setSelectedModel(currentFeatureModels[0].id);
        setAiStatus(prev => ({
          ...prev,
          model: currentFeatureModels[0].name
        }));
      }
    } finally {
      setIsLoadingModels(false);
    }
  };

  // 模型分类函数
  const categorizeModels = (models) => {
    return {
      text_to_text: models, // 所有API模型都用于文本对话
      smart_image_generation: [
        { 
          id: 'dashscope/wanx-v1', 
          name: '通义万相 WANX-V1', 
          description: '阿里云DashScope图像生成模型',
          type: 'image',
          free: true
        }
      ],
      text_to_3d: [] // 暂未实现
    };
  };

  // 备用模型配置
  const getFallbackModels = () => {
    const textModels = [
      { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', supportsImages: true, description: '快速高效的多模态模型', type: 'text', free: false },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', supportsImages: true, description: 'Google的多模态模型', type: 'text', free: false },
      { id: 'deepseek/deepseek-r1-distill-qwen-7b', name: 'DeepSeek R1', supportsImages: false, description: 'DeepSeek推理模型', type: 'text', free: false },
      { id: 'qwen/qwen3-30b-a3b:free', name: 'Qwen 3 30B (免费)', supportsImages: false, description: '通义千问大模型', type: 'text', free: true },
    ];
    
    const imageModels = [
      { 
        id: 'dashscope/wanx-v1', 
        name: '通义万相 WANX-V1', 
        description: '阿里云DashScope图像生成模型',
        type: 'image',
        free: true
      }
    ];
    
    return {
      all: [...textModels, ...imageModels],
      categorized: {
        text_to_text: textModels,
        smart_image_generation: imageModels,
        text_to_3d: []
      }
    };
  };

  // 新增：加载模型详细信息
  const loadModelDetails = async (modelId) => {
    try {
      const details = await aiAPI.getModelDetails(modelId);
      setModelDetails(prev => ({
        ...prev,
        [modelId]: details
      }));
    } catch (error) {
      console.error(`加载模型 ${modelId} 详情失败:`, error);
    }
  };

  // 新增：处理模型切换
  const handleModelChange = async (modelId) => {
    try {
      setSelectedModel(modelId);
      
      // 更新AI状态显示
      const selectedModelData = availableModels.find(model => model.id === modelId);
      if (selectedModelData) {
        setAiStatus(prev => ({
          ...prev,
          model: selectedModelData.name
        }));
      }
      
      // 如果当前有对话，更新对话使用的模型
      if (currentChat?.id) {
        await chatAPI.updateModel(currentChat.id, modelId);
      }
      
      // 加载模型详细信息
      await loadModelDetails(modelId);
      
    } catch (error) {
      console.error('切换模型失败:', error);
    }
  };

  // 新增：获取当前模型信息
  const getCurrentModel = () => {
    return availableModels.find(model => model.id === selectedModel) || 
           modelsByFeature[activeTab]?.find(model => model.id === selectedModel);
  };

  // 新增：文件上传相关函数
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    uploadFiles(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    uploadFiles(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const uploadFiles = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const response = await fileAPI.upload(file, (progress) => {
          setUploadProgress(progress);
        });
        
        return {
          id: response.fileId,
          name: file.name,
          url: response.url,
          size: file.size,
          type: file.type
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...uploadedFiles]);
      
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeUploadedImage = async (imageId) => {
    try {
      await fileAPI.deleteFile(imageId);
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  };

  // 新增：检查AI状态
  const checkAIStatus = async () => {
    try {
      const status = await aiAPI.getStatus();
      setAiStatus({
        available: status.available,
        model: status.model || '',
        service: status.service || '正常'
      });
    } catch (error) {
      console.error('检查AI状态失败:', error);
      setAiStatus({
        available: false,
        model: '',
        service: '连接失败'
      });
    }
  };

  // 新增：图像生成相关函数
  const loadImageGenerationConfig = async () => {
    // 这里可以加载图像生成的配置，比如支持的尺寸、风格等
    // 目前使用默认配置
  };

  const handleSmartImageGeneration = async () => {
    if (!imageGenerationPrompt.trim()) {
      alert('请输入图像生成提示词');
      return;
    }
    
    setIsGeneratingImage(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: imageGenerationPrompt,
          size: imageGenerationSize,
          style: imageGenerationStyle,
          referenceImage: referenceImage?.url
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedImages(prev => [...prev, ...data.images]);
        setImageGenerationPrompt('');
        setReferenceImage(null);
      } else {
        throw new Error('图像生成失败');
      }
    } catch (error) {
      console.error('图像生成失败:', error);
      alert('图像生成失败，请重试');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleReferenceImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const response = await fileAPI.upload(file);
      setReferenceImage({
        id: response.fileId,
        name: file.name,
        url: response.url,
        size: file.size,
        type: file.type
      });
    } catch (error) {
      console.error('参考图片上传失败:', error);
      alert('参考图片上传失败，请重试');
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
  };

  // 新增：AI模板库相关函数
  const loadTemplateData = async () => {
    try {
      const [categoriesResponse, featuredResponse] = await Promise.all([
        promptTemplateAPI.getCategories(),
        promptTemplateAPI.getFeaturedTemplates()
      ]);
      
      setTemplateCategories(categoriesResponse.categories || []);
      setFeaturedTemplates(featuredResponse.templates || []);
      
      // 加载默认分类的模板
      if (categoriesResponse.categories?.length > 0) {
        await handleCategoryChange(categoriesResponse.categories[0].id);
      }
    } catch (error) {
      console.error('加载模板数据失败:', error);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(0);
    await loadTemplates(0, 12, categoryId);
  };

  const loadTemplates = async (page = 0, size = 12, categoryId = selectedCategory) => {
    setIsLoadingTemplates(true);
    try {
      const response = await promptTemplateAPI.getTemplates({
        page,
        size,
        categoryId
      });
      
      setTemplates(response.templates || []);
      setCurrentPage(page);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('加载模板列表失败:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm('确定要删除这个模板吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      await promptTemplateAPI.deleteTemplate(template.id);
      // 重新加载模板列表
      await loadTemplates(currentPage, 12, selectedCategory);
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除模板失败，请重试');
    }
  };

  const searchTemplates = async () => {
    if (!templateSearchKeyword.trim()) {
      await loadTemplates(0, 12, selectedCategory);
      return;
    }
    
    setIsLoadingTemplates(true);
    try {
      const response = await promptTemplateAPI.searchTemplates(
        templateSearchKeyword,
        selectedCategory,
        0,
        12
      );
      
      setTemplates(response.templates || []);
      setCurrentPage(0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('搜索模板失败:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const canDeleteTemplate = (template) => {
    return template.createdBy === user?.id || user?.role === 'admin';
  };

  const handleLikeTemplate = async (templateId) => {
    try {
      await promptTemplateAPI.toggleLike(templateId);
      // 重新加载模板列表以更新点赞状态
      await loadTemplates(currentPage, 12, selectedCategory);
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      // 记录使用统计
      await promptTemplateAPI.useTemplate(template.id, selectedModel);
      
      // 将模板内容应用到当前对话
      setInputText(template.content);
      
      // 如果当前不在智能对话页面，切换到智能对话页面
      if (activeTab !== 'text_to_text') {
        navigate('/dashboard/text_to_text');
        setActiveTab('text_to_text');
      }
      
    } catch (error) {
      console.error('使用模板失败:', error);
    }
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowTemplateDetail(true);
  };

  const handleCreateTemplate = async () => {
    if (!createTemplateForm.title || !createTemplateForm.content) {
      alert('请填写模板标题和内容');
      return;
    }
    
    try {
      await promptTemplateAPI.createTemplate(createTemplateForm);
      
      // 重置表单
      setCreateTemplateForm({
        title: '',
        description: '',
        content: '',
        categoryId: '',
        aiModel: ''
      });
      
      // 关闭创建对话框
      setShowCreateTemplate(false);
      
      // 重新加载模板列表
      await loadTemplates(currentPage, 12, selectedCategory);
      
    } catch (error) {
      console.error('创建模板失败:', error);
      alert('创建模板失败，请重试');
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
    // 新增的功能
    features: features,
    availableModels: availableModels,
    modelsByFeature: modelsByFeature,
    uploadedImages: uploadedImages,
    isUploading: isUploading,
    uploadProgress: uploadProgress,
    dragOver: dragOver,
    imageGenerationPrompt: imageGenerationPrompt,
    setImageGenerationPrompt: setImageGenerationPrompt,
    imageGenerationSize: imageGenerationSize,
    setImageGenerationSize: setImageGenerationSize,
    imageGenerationStyle: imageGenerationStyle,
    setImageGenerationStyle: setImageGenerationStyle,
    supportedSizes: supportedSizes,
    supportedStyles: supportedStyles,
    referenceImage: referenceImage,
    generatedImages: generatedImages,
    isGeneratingImage: isGeneratingImage,
    templateCategories: templateCategories,
    templates: templates,
    featuredTemplates: featuredTemplates,
    isLoadingTemplates: isLoadingTemplates,
    selectedCategory: selectedCategory,
    templateSearchKeyword: templateSearchKeyword,
    setTemplateSearchKeyword: setTemplateSearchKeyword,
    showCreateTemplate: showCreateTemplate,
    setShowCreateTemplate: setShowCreateTemplate,
    showTemplateDetail: showTemplateDetail,
    setShowTemplateDetail: setShowTemplateDetail,
    selectedTemplate: selectedTemplate,
    currentPage: currentPage,
    totalPages: totalPages,
    createTemplateForm: createTemplateForm,
    setCreateTemplateForm: setCreateTemplateForm,
    handleModelChange: handleModelChange,
    handleFileSelect: handleFileSelect,
    handleDrop: handleDrop,
    handleDragOver: handleDragOver,
    handleDragLeave: handleDragLeave,
    removeUploadedImage: removeUploadedImage,
    handleSmartImageGeneration: handleSmartImageGeneration,
    handleReferenceImageUpload: handleReferenceImageUpload,
    removeReferenceImage: removeReferenceImage,
    handleCategoryChange: handleCategoryChange,
    loadTemplates: loadTemplates,
    handleDeleteTemplate: handleDeleteTemplate,
    searchTemplates: searchTemplates,
    canDeleteTemplate: canDeleteTemplate,
    handleLikeTemplate: handleLikeTemplate,
    handleUseTemplate: handleUseTemplate,
    handleViewTemplate: handleViewTemplate,
    handleCreateTemplate: handleCreateTemplate,
  }

  return (
    <div className="dashboard">
      {/* 移动端侧边栏遮罩 - 仅在移动端且侧边栏显示时显示 */}
      {isMobile && showSidebar && (
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