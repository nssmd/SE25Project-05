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

    // 渲染AI模板库功能
    const renderPromptTemplateLibrary = () => (
        <div className="prompt-template-library">
            {/* 固定标题栏 */}
            <div className="template-library-header">
                <button className="back-button" onClick={() => window.history.back()}>
                    <ArrowLeft size={16} />
                    返回
                </button>
                
                <div className="library-title">
                    <h1>AI模板库</h1>
                    <p>发现和使用高质量的Prompt模板</p>
                </div>
                
                <div className="library-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="搜索模板..."
                            value={templateSearchKeyword}
                            onChange={(e) => setTemplateSearchKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchTemplates()}
                        />
                        <button className="search-btn" onClick={searchTemplates}>
                            <Search size={16} />
                        </button>
                    </div>
                    
                    <button className="create-template-btn" onClick={() => setShowCreateTemplate(true)}>
                        <Plus size={16} />
                        创建模板
                    </button>
                </div>
            </div>

            {/* 分类选择 */}
            <div className="template-categories">
                <button
                    className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(null)}
                >
                    全部
                </button>
                {templateCategories.map(category => (
                    <button
                        key={category.id}
                        className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(category.id)}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {/* 精选模板 */}
            {featuredTemplates.length > 0 && (
                <div className="template-section">
                    <h3>精选模板</h3>
                    <div className="template-grid">
                        {featuredTemplates.map(template => (
                            <div key={template.id} className="template-card">
                                <div className="template-header">
                                    <h4>{template.title}</h4>
                                    <span className={template.isOfficial ? 'official-badge' : 'user-badge'}>
                                        {template.isOfficial ? '官方' : '用户'}
                                    </span>
                                </div>
                                <p className="template-description">{template.description}</p>
                                <div className="template-meta">
                                    <span className="category-tag">{template.categoryName}</span>
                                    <span className="model-tag">{template.aiModel}</span>
                                </div>
                                <div className="template-stats">
                                    <span>❤️ {template.likeCount || 0}</span>
                                    <span>👁️ {template.useCount || 0}</span>
                                </div>
                                <div className="template-actions">
                                    <button className="like-btn" onClick={() => handleLikeTemplate(template.id)}>
                                        <Heart size={14} />
                                    </button>
                                    <button className="view-btn" onClick={() => handleViewTemplate(template)}>
                                        <Eye size={14} />
                                    </button>
                                    <button className="use-btn" onClick={() => handleUseTemplate(template)}>
                                        使用
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 模板列表 */}
            <div className="template-section">
                <h3>所有模板</h3>
                {isLoadingTemplates ? (
                    <div className="loading-templates">加载中...</div>
                ) : templates.length === 0 ? (
                    <div className="empty-state">
                        <Brain size={64} />
                        <h4>暂无模板</h4>
                        <p>该分类下还没有模板，快来创建第一个吧！</p>
                    </div>
                ) : (
                    <div className="template-grid">
                        {templates.map(template => (
                            <div key={template.id} className="template-card">
                                <div className="template-header">
                                    <h4>{template.title}</h4>
                                    <span className={template.isOfficial ? 'official-badge' : 'user-badge'}>
                                        {template.isOfficial ? '官方' : '用户'}
                                    </span>
                                </div>
                                <p className="template-description">{template.description}</p>
                                <div className="template-meta">
                                    <span className="category-tag">{template.categoryName}</span>
                                    <span className="model-tag">{template.aiModel}</span>
                                </div>
                                <div className="template-stats">
                                    <span className={template.isLiked ? 'liked' : ''}>
                                        ❤️ {template.likeCount || 0}
                                    </span>
                                    <span>👁️ {template.useCount || 0}</span>
                                </div>
                                <div className="template-actions">
                                    <button 
                                        className={`like-btn ${template.isLiked ? 'liked' : ''}`}
                                        onClick={() => handleLikeTemplate(template.id)}
                                    >
                                        <Heart size={14} />
                                    </button>
                                    <button className="view-btn" onClick={() => handleViewTemplate(template)}>
                                        <Eye size={14} />
                                    </button>
                                    <button className="use-btn" onClick={() => handleUseTemplate(template)}>
                                        使用
                                    </button>
                                    {canDeleteTemplate(template) && (
                                        <button 
                                            className="delete-btn" 
                                            onClick={() => handleDeleteTemplate(template)}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        className="pagination-btn"
                        disabled={currentPage === 0}
                        onClick={() => loadTemplates(currentPage - 1, 12, selectedCategory)}
                    >
                        上一页
                    </button>
                    
                    <div className="pagination-numbers">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = Math.max(0, Math.min(totalPages - 1, currentPage - 2 + i));
                            return (
                                <button
                                    key={page}
                                    className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                                    onClick={() => loadTemplates(page, 12, selectedCategory)}
                                >
                                    {page + 1}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button 
                        className="pagination-btn"
                        disabled={currentPage === totalPages - 1}
                        onClick={() => loadTemplates(currentPage + 1, 12, selectedCategory)}
                    >
                        下一页
                    </button>
                    
                    <div className="pagination-info">
                        第 {currentPage + 1} 页，共 {totalPages} 页
                    </div>
                </div>
            )}
        </div>
    );

    // 渲染模板详情模态框
    const renderTemplateDetailModal = () => {
        if (!showTemplateDetail || !selectedTemplate) return null;

        return (
            <div className="template-modal-overlay" onClick={() => setShowTemplateDetail(false)}>
                <div className="template-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={() => setShowTemplateDetail(false)}>
                        <X size={20} />
                    </button>
                    
                    <div className="modal-template-content">
                        <h2 className="modal-template-title">{selectedTemplate.title}</h2>
                        <div className="modal-template-meta">
                            <span className="category-tag">{selectedTemplate.categoryName}</span>
                            <span className="model-tag">{selectedTemplate.aiModel}</span>
                        </div>
                        <p className="modal-template-description">{selectedTemplate.description}</p>
                        <div className="modal-template-prompt">
                            <h4>Prompt内容</h4>
                            <pre>{selectedTemplate.content}</pre>
                        </div>
                    </div>
                    
                    <div className="modal-actions">
                        <button onClick={() => setShowTemplateDetail(false)}>关闭</button>
                        <button onClick={() => handleUseTemplate(selectedTemplate)}>使用模板</button>
                    </div>
                </div>
            </div>
        );
    };

    // 渲染创建模板模态框
    const renderCreateTemplateModal = () => {
        if (!showCreateTemplate) return null;

        return (
            <div className="template-modal-overlay" onClick={() => setShowCreateTemplate(false)}>
                <div className="create-template-modal" onClick={(e) => e.stopPropagation()}>
                    <h2>创建新模板</h2>
                    
                    <form className="create-template-form">
                        <div className="form-group">
                            <label>模板标题</label>
                            <input
                                type="text"
                                value={createTemplateForm.title}
                                onChange={(e) => setCreateTemplateForm(prev => ({
                                    ...prev,
                                    title: e.target.value
                                }))}
                                placeholder="输入模板标题"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>模板描述</label>
                            <textarea
                                value={createTemplateForm.description}
                                onChange={(e) => setCreateTemplateForm(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                                placeholder="描述模板的用途"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Prompt内容</label>
                            <textarea
                                value={createTemplateForm.content}
                                onChange={(e) => setCreateTemplateForm(prev => ({
                                    ...prev,
                                    content: e.target.value
                                }))}
                                placeholder="输入Prompt内容"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>分类</label>
                            <select
                                value={createTemplateForm.categoryId}
                                onChange={(e) => setCreateTemplateForm(prev => ({
                                    ...prev,
                                    categoryId: e.target.value
                                }))}
                            >
                                <option value="">选择分类</option>
                                {templateCategories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>适用模型</label>
                            <input
                                type="text"
                                value={createTemplateForm.aiModel}
                                onChange={(e) => setCreateTemplateForm(prev => ({
                                    ...prev,
                                    aiModel: e.target.value
                                }))}
                                placeholder="适用的AI模型"
                            />
                        </div>
                    </form>
                    
                    <div className="form-actions">
                        <button className="cancel-btn" onClick={() => setShowCreateTemplate(false)}>
                            取消
                        </button>
                        <button className="submit-btn" onClick={handleCreateTemplate}>
                            创建模板
                        </button>
                    </div>
                </div>
            </div>
        );
    };

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

                {renderModelSelector()}
            </div>

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