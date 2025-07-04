import {
    History,
    Lock,
    MessageSquare,
    MoreVertical,
    Plus,
    Send,
    Settings,
    Star,
    Upload
} from "lucide-react";
import React from "react";

import features from "../data/features";
import aiModels from "../data/aiModels";
import formatTime from "../utils/formatTime";
import { useOutletContext } from "react-router-dom";

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
    } = useOutletContext()

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
                                {!showHeader && (
                                    <button
                                        className="toggle-header-btn prominent"
                                        onClick={() => setShowHeader(true)}
                                        title="显示顶部栏"
                                    >
                                        <Settings size={16} />
                                        <span className="toggle-text">显示顶栏</span>
                                    </button>
                                )}
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
}

export default FeatureContent;