package com.aiplatform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;



@Entity
@Table(name = "support_chats")
@Data
@EqualsAndHashCode(callSuper = false)
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