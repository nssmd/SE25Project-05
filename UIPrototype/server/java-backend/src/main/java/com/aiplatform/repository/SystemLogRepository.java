package com.aiplatform.repository;

import com.aiplatform.entity.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    // 根据用户ID查找日志
    Page<SystemLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // 根据操作类型查找日志
    Page<SystemLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    // 根据目标类型查找日志
    Page<SystemLog> findByTargetTypeOrderByCreatedAtDesc(String targetType, Pageable pageable);

    // 根据时间范围查找日志
    @Query("SELECT l FROM SystemLog l WHERE l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                   @Param("endDate") LocalDateTime endDate, 
                                   Pageable pageable);

    // 根据用户和时间范围查找日志
    @Query("SELECT l FROM SystemLog l WHERE l.userId = :userId AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findByUserIdAndDateRange(@Param("userId") Long userId,
                                            @Param("startDate") LocalDateTime startDate, 
                                            @Param("endDate") LocalDateTime endDate, 
                                            Pageable pageable);

    // 根据IP地址查找日志
    Page<SystemLog> findByIpAddressOrderByCreatedAtDesc(String ipAddress, Pageable pageable);

    // 统计用户今日操作次数
    @Query("SELECT COUNT(l) FROM SystemLog l WHERE l.userId = :userId AND l.createdAt >= :startOfDay")
    long countUserActionsToday(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay);

    // 统计指定操作的次数
    @Query("SELECT COUNT(l) FROM SystemLog l WHERE l.action = :action AND l.createdAt >= :since")
    long countActionsSince(@Param("action") String action, @Param("since") LocalDateTime since);

    // 查找最近的用户活动
    @Query("SELECT l FROM SystemLog l WHERE l.userId = :userId ORDER BY l.createdAt DESC")
    List<SystemLog> findRecentUserActivity(@Param("userId") Long userId, Pageable pageable);

    // 删除用户的所有日志
    void deleteByUserId(Long userId);

    // 删除指定时间之前的日志
    void deleteByCreatedAtBefore(LocalDateTime cutoffDate);
} 