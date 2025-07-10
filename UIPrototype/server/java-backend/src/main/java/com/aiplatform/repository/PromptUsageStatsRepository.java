package com.aiplatform.repository;

import com.aiplatform.entity.PromptUsageStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromptUsageStatsRepository extends JpaRepository<PromptUsageStats, Long> {

    /**
     * 统计模板使用次数
     */
    int countByTemplateId(Long templateId);

    /**
     * 统计用户使用模板次数
     */
    int countByUserId(Long userId);

    /**
     * 统计时间范围内的使用次数
     */
    int countByTemplateIdAndUsedAtBetween(Long templateId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 获取最受欢迎的模板ID（按使用次数）
     */
    @Query("SELECT pus.templateId, COUNT(pus.templateId) as usageCount " +
           "FROM PromptUsageStats pus " +
           "GROUP BY pus.templateId " +
           "ORDER BY usageCount DESC")
    List<Object[]> findMostUsedTemplates();

    /**
     * 获取用户的使用历史
     */
    List<PromptUsageStats> findByUserIdOrderByUsedAtDesc(Long userId);

    /**
     * 获取最近使用的模板
     */
    @Query("SELECT DISTINCT pus.templateId FROM PromptUsageStats pus " +
           "WHERE pus.userId = :userId " +
           "ORDER BY pus.usedAt DESC")
    List<Long> findRecentlyUsedTemplatesByUser(@Param("userId") Long userId);
} 