package com.aiplatform.repository;

import com.aiplatform.entity.SupportChat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportChatRepository extends JpaRepository<SupportChat, Long> {

    // 查找用户的所有对话记录
    List<SupportChat> findByUserIdOrderByCreatedAtAsc(Long userId);

    // 查找用户与特定客服的对话记录
    List<SupportChat> findByUserIdAndSupportIdOrderByCreatedAtAsc(Long userId, Long supportId);

    // 查找客服的所有对话记录
    List<SupportChat> findBySupportIdOrderByCreatedAtDesc(Long supportId);

    // 查找未分配客服的用户消息
    List<SupportChat> findBySupportIdIsNullAndSenderTypeOrderByCreatedAtDesc(SupportChat.SenderType senderType);

    // 统计用户未读消息数量
    int countByUserIdAndSenderTypeAndIsReadFalse(Long userId, SupportChat.SenderType senderType);

    // 统计客服未读消息数量
    int countBySupportIdAndSenderTypeAndIsReadFalse(Long supportId, SupportChat.SenderType senderType);

    // 获取客服工作台的客户列表
    @Query("SELECT sc.userId FROM SupportChat sc WHERE sc.senderType = 'USER' GROUP BY sc.userId ORDER BY MAX(sc.createdAt) DESC")
    List<Long> findDistinctUserIdsOrderByLatestMessage();

    // 获取特定客户的最新对话
    @Query("SELECT sc FROM SupportChat sc WHERE sc.userId = :userId ORDER BY sc.createdAt DESC")
    Page<SupportChat> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    // 获取客户最后一条消息
    @Query("SELECT sc FROM SupportChat sc WHERE sc.userId = :userId ORDER BY sc.createdAt DESC LIMIT 1")
    SupportChat findLatestMessageByUserId(@Param("userId") Long userId);

    // 删除用户的所有对话记录
    void deleteByUserId(Long userId);

    // 删除特定对话记录
    void deleteByUserIdAndSupportId(Long userId, Long supportId);
} 