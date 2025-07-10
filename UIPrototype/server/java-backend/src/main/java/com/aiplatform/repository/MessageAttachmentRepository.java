package com.aiplatform.repository;

import com.aiplatform.entity.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {

    // 根据消息ID查找附件
    List<MessageAttachment> findByMessageIdOrderByCreatedAtAsc(Long messageId);

    // 根据文件名查找附件
    MessageAttachment findByFileName(String fileName);

    // 根据消息ID和附件类型查找
    List<MessageAttachment> findByMessageIdAndAttachmentType(Long messageId, MessageAttachment.AttachmentType attachmentType);

    // 查找图片附件
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.attachmentType = 'IMAGE' ORDER BY ma.createdAt DESC")
    List<MessageAttachment> findAllImageAttachments();

    // 统计消息的附件数量
    int countByMessageId(Long messageId);

    // 统计某种类型的附件数量
    int countByAttachmentType(MessageAttachment.AttachmentType attachmentType);

    // 查找大文件附件
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.fileSize > :minSize ORDER BY ma.fileSize DESC")
    List<MessageAttachment> findLargeFiles(@Param("minSize") Long minSize);

    // 根据时间范围查找附件
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.createdAt BETWEEN :startDate AND :endDate ORDER BY ma.createdAt DESC")
    List<MessageAttachment> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                           @Param("endDate") LocalDateTime endDate);

    // 删除消息的所有附件
    void deleteByMessageId(Long messageId);

    // 查找未关联消息的附件（messageId为null）
    List<MessageAttachment> findByMessageIdIsNull();
    
    // 根据文件名列表查找附件
    List<MessageAttachment> findByFileNameIn(List<String> fileNames);

    // 查找孤立的附件（没有关联消息的或消息不存在的）
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.messageId IS NULL OR ma.messageId NOT IN (SELECT m.id FROM Message m)")
    List<MessageAttachment> findOrphanedAttachments();

    // 统计总文件大小
    @Query("SELECT COALESCE(SUM(ma.fileSize), 0) FROM MessageAttachment ma")
    Long getTotalFileSize();

    // 根据MIME类型查找
    List<MessageAttachment> findByMimeTypeContaining(String mimeType);
} 