package com.aiplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_user_id", nullable = false)
    private Long fromUserId;

    @Column(name = "to_user_id")
    private Long toUserId;

    @Convert(converter = MessageTypeConverter.class)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType = MessageType.PRIVATE;

    @Column(name = "subject", length = 255)
    private String subject;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // 消息类型枚举 - 匹配数据库enum('private','broadcast','support')
    public enum MessageType {
        PRIVATE("私信", "private"),
        BROADCAST("广播", "broadcast"),
        SUPPORT("客服", "support");

        private final String displayName;
        private final String databaseValue;

        MessageType(String displayName, String databaseValue) {
            this.displayName = displayName;
            this.databaseValue = databaseValue;
        }

        public String getDisplayName() {
            return displayName;
        }

        @JsonValue
        public String getDatabaseValue() {
            return databaseValue;
        }

        // JPA会使用这个方法来转换
        @Override
        public String toString() {
            return databaseValue;
        }
    }

    // 关联发送用户
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User fromUser;

    // 关联接收用户
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User toUser;

    // 业务方法
    public boolean isPrivateMessage() {
        return messageType == MessageType.PRIVATE;
    }

    public boolean isBroadcast() {
        return messageType == MessageType.BROADCAST;
    }

    public boolean isUnread() {
        return !isRead;
    }

    public void markAsRead() {
        this.isRead = true;
    }

    public boolean belongsToUser(Long userId) {
        return (toUserId != null && toUserId.equals(userId)) || 
               (fromUserId != null && fromUserId.equals(userId));
    }

    // 设置创建时间
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 