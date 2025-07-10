package com.aiplatform.service;

import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.entity.User;
import com.aiplatform.repository.ChatRepository;
import com.aiplatform.repository.MessageRepository;
import com.aiplatform.repository.MessageAttachmentRepository;
import com.aiplatform.repository.UserRepository;
import com.aiplatform.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final UserRepository userRepository;
    private final AiService aiService;

    /**
     * 创建新的聊天会话
     */
    public Chat createChat(Long userId, String title, Chat.AiType aiType) {
        log.info("创建聊天会话: userId={}, title={}, aiType={}", userId, title, aiType);
        
        // 验证用户存在
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
        
        Chat chat = new Chat();
        chat.setUserId(userId);
        chat.setTitle(title != null && !title.trim().isEmpty() ? title : "新对话");
        chat.setAiType(aiType != null ? aiType : Chat.AiType.conversation);
        chat.setIsFavorite(false);
        chat.setIsProtected(false);
        chat.setMessageCount(0);
        chat.setLastActivity(LocalDateTime.now());
        
        Chat savedChat = chatRepository.save(chat);
        log.info("聊天会话创建成功: chatId={}", savedChat.getId());
        
        return savedChat;
    }

    /**
     * 发送消息
     */
    public Message sendMessage(Long chatId, Long userId, String content, Message.MessageRole role) {
        log.info("发送消息: chatId={}, userId={}, role={}", chatId, userId, role);
        
        // 验证聊天会话存在且属于当前用户
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
            .orElseThrow(() -> new BusinessException("聊天会话不存在或无权限访问"));
        
        // 创建消息
        Message message = new Message();
        message.setChatId(chatId);
        message.setRole(role);
        message.setContent(content);
        
        Message savedMessage = messageRepository.save(message);
        
        // 更新聊天会话的消息计数和最后活动时间
        chat.incrementMessageCount();
        chatRepository.save(chat);
        
        log.info("消息发送成功: messageId={}", savedMessage.getId());
        return savedMessage;
    }

    /**
     * 获取聊天消息列表
     */
    public List<Message> getChatMessages(Long chatId, Long userId) {
        log.info("获取聊天消息: chatId={}, userId={}", chatId, userId);
        
        // 验证聊天会话存在且属于当前用户
        chatRepository.findByIdAndUserId(chatId, userId)
            .orElseThrow(() -> new BusinessException("聊天会话不存在或无权限访问"));
        
        // 获取消息列表
        List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
        
        // 手动加载每个消息的附件信息
        for (Message message : messages) {
            List<MessageAttachment> attachments = messageAttachmentRepository.findByMessageIdOrderByCreatedAtAsc(message.getId());
            log.debug("消息 {} 的附件数量: {}", message.getId(), attachments.size());
            
            // 为每个附件添加调试信息
            for (MessageAttachment attachment : attachments) {
                log.debug("附件详情: fileName={}, originalName={}, isImage={}, fileUrl={}", 
                        attachment.getFileName(), attachment.getOriginalName(), 
                        attachment.isImage(), attachment.getFileUrl());
            }
            
            message.setAttachments(attachments);
        }
        
        log.info("返回 {} 条消息", messages.size());
        return messages;
    }

    /**
     * 获取用户的聊天列表
     */
    public Page<Chat> getUserChats(Long userId, Pageable pageable) {
        log.info("获取用户聊天列表: userId={}", userId);
        return chatRepository.findByUserIdOrderByLastActivityDesc(userId, pageable);
    }

    /**
     * 根据ID获取聊天会话
     */
    public Chat getChatById(Long chatId) {
        log.info("根据ID获取聊天会话: chatId={}", chatId);
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new BusinessException("聊天会话不存在"));
    }

    /**
     * 删除聊天会话
     */
    public void deleteChat(Long chatId, Long userId) {
        log.info("删除聊天会话: chatId={}, userId={}", chatId, userId);
        
        // 验证聊天会话存在且属于当前用户
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
            .orElseThrow(() -> new BusinessException("聊天会话不存在或无权限访问"));
        
        // 删除相关消息
        messageRepository.deleteByChatId(chatId);
        
        // 删除聊天会话
        chatRepository.delete(chat);
        
        log.info("聊天会话删除成功: chatId={}", chatId);
    }

    /**
     * 更新聊天标题
     */
    public Chat updateChatTitle(Long chatId, Long userId, String title) {
        log.info("更新聊天标题: chatId={}, userId={}, title={}", chatId, userId, title);
        
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
            .orElseThrow(() -> new BusinessException("聊天会话不存在或无权限访问"));
        
        chat.setTitle(title);
        return chatRepository.save(chat);
    }

    /**
     * 切换收藏状态
     */
    public Chat toggleFavorite(Long chatId, Long userId) {
        log.info("切换收藏状态: chatId={}, userId={}", chatId, userId);
        
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
            .orElseThrow(() -> new BusinessException("聊天会话不存在或无权限访问"));
        
        chat.setIsFavorite(!chat.getIsFavorite());
        return chatRepository.save(chat);
    }

    /**
     * 切换保护状态
     */
    public Chat toggleProtection(Long chatId, Long userId) {
        log.info("切换保护状态: chatId={}, userId={}", chatId, userId);
        
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
            .orElseThrow(() -> new BusinessException("聊天会话不存在或无权限访问"));
        
        chat.setIsProtected(!chat.getIsProtected());
        return chatRepository.save(chat);
    }

    /**
     * 生成AI回复
     */
    public String generateAIResponse(String userMessage, String aiType, String model, Map<String, Object> options) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "请输入您的问题。";
        }
        
        try {
            // 使用新的AiService生成回复
            return aiService.generateResponse(userMessage, aiType, model, options);
            
        } catch (Exception e) {
            log.error("AI回复生成失败: ", e);
            return "抱歉，AI服务暂时遇到问题，请稍后再试。如果问题持续存在，请联系管理员。";
        }
    }

    /**
     * 更新聊天会话的AI模型
     */
    public Chat updateChatModel(Long chatId, String modelId) {
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new BusinessException("聊天会话不存在"));
        
        chat.setAiModel(modelId);
        Chat savedChat = chatRepository.save(chat);
        
        log.info("更新聊天模型: chatId={}, model={}", chatId, modelId);
        return savedChat;
    }

    /**
     * 更新聊天会话的AI模型（带用户权限验证）
     */
    public Chat updateChatModel(Long chatId, Long userId, String modelId) {
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
            .orElseThrow(() -> new BusinessException("聊天会话不存在或无权限访问"));
        
        chat.setAiModel(modelId);
        Chat savedChat = chatRepository.save(chat);
        
        log.info("更新聊天模型: chatId={}, userId={}, model={}", chatId, userId, modelId);
        return savedChat;
    }

    /**
     * 检查AI服务状态
     */
    public boolean isAIServiceAvailable() {
        return aiService.isAIServiceAvailable();
    }

    /**
     * 获取当前AI模型
     */
    public String getCurrentAIModel() {
        return aiService.getCurrentModel();
    }

        /**
     * 为消息关联附件
     */
    public void attachFilesToMessage(Long messageId, List<Map<String, Object>> attachments) {
        log.info("为消息关联附件: messageId={}, 附件数量={}", messageId, attachments.size());
        
        for (Map<String, Object> attachment : attachments) {
            String fileId = (String) attachment.get("fileId");
            String fileName = (String) attachment.get("fileName");
            String originalName = (String) attachment.get("originalName");
            String fileType = (String) attachment.get("fileType");
            
            log.debug("处理附件: fileId={}, fileName={}, originalName={}, fileType={}", fileId, fileName, originalName, fileType);
            
            MessageAttachment existingAttachment = null;
            
            // 1. 先尝试通过 fileId 查找附件（fileId 是系统生成的文件名）
            if (fileId != null) {
                existingAttachment = messageAttachmentRepository.findByFileName(fileId);
            }
            
            // 2. 如果通过 fileId 没找到，尝试通过 fileName 查找
            if (existingAttachment == null && fileName != null) {
                existingAttachment = messageAttachmentRepository.findByFileName(fileName);
            }
            
            // 3. 如果还没找到，尝试通过 originalName 查找未关联的附件
            if (existingAttachment == null && originalName != null) {
                List<MessageAttachment> unassignedAttachments = messageAttachmentRepository.findByMessageIdIsNull();
                for (MessageAttachment unassigned : unassignedAttachments) {
                    if (originalName.equals(unassigned.getOriginalName())) {
                        existingAttachment = unassigned;
                        break;
                    }
                }
            }
            
            if (existingAttachment != null) {
                existingAttachment.setMessageId(messageId);
                messageAttachmentRepository.save(existingAttachment);
                log.info("附件关联成功: fileName={}, originalName={}, messageId={}", 
                        existingAttachment.getFileName(), existingAttachment.getOriginalName(), messageId);
            } else {
                log.warn("未找到附件记录: fileId={}, fileName={}, originalName={}", fileId, fileName, originalName);
                // 调试信息：列出所有未关联的附件
                List<MessageAttachment> unassignedAttachments = messageAttachmentRepository.findByMessageIdIsNull();
                log.debug("当前未关联的附件数量: {}", unassignedAttachments.size());
                for (MessageAttachment unassigned : unassignedAttachments) {
                    log.debug("未关联附件: fileName={}, originalName={}", unassigned.getFileName(), unassigned.getOriginalName());
                }
            }
        }
    }

    /**
     * 通过文件名列表关联附件到消息
     */
    public void attachFilesByNames(Long messageId, List<String> fileNames) {
        log.info("通过文件名关联附件: messageId={}, 文件数量={}", messageId, fileNames.size());
        
        List<MessageAttachment> attachments = messageAttachmentRepository.findByFileNameIn(fileNames);
        for (MessageAttachment attachment : attachments) {
            if (attachment.getMessageId() == null) {
                attachment.setMessageId(messageId);
                messageAttachmentRepository.save(attachment);
                log.info("附件关联成功: fileName={}, messageId={}", attachment.getFileName(), messageId);
        } else {
                log.warn("附件已关联到其他消息: fileName={}, currentMessageId={}", 
                        attachment.getFileName(), attachment.getMessageId());
            }
        }
    }
} 