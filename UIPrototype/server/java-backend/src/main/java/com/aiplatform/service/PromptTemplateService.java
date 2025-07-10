package com.aiplatform.service;

import com.aiplatform.entity.*;
import com.aiplatform.dto.PromptTemplateDTO;
import com.aiplatform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromptTemplateService {

    private final PromptTemplateRepository promptTemplateRepository;
    private final PromptCategoryRepository promptCategoryRepository;
    private final PromptLikeRepository promptLikeRepository;
    private final PromptUsageStatsRepository promptUsageStatsRepository;

    /**
     * 获取所有分类
     */
    public List<PromptCategory> getAllCategories() {
        return promptCategoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    /**
     * 根据分类获取模板
     */
    public Page<PromptTemplate> getTemplatesByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (categoryId == null || categoryId == 0) {
            return promptTemplateRepository.findByIsPublicTrueOrderByIsFeaturedDescUsageCountDescCreatedAtDesc(pageable);
        }
        return promptTemplateRepository.findByCategoryIdAndIsPublicTrueOrderByIsFeaturedDescUsageCountDescCreatedAtDesc(categoryId, pageable);
    }

    /**
     * 获取精选模板
     */
    public List<PromptTemplate> getFeaturedTemplates() {
        return promptTemplateRepository.findByIsFeaturedTrueAndIsPublicTrueOrderByUsageCountDescCreatedAtDesc();
    }

    /**
     * 获取官方模板
     */
    public Page<PromptTemplate> getOfficialTemplates(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return promptTemplateRepository.findByTemplateTypeAndIsPublicTrueOrderByUsageCountDescCreatedAtDesc(
                PromptTemplate.TemplateType.OFFICIAL, pageable);
    }

    /**
     * 获取用户模板
     */
    public Page<PromptTemplate> getUserTemplates(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return promptTemplateRepository.findByTemplateTypeAndIsPublicTrueOrderByUsageCountDescCreatedAtDesc(
                PromptTemplate.TemplateType.USER, pageable);
    }

    /**
     * 搜索模板
     */
    public Page<PromptTemplate> searchTemplates(String keyword, Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (categoryId != null && categoryId > 0) {
            return promptTemplateRepository.searchTemplatesByCategory(categoryId, keyword, pageable);
        }
        return promptTemplateRepository.searchTemplates(keyword, pageable);
    }

    /**
     * 获取模板详情
     */
    public Optional<PromptTemplate> getTemplateById(Long id) {
        return promptTemplateRepository.findById(id);
    }

    /**
     * 创建模板
     */
    @Transactional
    public PromptTemplate createTemplate(PromptTemplate template) {
        log.info("创建模板: {}", template.getTitle());
        return promptTemplateRepository.save(template);
    }

    /**
     * 更新模板
     */
    @Transactional
    public PromptTemplate updateTemplate(Long id, PromptTemplate updatedTemplate) {
        Optional<PromptTemplate> existingTemplate = promptTemplateRepository.findById(id);
        if (existingTemplate.isPresent()) {
            PromptTemplate template = existingTemplate.get();
            template.setTitle(updatedTemplate.getTitle());
            template.setDescription(updatedTemplate.getDescription());
            template.setContent(updatedTemplate.getContent());
            template.setCategoryId(updatedTemplate.getCategoryId());
            template.setAiModel(updatedTemplate.getAiModel());
            template.setTags(updatedTemplate.getTags());
            template.setDifficultyLevel(updatedTemplate.getDifficultyLevel());
            template.setIsPublic(updatedTemplate.getIsPublic());
            
            log.info("更新模板: {}", template.getTitle());
            return promptTemplateRepository.save(template);
        }
        throw new RuntimeException("模板不存在");
    }

    /**
     * 删除模板
     */
    @Transactional
    public void deleteTemplate(Long id) {
        log.info("删除模板: {}", id);
        promptTemplateRepository.deleteById(id);
    }

    /**
     * 点赞/取消点赞模板
     */
    @Transactional
    public boolean toggleLike(Long templateId, Long userId) {
        Optional<PromptLike> existingLike = promptLikeRepository.findByTemplateIdAndUserId(templateId, userId);
        
        if (existingLike.isPresent()) {
            // 取消点赞
            promptLikeRepository.delete(existingLike.get());
            updateLikeCount(templateId);
            log.info("用户 {} 取消点赞模板 {}", userId, templateId);
            return false;
        } else {
            // 点赞
            PromptLike like = new PromptLike();
            like.setTemplateId(templateId);
            like.setUserId(userId);
            promptLikeRepository.save(like);
            updateLikeCount(templateId);
            log.info("用户 {} 点赞模板 {}", userId, templateId);
            return true;
        }
    }

    /**
     * 检查用户是否已点赞
     */
    public boolean isLikedByUser(Long templateId, Long userId) {
        return promptLikeRepository.existsByTemplateIdAndUserId(templateId, userId);
    }

    /**
     * 记录使用统计
     */
    @Transactional
    public void recordUsage(Long templateId, Long userId, String aiModel) {
        PromptUsageStats stats = new PromptUsageStats();
        stats.setTemplateId(templateId);
        stats.setUserId(userId);
        stats.setAiModel(aiModel);
        promptUsageStatsRepository.save(stats);
        
        // 更新使用次数
        updateUsageCount(templateId);
        log.info("记录模板 {} 使用统计, 用户: {}, 模型: {}", templateId, userId, aiModel);
    }

    /**
     * 获取用户收藏的模板
     */
    public List<Long> getUserLikedTemplates(Long userId) {
        return promptLikeRepository.findTemplateIdsByUserId(userId);
    }

    /**
     * 获取热门模板
     */
    public List<PromptTemplate> getPopularTemplates() {
        return promptTemplateRepository.findTop10ByIsPublicTrueOrderByUsageCountDesc();
    }

    /**
     * 获取最新模板
     */
    public List<PromptTemplate> getLatestTemplates() {
        return promptTemplateRepository.findTop10ByIsPublicTrueOrderByCreatedAtDesc();
    }

    /**
     * 根据AI模型推荐模板
     */
    public List<PromptTemplate> getRecommendedTemplates(String aiModel) {
        return promptTemplateRepository.findByAiModelAndIsPublicTrueOrderByUsageCountDescCreatedAtDesc(aiModel);
    }

    /**
     * 更新点赞数
     */
    private void updateLikeCount(Long templateId) {
        Optional<PromptTemplate> template = promptTemplateRepository.findById(templateId);
        if (template.isPresent()) {
            int likeCount = promptLikeRepository.countByTemplateId(templateId);
            PromptTemplate t = template.get();
            t.setLikeCount(likeCount);
            promptTemplateRepository.save(t);
        }
    }

    /**
     * 更新使用次数
     */
    private void updateUsageCount(Long templateId) {
        Optional<PromptTemplate> template = promptTemplateRepository.findById(templateId);
        if (template.isPresent()) {
            int usageCount = promptUsageStatsRepository.countByTemplateId(templateId);
            PromptTemplate t = template.get();
            t.setUsageCount(usageCount);
            promptTemplateRepository.save(t);
        }
    }

    /**
     * 转换模板列表为DTO（包含分类名称和点赞状态）
     */
    public List<PromptTemplateDTO> convertToDTO(List<PromptTemplate> templates, Long userId) {
        // 获取所有分类
        List<PromptCategory> categories = promptCategoryRepository.findAll();
        Map<Long, PromptCategory> categoryMap = categories.stream()
                .collect(Collectors.toMap(PromptCategory::getId, Function.identity()));
        
        // 获取用户点赞的模板ID列表
        List<Long> likedTemplateIds = userId != null ? getUserLikedTemplates(userId) : List.of();
        
        return templates.stream()
                .map(template -> PromptTemplateDTO.fromEntity(
                    template, 
                    categoryMap.get(template.getCategoryId()),
                    likedTemplateIds.contains(template.getId())
                ))
                .collect(Collectors.toList());
    }

    /**
     * 转换模板列表为DTO（不包含点赞状态）
     */
    public List<PromptTemplateDTO> convertToDTO(List<PromptTemplate> templates) {
        return convertToDTO(templates, null);
    }
} 