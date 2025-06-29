package com.aiplatform.repository;

import com.aiplatform.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // 根据聊天ID查找消息
    Page<Message> findByChatIdOrderByCreatedAtAsc(Long chatId, Pageable pageable);
    
    List<Message> findByChatIdOrderByCreatedAtAsc(Long chatId);

    // 根据聊天ID和角色查找消息
    List<Message> findByChatIdAndRoleOrderByCreatedAtAsc(Long chatId, Message.MessageRole role);

    // 统计聊天消息数量
    int countByChatId(Long chatId);

    // 统计不同角色的消息数量
    int countByChatIdAndRole(Long chatId, Message.MessageRole role);

    // 查找最新的消息
    @Query("SELECT m FROM Message m WHERE m.chatId = :chatId ORDER BY m.createdAt DESC")
    List<Message> findLatestMessagesByChat(@Param("chatId") Long chatId, Pageable pageable);

    // 搜索消息内容
    @Query("SELECT m FROM Message m WHERE m.chatId = :chatId AND m.content LIKE %:content% ORDER BY m.createdAt ASC")
    Page<Message> findByChatIdAndContentContaining(@Param("chatId") Long chatId, @Param("content") String content, Pageable pageable);

    // 根据时间范围查找消息
    @Query("SELECT m FROM Message m WHERE m.chatId = :chatId AND m.createdAt BETWEEN :startDate AND :endDate ORDER BY m.createdAt ASC")
    List<Message> findByChatIdAndDateRange(@Param("chatId") Long chatId, 
                                          @Param("startDate") LocalDateTime startDate, 
                                          @Param("endDate") LocalDateTime endDate);

    // 删除聊天的所有消息
    void deleteByChatId(Long chatId);

    // 查找系统消息
    @Query("SELECT m FROM Message m WHERE m.role = 'system' ORDER BY m.createdAt DESC")
    Page<Message> findSystemMessages(Pageable pageable);

    // 统计今日消息数量
    @Query("SELECT COUNT(m) FROM Message m WHERE m.createdAt >= :startOfDay")
    long countTodayMessages(@Param("startOfDay") LocalDateTime startOfDay);

    // 统计聊天中用户消息数量
    @Query("SELECT COUNT(m) FROM Message m WHERE m.chatId = :chatId AND m.role = 'user'")
    int countUserMessagesByChat(@Param("chatId") Long chatId);

    // 统计聊天中助手消息数量
    @Query("SELECT COUNT(m) FROM Message m WHERE m.chatId = :chatId AND m.role = 'assistant'")
    int countAssistantMessagesByChat(@Param("chatId") Long chatId);

    // 统计用户的所有消息数量
    @Query("SELECT COUNT(m) FROM Message m INNER JOIN Chat c ON m.chatId = c.id WHERE c.userId = :userId")
    int countByUserId(@Param("userId") Long userId);
} 