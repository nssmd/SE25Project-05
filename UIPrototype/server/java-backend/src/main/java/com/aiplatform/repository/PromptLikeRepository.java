package com.aiplatform.repository;

import com.aiplatform.entity.PromptLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromptLikeRepository extends JpaRepository<PromptLike, Long> {

    /**
     * 查找用户对特定模板的点赞记录
     */
    Optional<PromptLike> findByTemplateIdAndUserId(Long templateId, Long userId);

    /**
     * 检查用户是否已点赞
     */
    boolean existsByTemplateIdAndUserId(Long templateId, Long userId);

    /**
     * 统计模板的点赞数
     */
    int countByTemplateId(Long templateId);

    /**
     * 获取用户点赞的模板ID列表
     */
    @Query("SELECT pl.templateId FROM PromptLike pl WHERE pl.userId = :userId")
    List<Long> findTemplateIdsByUserId(@Param("userId") Long userId);

    /**
     * 删除用户对模板的点赞
     */
    void deleteByTemplateIdAndUserId(Long templateId, Long userId);
} 