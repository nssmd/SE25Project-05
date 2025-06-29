package com.aiplatform.repository;

import com.aiplatform.entity.AdminMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminMessageRepository extends JpaRepository<AdminMessage, Long> {

    // 查找发送给特定用户的消息
    Page<AdminMessage> findByToUserIdOrderByCreatedAtDesc(Long toUserId, Pageable pageable);

    // 查找特定用户发送的消息
    Page<AdminMessage> findByFromUserIdOrderByCreatedAtDesc(Long fromUserId, Pageable pageable);

    // 查找未读消息
    Page<AdminMessage> findByToUserIdAndIsReadFalseOrderByCreatedAtDesc(Long toUserId, Pageable pageable);

    // 查找广播消息
    Page<AdminMessage> findByMessageTypeOrderByCreatedAtDesc(AdminMessage.MessageType messageType, Pageable pageable);

    // 统计未读消息数量
    int countByToUserIdAndIsReadFalse(Long toUserId);

    // 查找用户相关的所有消息（发送或接收）
    @Query("SELECT m FROM AdminMessage m WHERE m.toUserId = :userId OR m.fromUserId = :userId ORDER BY m.createdAt DESC")
    Page<AdminMessage> findUserRelatedMessages(@Param("userId") Long userId, Pageable pageable);

    // 标记消息为已读
    @Query("UPDATE AdminMessage m SET m.isRead = true WHERE m.id = :messageId AND m.toUserId = :userId")
    int markAsRead(@Param("messageId") Long messageId, @Param("userId") Long userId);

    // 删除用户相关的所有消息
    void deleteByFromUserIdOrToUserId(Long fromUserId, Long toUserId);
    
    // 根据接收者ID和消息类型查询（用于客服对话）
    List<AdminMessage> findByToUserIdAndMessageTypeOrderByCreatedAtAsc(Long toUserId, AdminMessage.MessageType messageType);
    
    // 查询所有发送给指定用户的消息
    @Query("SELECT m FROM AdminMessage m WHERE m.toUserId = :userId ORDER BY m.createdAt DESC")
    Page<AdminMessage> findByRecipientIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
    
    // 查询指定用户和消息类型的对话
    @Query("SELECT m FROM AdminMessage m WHERE m.toUserId = :userId AND m.messageType = :messageType ORDER BY m.createdAt ASC")
    List<AdminMessage> findByRecipientIdAndMessageTypeOrderByCreatedAtAsc(@Param("userId") Long userId, @Param("messageType") AdminMessage.MessageType messageType);
} 