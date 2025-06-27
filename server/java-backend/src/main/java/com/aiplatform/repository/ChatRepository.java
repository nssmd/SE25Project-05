package com.aiplatform.repository;

import com.aiplatform.entity.Chat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    // 根据用户ID查找聊天
    Page<Chat> findByUserIdOrderByLastActivityDesc(Long userId, Pageable pageable);
    
    List<Chat> findByUserIdOrderByLastActivityDesc(Long userId);

    // 根据用户ID和聊天ID查找
    Optional<Chat> findByIdAndUserId(Long id, Long userId);

    // 查找收藏的聊天
    Page<Chat> findByUserIdAndIsFavoriteTrueOrderByLastActivityDesc(Long userId, Pageable pageable);

    // 查找受保护的聊天
    List<Chat> findByUserIdAndIsProtectedTrue(Long userId);

    // 根据AI类型查找
    Page<Chat> findByUserIdAndAiTypeOrderByLastActivityDesc(Long userId, Chat.AiType aiType, Pageable pageable);

    // 根据标题搜索
    @Query("SELECT c FROM Chat c WHERE c.userId = :userId AND c.title LIKE %:title% ORDER BY c.lastActivity DESC")
    Page<Chat> findByUserIdAndTitleContaining(@Param("userId") Long userId, @Param("title") String title, Pageable pageable);



    // 获取搜索建议（不区分大小写）
    @Query("SELECT c FROM Chat c WHERE c.userId = :userId AND LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY c.lastActivity DESC")
    List<Chat> findTop5ByUserIdAndTitleContainingIgnoreCase(@Param("userId") Long userId, @Param("query") String query, Pageable pageable);
    
    default List<Chat> findTop5ByUserIdAndTitleContainingIgnoreCase(Long userId, String query) {
        return findTop5ByUserIdAndTitleContainingIgnoreCase(userId, query, 
            org.springframework.data.domain.PageRequest.of(0, 5));
    }

    // 通用动态查询方法 - 支持多种条件组合和时间筛选
    @Query("SELECT c FROM Chat c WHERE c.userId = :userId " +
           "AND (:keyword IS NULL OR c.title LIKE %:keyword%) " +
           "AND (:aiType IS NULL OR c.aiType = :aiType) " +
           "AND (:isFavorite IS NULL OR c.isFavorite = :isFavorite) " +
           "AND (:timeFilter IS NULL OR c.lastActivity >= :timeFilter) " +
           "ORDER BY c.lastActivity DESC")
    Page<Chat> findChatsWithFilters(
        @Param("userId") Long userId,
        @Param("keyword") String keyword,
        @Param("aiType") Chat.AiType aiType,
        @Param("isFavorite") Boolean isFavorite,
        @Param("timeFilter") LocalDateTime timeFilter,
        Pageable pageable
    );

    // 统计用户聊天数量
    int countByUserId(Long userId);

    // 统计用户收藏聊天数量
    int countByUserIdAndIsFavoriteTrue(Long userId);

    // 统计用户受保护聊天数量
    int countByUserIdAndIsProtectedTrue(Long userId);

    // 查找需要清理的聊天（非保护且超过保留天数）
    @Query("SELECT c FROM Chat c WHERE c.userId = :userId AND c.isProtected = false AND c.lastActivity < :cutoffDate")
    List<Chat> findChatsToCleanup(@Param("userId") Long userId, @Param("cutoffDate") LocalDateTime cutoffDate);

    // 查找活跃聊天（最近有消息）
    @Query("SELECT c FROM Chat c WHERE c.userId = :userId AND c.lastActivity > :since ORDER BY c.lastActivity DESC")
    List<Chat> findActiveChats(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    // 删除用户的聊天
    void deleteByUserId(Long userId);
} 