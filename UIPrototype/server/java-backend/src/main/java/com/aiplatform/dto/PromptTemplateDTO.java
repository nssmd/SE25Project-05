package com.aiplatform.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.aiplatform.entity.PromptTemplate;
import com.aiplatform.entity.PromptCategory;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromptTemplateDTO {
    
    private Long id;
    private String title;
    private String description;
    private String content;
    private Long categoryId;
    private String categoryName;
    private String aiModel;
    private String templateType;
    private Long creatorId;
    private String creatorName;
    private String tags;
    private String language;
    private String difficultyLevel;
    private Boolean isPublic;
    private Boolean isFeatured;
    private Integer usageCount;
    private Integer likeCount;
    private Boolean liked; // 当前用户是否已点赞
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * 从PromptTemplate实体转换为DTO
     */
    public static PromptTemplateDTO fromEntity(PromptTemplate template, PromptCategory category, Boolean liked) {
        return PromptTemplateDTO.builder()
                .id(template.getId())
                .title(template.getTitle())
                .description(template.getDescription())
                .content(template.getContent())
                .categoryId(template.getCategoryId())
                .categoryName(category != null ? category.getName() : "未分类")
                .aiModel(template.getAiModel())
                .templateType(template.getTemplateType().name())
                .creatorId(template.getCreatorId())
                .creatorName(template.getCreatorName())
                .tags(template.getTags())
                .language(template.getLanguage())
                .difficultyLevel(template.getDifficultyLevel().name())
                .isPublic(template.getIsPublic())
                .isFeatured(template.getIsFeatured())
                .usageCount(template.getUsageCount())
                .likeCount(template.getLikeCount())
                .liked(liked)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
    
    /**
     * 从PromptTemplate实体转换为DTO（不检查点赞状态）
     */
    public static PromptTemplateDTO fromEntity(PromptTemplate template, PromptCategory category) {
        return fromEntity(template, category, false);
    }
} 