package com.aiplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "auto_cleanup_enabled", nullable = false)
    private Boolean autoCleanupEnabled = false;

    @Column(name = "retention_days", nullable = false)
    private Integer retentionDays = 30;

    @Column(name = "max_chats", nullable = false)
    private Integer maxChats = 100;

    @Column(name = "protected_limit", nullable = false)
    private Integer protectedLimit = 10;

    @Enumerated(EnumType.STRING)
    @Column(name = "cleanup_frequency", nullable = false)
    private CleanupFrequency cleanupFrequency = CleanupFrequency.weekly;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 清理频率枚举 - 匹配数据库enum('daily','weekly','monthly')
    public enum CleanupFrequency {
        daily("每日"),
        weekly("每周"),
        monthly("每月");

        private final String displayName;

        CleanupFrequency(String displayName) {
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
    public boolean isAutoCleanupEnabled() {
        return autoCleanupEnabled;
    }

    public boolean belongsToUser(Long userId) {
        return this.userId != null && this.userId.equals(userId);
    }

    public boolean isWithinChatLimit(int currentChatCount) {
        return currentChatCount <= maxChats;
    }

    public boolean canProtectMoreChats(int currentProtectedCount) {
        return currentProtectedCount < protectedLimit;
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
} 