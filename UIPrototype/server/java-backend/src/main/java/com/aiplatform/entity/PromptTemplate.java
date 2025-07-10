package com.aiplatform.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prompt_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "category"})
public class PromptTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "ai_model", length = 100)
    private String aiModel;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type")
    private TemplateType templateType = TemplateType.USER;

    @Column(name = "creator_id")
    private Long creatorId;

    @Column(name = "creator_name", length = 100)
    private String creatorName;

    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "language", length = 10)
    private String language = "zh-CN";

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level")
    private DifficultyLevel difficultyLevel = DifficultyLevel.BEGINNER;

    @Column(name = "is_public")
    private Boolean isPublic = true;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    @Column(name = "like_count")
    private Integer likeCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 关联查询分类信息
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private PromptCategory category;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TemplateType {
        OFFICIAL, USER
    }

    public enum DifficultyLevel {
        BEGINNER, INTERMEDIATE, ADVANCED
    }
} 