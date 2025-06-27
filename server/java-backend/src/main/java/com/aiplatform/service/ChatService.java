package com.aiplatform.service;

import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.User;
import com.aiplatform.repository.ChatRepository;
import com.aiplatform.repository.MessageRepository;
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

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

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
        chat.setAiType(aiType != null ? aiType : Chat.AiType.text_to_text);
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
        
        return messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
    }

    /**
     * 获取用户的聊天列表
     */
    public Page<Chat> getUserChats(Long userId, Pageable pageable) {
        log.info("获取用户聊天列表: userId={}", userId);
        return chatRepository.findByUserIdOrderByLastActivityDesc(userId, pageable);
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
     * 生成AI回复（临时实现）
     */
    public String generateAIResponse(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "请输入您的问题。";
        }
        
        String message = userMessage.toLowerCase().trim();
        
        if (message.contains("你好") || message.contains("hello")) {
            return "你好！我是AI助手，很高兴为您服务。有什么我可以帮助您的吗？";
        } else if (message.contains("天气")) {
            return "很抱歉，我目前无法获取实时天气信息。您可以查看天气预报应用或网站获取准确的天气信息。";
        } else if (message.contains("时间")) {
            return "当前时间是：" + LocalDateTime.now().toString();
        } else if (message.contains("帮助")) {
            return "我是您的AI助手，可以回答问题、提供建议、协助处理各种任务。请告诉我您需要什么帮助？";
        } else if (message.contains("功能")) {
            return "我目前支持文本对话功能。未来将支持图像生成、图像识别、视频生成等更多AI功能。";
        } else {
            return "我理解您的问题：\"" + userMessage + "\"。这是一个很好的问题！作为AI助手，我会尽力为您提供帮助和回答。请问您还有其他问题吗？";
        }
    }
} 