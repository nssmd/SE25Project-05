import React, { useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
    History,
    Lock,
    MessageSquare,
    MoreVertical,
    Plus,
    Send,
    Settings,
    Star,
    Upload,
    Image,
    Brain,
    Search,
    Heart,
    Eye,
    Download,
    Trash2,
    X,
    ArrowLeft,
    FileText,
    User,
    Crown
} from "lucide-react";
import formatTime from "../utils/formatTime";

const FeatureContent = () => {
    const {
        activeTab,
        selectedModel,
        setSelectedModel,
        inputText,
        setInputText,
        chatHistory,
        isLoading,
        currentChat,
        chatList,
        isLoadingChats,
        showChatList,
        setShowChatList,
        showHeader,
        setShowHeader,
        messagesEndRef,
        createNewChat,
        showContextMenu,
        switchChat,
        handleSendMessage,
        // 新增的功能
        features,
        availableModels,
        modelsByFeature,
        uploadedImages,
        isUploading,
        uploadProgress,
        dragOver,
        imageGenerationPrompt,
        setImageGenerationPrompt,
        imageGenerationSize,
        setImageGenerationSize,
        imageGenerationStyle,
        setImageGenerationStyle,
        supportedSizes,
        supportedStyles,
        referenceImage,
        generatedImages,
        isGeneratingImage,
        templateCategories,
        templates,
        featuredTemplates,
        isLoadingTemplates,
        selectedCategory,
        templateSearchKeyword,
        setTemplateSearchKeyword,
        showCreateTemplate,
        setShowCreateTemplate,
        showTemplateDetail,
        setShowTemplateDetail,
        selectedTemplate,
        currentPage,
        totalPages,
        createTemplateForm,
        setCreateTemplateForm,
        handleModelChange,
        handleFileSelect,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        removeUploadedImage,
        handleSmartImageGeneration,
        handleReferenceImageUpload,
        removeReferenceImage,
        handleCategoryChange,
        loadTemplates,
        handleDeleteTemplate,
        searchTemplates,
        canDeleteTemplate,
        handleLikeTemplate,
        handleUseTemplate,
        handleViewTemplate,
        handleCreateTemplate,
        setActiveTab,
    } = useOutletContext();

    const fileInputRef = useRef(null);
    const currentFeature = features.find(f => f.id === activeTab);

    // 渲染模型选择器
    const renderModelSelector = () => {
        const currentFeatureModels = modelsByFeature[activeTab] || [];

    return (
                <div className="model-selector">
                    <label>选择模型:</label>
                    <select
                        value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                        className="model-select"
                    >
                    {currentFeatureModels.map(model => (
                            <option key={model.id} value={model.id}>
                            {model.name} {model.free && '(免费)'}
                            </option>
                        ))}
                    </select>
                </div>
        );
    };

    // 渲染智能对话功能
    const renderTextToText = () => (
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

                {/* 文件上传区域 */}
                <div 
                    className={`file-upload-area ${dragOver ? 'drag-over' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    
                    {uploadedImages.length > 0 && (
                        <div className="uploaded-images">
                            {uploadedImages.map((image, index) => (
                                <div key={image.id} className="uploaded-image">
                                    <img src={image.url} alt={image.name} />
                                    <button
                                        className="remove-image-btn"
                                        onClick={() => removeUploadedImage(image.id)}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {isUploading && (
                        <div className="upload-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <span>{uploadProgress}%</span>
                        </div>
                    )}
                    
                    {!isUploading && uploadedImages.length === 0 && (
                        <div className="upload-prompt">
                            <Upload size={24} />
                            <p>拖拽图片到此处或点击上传</p>
                            <button onClick={() => fileInputRef.current?.click()}>
                                选择文件
                            </button>
                        </div>
                    )}
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
    );

    // 渲染智能生图功能
    const renderSmartImageGeneration = () => (
        <div className="image-generation-layout">
            <div className="image-generation-header">
                <h3>智能图像生成</h3>
                <p>输入提示词，AI将为您生成精美的图像</p>
            </div>

            <div className="image-generation-content">
                <div className="prompt-section">
                    <div className="prompt-input">
                        <textarea
                            value={imageGenerationPrompt}
                            onChange={(e) => setImageGenerationPrompt(e.target.value)}
                            placeholder="描述您想要生成的图像，例如：一只可爱的小猫坐在花园里"
                            rows={4}
                        />
                    </div>

                    <div className="generation-options">
                        <div className="option-group">
                            <label>图像尺寸:</label>
                            <select
                                value={imageGenerationSize}
                                onChange={(e) => setImageGenerationSize(e.target.value)}
                            >
                                {supportedSizes.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>

                        <div className="option-group">
                            <label>图像风格:</label>
                            <select
                                value={imageGenerationStyle}
                                onChange={(e) => setImageGenerationStyle(e.target.value)}
                            >
                                {supportedStyles.map(style => (
                                    <option key={style} value={style}>
                                        {style === '<auto>' ? '自动' : style.replace(/[<>]/g, '')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="reference-image-section">
                        <label>参考图片 (可选):</label>
                        <div className="reference-image-upload">
                            {referenceImage ? (
                                <div className="reference-image">
                                    <img src={referenceImage.url} alt="参考图片" />
                                    <button onClick={removeReferenceImage}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-area">
                                    <input
                                        type="file"
                                        onChange={handleReferenceImageUpload}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="reference-image-input"
                                    />
                                    <label htmlFor="reference-image-input">
                                        <Upload size={24} />
                                        <span>上传参考图片</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className="generate-btn"
                        onClick={handleSmartImageGeneration}
                        disabled={isGeneratingImage || !imageGenerationPrompt.trim()}
                    >
                        {isGeneratingImage ? '生成中...' : '生成图像'}
                    </button>
                </div>

                <div className="generated-images">
                    <h4>生成的图像</h4>
                    {generatedImages.length === 0 ? (
                        <div className="empty-images">
                            <Image size={48} />
                            <p>还没有生成的图像</p>
                        </div>
                    ) : (
                        <div className="image-grid">
                            {generatedImages.map((image, index) => (
                                <div key={index} className="generated-image">
                                    <img src={image.url} alt={`生成的图像 ${index + 1}`} />
                                    <div className="image-actions">
                                        <button onClick={() => window.open(image.url, '_blank')}>
                                            <Eye size={16} />
                                        </button>
                                        <button onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = image.url;
                                            link.download = `generated-image-${index + 1}.png`;
                                            link.click();
                                        }}>
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // 渲染AI模板库功能 - 优化布局和深色模式支持
    const renderPromptTemplateLibrary = () => (
        <div className="prompt-template-library">
            {/* 标题栏 - 调整为非固定位置，放在sidebar下面 */}
            <div className="template-library-header">
                <div className="library-title">
                    <h1>AI模板库</h1>
                    <p>精选优质提示词模板，提升您的AI对话体验</p>
                </div>
                <div className="library-actions">
                    <button 
                        className="create-template-btn" 
                        onClick={() => setShowCreateTemplate(true)}
                        title="创建新模板"
                    >
                        <Plus size={16} />
                        创建模板
                    </button>
                </div>
            </div>

            {/* 搜索栏 - 只在点击/回车时触发搜索 */}
            <div className="template-search-container">
                <div className="template-search-bar">
                    <input
                        type="text"
                        className="template-search-input"
                        placeholder="搜索模板标题、描述或内容..."
                        value={templateSearchKeyword}
                        onChange={(e) => setTemplateSearchKeyword(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                searchTemplates();
                            }
                        }}
                        onFocus={(e) => {
                            e.target.select();
                        }}
                    />
                    <button 
                        className="template-search-btn" 
                        onClick={() => {
                            if (templateSearchKeyword.trim()) {
                                searchTemplates();
                            } else {
                                loadTemplates(0);
                            }
                        }}
                        title="搜索模板"
                    >
                        <Search size={16} />
                    </button>
                </div>
            </div>

            {/* 分类选择 - 优化布局 */}
            <div className="template-categories">
                <button
                    className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(null)}
                    title="显示所有模板"
                >
                    全部
                </button>
                {templateCategories.map(category => (
                    <button
                        key={category.id}
                        className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(category.id)}
                        title={`筛选 ${category.name} 分类`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {/* 模板内容区独立滚动 */}
            <div className="template-sections">
                {/* 搜索状态提示 */}
                {templateSearchKeyword.trim() && (
                    <div className="search-status">
                        <Search size={16} />
                        <span>搜索关键词: "{templateSearchKeyword}"</span>
                        <button 
                            onClick={() => {
                                setTemplateSearchKeyword('');
                                loadTemplates(0);
                            }}
                        >
                            清除搜索
                        </button>
                    </div>
                )}

                {/* 精选模板 - 优化显示逻辑 */}
                {featuredTemplates.length > 0 && !templateSearchKeyword.trim() && (
                    <div className="template-section">
                        <h3>⭐ 精选模板</h3>
                        <div className="template-grid">
                            {featuredTemplates.map(template => (
                                <div key={template.id} className="template-card">
                                    <div className="template-header">
                                        <h4 title={template.title}>{template.title}</h4>
                                        <span className={template.isOfficial ? 'official-badge' : 'user-badge'}>
                                            {template.isOfficial ? '官方' : '用户'}
                                        </span>
                                    </div>
                                    <p className="template-description" title={template.description}>
                                        {template.description}
                                    </p>
                                    <div className="template-meta">
                                        <span className="category-tag" title={`分类: ${template.categoryName}`}>
                                            {template.categoryName}
                                        </span>
                                        <span className="model-tag" title={`推荐模型: ${template.aiModel}`}>
                                            {template.aiModel}
                                        </span>
                                    </div>
                                    <div className="template-stats">
                                        <span className={template.isLiked ? 'liked' : ''} title="点赞数">
                                            ❤️ {template.likeCount || 0}
                                        </span>
                                        <span title="使用次数">👁️ {template.useCount || 0}</span>
                                    </div>
                                    <div className="template-actions">
                                        <button 
                                            className={`like-btn ${template.isLiked ? 'liked' : ''}`} 
                                            onClick={() => handleLikeTemplate(template.id)}
                                            title={template.isLiked ? '取消点赞' : '点赞'}
                                        >
                                            <Heart size={14} />
                                        </button>
                                        <button 
                                            className="view-btn" 
                                            onClick={() => handleViewTemplate(template)}
                                            title="查看详情"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button 
                                            className="use-btn" 
                                            onClick={() => handleUseTemplate(template)}
                                            title="使用此模板"
                                        >
                                            使用
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 模板列表 - 优化显示逻辑 */}
                <div className="template-section">
                    <h3>
                        {templateSearchKeyword.trim() ? '🔍 搜索结果' : '📚 模板库'}
                    </h3>
                    {isLoadingTemplates ? (
                        <div className="loading-templates">
                            <p>正在加载模板...</p>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="empty-state">
                            <Brain size={64} />
                            <h4>
                                {templateSearchKeyword.trim() 
                                    ? `未找到包含"${templateSearchKeyword}"的模板` 
                                    : '暂无模板'
                                }
                            </h4>
                            <p>
                                {templateSearchKeyword.trim() 
                                    ? '尝试使用不同的关键词搜索，或清除搜索条件查看所有模板'
                                    : '该分类下还没有模板，快来创建第一个吧！'
                                }
                            </p>
                            {!templateSearchKeyword.trim() && (
                                <button 
                                    className="create-template-btn" 
                                    onClick={() => setShowCreateTemplate(true)}
                                    style={{ marginTop: '15px' }}
                                >
                                    <Plus size={16} />
                                    创建模板
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="template-grid">
                                {templates.map(template => (
                                    <div key={template.id} className="template-card">
                                        <div className="template-header">
                                            <h4 title={template.title}>{template.title}</h4>
                                            <span className={template.isOfficial ? 'official-badge' : 'user-badge'}>
                                                {template.isOfficial ? '官方' : '用户'}
                                            </span>
                                        </div>
                                        <p className="template-description" title={template.description}>
                                            {template.description}
                                        </p>
                                        <div className="template-meta">
                                            <span className="category-tag" title={`分类: ${template.categoryName}`}>
                                                {template.categoryName}
                                            </span>
                                            <span className="model-tag" title={`推荐模型: ${template.aiModel}`}>
                                                {template.aiModel}
                                            </span>
                                        </div>
                                        <div className="template-stats">
                                            <span className={template.isLiked ? 'liked' : ''} title="点赞数">
                                                ❤️ {template.likeCount || 0}
                                            </span>
                                            <span title="使用次数">👁️ {template.useCount || 0}</span>
                                        </div>
                                        <div className="template-actions">
                                            <button 
                                                className={`like-btn ${template.isLiked ? 'liked' : ''}`} 
                                                onClick={() => handleLikeTemplate(template.id)}
                                                title={template.isLiked ? '取消点赞' : '点赞'}
                                            >
                                                <Heart size={14} />
                                            </button>
                                            <button 
                                                className="view-btn" 
                                                onClick={() => handleViewTemplate(template)}
                                                title="查看详情"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button 
                                                className="use-btn" 
                                                onClick={() => handleUseTemplate(template)}
                                                title="使用此模板"
                                            >
                                                使用
                                            </button>
                                            {canDeleteTemplate(template) && (
                                                <button 
                                                    className="delete-btn" 
                                                    onClick={() => handleDeleteTemplate(template)}
                                                    title="删除模板"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* 分页组件 */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button 
                                        className="pagination-btn"
                                        onClick={() => loadTemplates(currentPage - 1)}
                                        disabled={currentPage === 0}
                                        title="上一页"
                                    >
                                        ← 上一页
                                    </button>
                                    
                                    <div className="pagination-numbers">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i;
                                            } else if (currentPage < 3) {
                                                pageNum = i;
                                            } else if (currentPage >= totalPages - 3) {
                                                pageNum = totalPages - 5 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                                                    onClick={() => loadTemplates(pageNum)}
                                                    title={`第 ${pageNum + 1} 页`}
                                                >
                                                    {pageNum + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button 
                                        className="pagination-btn"
                                        onClick={() => loadTemplates(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1}
                                        title="下一页"
                                    >
                                        下一页 →
                                    </button>
                                    
                                    <div className="pagination-info">
                                        第 {currentPage + 1} 页，共 {totalPages} 页
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // 渲染模板详情模态框 - 优化深色模式支持
    const renderTemplateDetailModal = () => {
        if (!showTemplateDetail || !selectedTemplate) return null;

        return (
            <div className="template-modal-overlay" onClick={() => setShowTemplateDetail(false)}>
                <div className="template-modal" onClick={(e) => e.stopPropagation()}>
                    <button 
                        className="modal-close-btn" 
                        onClick={() => setShowTemplateDetail(false)}
                        title="关闭详情"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="modal-template-content">
                        <h2 className="modal-template-title">{selectedTemplate.title}</h2>
                        
                        <div className="modal-template-meta">
                            {selectedTemplate.isOfficial ? (
                                <span className="official-badge">官方</span>
                            ) : (
                                <span className="user-badge">用户</span>
                            )}
                            <span className="category-tag">{selectedTemplate.categoryName}</span>
                            <span className="model-tag">{selectedTemplate.aiModel}</span>
                        </div>
                        
                        <p className="modal-template-description">{selectedTemplate.description}</p>
                        
                        <div className="modal-template-prompt">
                            <h4>📝 Prompt内容</h4>
                            <pre>{selectedTemplate.content}</pre>
                        </div>
                        
                        <div className="template-stats" style={{ marginBottom: '20px' }}>
                            <span className={selectedTemplate.isLiked ? 'liked' : ''} title="点赞数">
                                ❤️ {selectedTemplate.likeCount || 0} 人点赞
                            </span>
                            <span title="使用次数">👁️ {selectedTemplate.useCount || 0} 次使用</span>
                        </div>
                    </div>
                    
                    <div className="modal-actions">
                        <button 
                            className={`like-btn ${selectedTemplate.isLiked ? 'liked' : ''}`}
                            onClick={() => handleLikeTemplate(selectedTemplate.id)}
                            title={selectedTemplate.isLiked ? '取消点赞' : '点赞'}
                        >
                            {selectedTemplate.isLiked ? '❤️ 已点赞' : '👍 点赞'}
                        </button>
                        
                        <button 
                            className="use-btn"
                            onClick={() => {
                                handleUseTemplate(selectedTemplate);
                                setShowTemplateDetail(false);
                            }}
                            title="使用此模板"
                        >
                            使用模板
                        </button>
                        
                        {canDeleteTemplate(selectedTemplate) && (
                            <button 
                                className="delete-btn"
                                onClick={() => {
                                    handleDeleteTemplate(selectedTemplate);
                                    setShowTemplateDetail(false);
                                }}
                                title="删除模板"
                            >
                                🗑️ 删除
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // 渲染创建模板模态框 - 优化深色模式支持
    const renderCreateTemplateModal = () => {
        if (!showCreateTemplate) return null;

        return (
            <div className="template-modal-overlay" onClick={() => setShowCreateTemplate(false)}>
                <div className="create-template-modal" onClick={(e) => e.stopPropagation()}>
                    <button 
                        className="modal-close-btn" 
                        onClick={() => setShowCreateTemplate(false)}
                        title="关闭创建"
                    >
                        <X size={20} />
                    </button>
                    
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '20px' }}>创建新模板</h2>
                    
                    <div className="create-template-form">
                        <div className="form-group">
                            <label>模板标题 *</label>
                            <input
                                type="text"
                                value={createTemplateForm.title}
                                onChange={(e) => setCreateTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="请输入模板标题"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>模板描述 *</label>
                            <textarea
                                value={createTemplateForm.description}
                                onChange={(e) => setCreateTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="请描述模板的用途和特点"
                                style={{ minHeight: '80px' }}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>模板内容 *</label>
                            <textarea
                                value={createTemplateForm.content}
                                onChange={(e) => setCreateTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="请输入提示词模板内容"
                                style={{ minHeight: '120px' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>模板分类 *</label>
                                <select
                                    value={createTemplateForm.categoryId}
                                    onChange={(e) => setCreateTemplateForm(prev => ({ ...prev, categoryId: e.target.value }))}
                                >
                                    <option value="">请选择分类</option>
                                    {templateCategories
                                        .filter(cat => cat.id !== null)
                                        .map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>推荐AI模型 *</label>
                                <select
                                    value={createTemplateForm.aiModel}
                                    onChange={(e) => setCreateTemplateForm(prev => ({ ...prev, aiModel: e.target.value }))}
                                >
                                    <option value="">请选择模型</option>
                                    <option value="qwen">qwen</option>
                                    <option value="deepseek">deepseek</option>
                                    <option value="gpt">gpt</option>
                                    <option value="gemini">gemini</option>
                                    <option value="文生图">文生图</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            className="cancel-btn"
                            onClick={() => setShowCreateTemplate(false)}
                        >
                            取消
                        </button>
                        <button 
                            className="submit-btn"
                            onClick={handleCreateTemplate}
                        >
                            创建模板
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="feature-content">
            {/* 在AI模板库页面时不显示feature-header */}
            {activeTab !== 'prompt_template_library' && (
                <div className="feature-header">
                    <div className="feature-title">
                        <currentFeature.icon className="feature-icon" />
                        <div>
                            <h2>{currentFeature.name}</h2>
                            <p>{currentFeature.description}</p>
                        </div>
                    </div>

                    {renderModelSelector()}
                </div>
            )}

            {/* 根据当前功能渲染不同内容 */}
            {activeTab === 'text_to_text' && renderTextToText()}
            {activeTab === 'smart_image_generation' && renderSmartImageGeneration()}
            {activeTab === 'prompt_template_library' && renderPromptTemplateLibrary()}
            
            {/* 其他功能显示占位符 */}
            {!['text_to_text', 'smart_image_generation', 'prompt_template_library'].includes(activeTab) && (
                <div className="feature-placeholder">
                    <div className="placeholder-content">
                        <Upload size={48} />
                        <h3>功能正在开发中</h3>
                        <p>
                            {activeTab === 'text_to_3d' && '文本生成3D模型功能即将上线'}
                        </p>
                        <p>敬请期待！</p>
                    </div>
                </div>
            )}

            {/* 模态框 */}
            {renderTemplateDetailModal()}
            {renderCreateTemplateModal()}
        </div>
    );
};

export default FeatureContent;