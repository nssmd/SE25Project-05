package com.aiplatform.repository;

import com.aiplatform.entity.PromptTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromptTemplateRepository extends JpaRepository<PromptTemplate, Long> {

    /**
     * 根据分类查找公开的模板
     */
    Page<PromptTemplate> findByCategoryIdAndIsPublicTrueOrderByIsFeaturedDescUsageCountDescCreatedAtDesc(
            Long categoryId, Pageable pageable);

    /**
     * 查找所有公开的模板
     */
    Page<PromptTemplate> findByIsPublicTrueOrderByIsFeaturedDescUsageCountDescCreatedAtDesc(Pageable pageable);

    /**
     * 查找精选模板
     */
    List<PromptTemplate> findByIsFeaturedTrueAndIsPublicTrueOrderByUsageCountDescCreatedAtDesc();

    /**
     * 查找官方模板
     */
    Page<PromptTemplate> findByTemplateTypeAndIsPublicTrueOrderByUsageCountDescCreatedAtDesc(
            PromptTemplate.TemplateType templateType, Pageable pageable);

    /**
     * 根据用户ID查找模板
     */
    Page<PromptTemplate> findByCreatorIdOrderByCreatedAtDesc(Long creatorId, Pageable pageable);

    /**
     * 搜索模板（标题、描述、标签）
     */
    @Query("SELECT pt FROM PromptTemplate pt WHERE pt.isPublic = true AND " +
           "(LOWER(pt.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(pt.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(pt.tags) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY pt.isFeatured DESC, pt.usageCount DESC, pt.createdAt DESC")
    Page<PromptTemplate> searchTemplates(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 根据分类和关键词搜索
     */
    @Query("SELECT pt FROM PromptTemplate pt WHERE pt.categoryId = :categoryId AND pt.isPublic = true AND " +
           "(LOWER(pt.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(pt.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(pt.tags) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY pt.isFeatured DESC, pt.usageCount DESC, pt.createdAt DESC")
    Page<PromptTemplate> searchTemplatesByCategory(@Param("categoryId") Long categoryId, 
                                                   @Param("keyword") String keyword, 
                                                   Pageable pageable);

    /**
     * 获取热门模板（按使用次数排序）
     */
    List<PromptTemplate> findTop10ByIsPublicTrueOrderByUsageCountDesc();

    /**
     * 获取最新模板
     */
    List<PromptTemplate> findTop10ByIsPublicTrueOrderByCreatedAtDesc();

    /**
     * 根据AI模型推荐模板
     */
    List<PromptTemplate> findByAiModelAndIsPublicTrueOrderByUsageCountDescCreatedAtDesc(String aiModel);
} 