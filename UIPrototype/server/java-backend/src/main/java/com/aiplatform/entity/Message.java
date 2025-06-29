package com.aiplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id", nullable = false)
    private Long chatId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private MessageRole role;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "metadata", columnDefinition = "json")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // 消息角色枚举 - 匹配数据库enum('user','assistant','system')
    public enum MessageRole {
        user("用户"),
        assistant("AI助手"),
        system("系统");

        private final String displayName;

        MessageRole(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // 关联聊天会话
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", insertable = false, updatable = false)
    @JsonIgnore
    private Chat chat;

    // 业务方法
    public boolean isUserMessage() {
        return role == MessageRole.user;
    }

    public boolean isAssistantMessage() {
        return role == MessageRole.assistant;
    }

    public boolean isSystemMessage() {
        return role == MessageRole.system;
    }

    public String getPreview(int maxLength) {
        if (content == null || content.trim().isEmpty()) {
            return "";
        }
        String cleanContent = content.trim();
        if (cleanContent.length() <= maxLength) {
            return cleanContent;
        }
        return cleanContent.substring(0, maxLength) + "...";
    }

    public boolean belongsToChat(Long chatId) {
        return this.chatId != null && this.chatId.equals(chatId);
    }

    // 设置创建时间
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 