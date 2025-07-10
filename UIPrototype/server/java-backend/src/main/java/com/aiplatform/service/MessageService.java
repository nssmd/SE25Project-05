package com.aiplatform.service;

import com.aiplatform.entity.Message;
import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.repository.MessageRepository;
import com.aiplatform.repository.MessageAttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;

    /**
     * 保存消息
     */
    public Message saveMessage(Message message) {
        if (message.getCreatedAt() == null) {
            message.setCreatedAt(LocalDateTime.now());
        }
        
        log.info("保存消息: chatId={}, role={}, content length={}", 
                message.getChatId(), message.getRole(), 
                message.getContent() != null ? message.getContent().length() : 0);
        
        return messageRepository.save(message);
    }

    /**
     * 根据ID获取消息
     */
    public Message getMessageById(Long messageId) {
        return messageRepository.findById(messageId).orElse(null);
    }

    /**
     * 获取消息的附件列表
     */
    public List<MessageAttachment> getMessageAttachments(Long messageId) {
        return messageAttachmentRepository.findByMessageIdOrderByCreatedAtAsc(messageId);
    }

    /**
     * 为消息添加附件
     */
    public void addAttachmentToMessage(Long messageId, MessageAttachment attachment) {
        attachment.setMessageId(messageId);
        if (attachment.getCreatedAt() == null) {
            attachment.setCreatedAt(LocalDateTime.now());
        }
        
        messageAttachmentRepository.save(attachment);
        log.info("为消息 {} 添加附件: {}", messageId, attachment.getFileName());
    }

    /**
     * 更新消息内容
     */
    public Message updateMessage(Long messageId, String content) {
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message != null) {
            message.setContent(content);
            return messageRepository.save(message);
        }
        return null;
    }

    /**
     * 删除消息
     */
    public void deleteMessage(Long messageId) {
        // 先删除相关附件
        messageAttachmentRepository.deleteByMessageId(messageId);
        // 再删除消息
        messageRepository.deleteById(messageId);
        log.info("删除消息: messageId={}", messageId);
    }

    /**
     * 获取聊天的消息列表
     */
    public List<Message> getChatMessages(Long chatId) {
        return messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
    }
} 