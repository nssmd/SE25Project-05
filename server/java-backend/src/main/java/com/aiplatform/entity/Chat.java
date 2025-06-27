package com.aiplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chats")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", length = 500)
    private String title = "新对话";

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_type", nullable = false)
    private AiType aiType = AiType.text_to_text;

    @Column(name = "is_favorite", nullable = false)
    private Boolean isFavorite = false;

    @Column(name = "is_protected", nullable = false)
    private Boolean isProtected = false;

    @Column(name = "message_count", nullable = false)
    private Integer messageCount = 0;

    @Column(name = "last_activity")
    private LocalDateTime lastActivity;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // AI类型枚举 - 匹配数据库enum
    public enum AiType {
        text_to_text("文生文"),
        text_to_image("文生图"),
        image_to_text("图生文"),
        image_to_image("图生图"),
        text_to_3d("文生3D"),
        text_to_video("文生视频");

        private final String displayName;

        AiType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // 关联用户
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User user;

    // 业务方法
    public String getDisplayTitle() {
        if (title != null && !title.trim().isEmpty()) {
            return title;
        }
        return aiType.getDisplayName() + " - " + 
               (createdAt != null ? createdAt.toLocalDate().toString() : "");
    }

    public void incrementMessageCount() {
        this.messageCount++;
        this.lastActivity = LocalDateTime.now();
    }

    public void decrementMessageCount() {
        if (this.messageCount > 0) {
            this.messageCount--;
        }
    }

    public boolean belongsToUser(Long userId) {
        return this.userId != null && this.userId.equals(userId);
    }

    // 设置创建和更新时间
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (lastActivity == null) {
            lastActivity = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 