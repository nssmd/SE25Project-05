package com.aiplatform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_chats")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportChat extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "support_id")
    private Long supportId; // 客服人员ID，可以为null表示未分配

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false)
    private SenderType senderType;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 发送者类型枚举
    public enum SenderType {
        USER("用户"),
        SUPPORT("客服");

        private final String displayName;

        SenderType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // 设置创建和更新时间
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 业务方法
    public boolean belongsToUser(Long userId) {
        return this.userId != null && this.userId.equals(userId);
    }

    public boolean belongsToSupport(Long supportId) {
        return this.supportId != null && this.supportId.equals(supportId);
    }

    public boolean isFromUser() {
        return SenderType.USER.equals(this.senderType);
    }

    public boolean isFromSupport() {
        return SenderType.SUPPORT.equals(this.senderType);
    }
} 