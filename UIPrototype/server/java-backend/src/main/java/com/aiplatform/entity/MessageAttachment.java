package com.aiplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "message_attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", nullable = true)
    private Long messageId;

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(name = "file_path", length = 500, nullable = false)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "mime_type", length = 100, nullable = false)
    private String mimeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "attachment_type", nullable = false)
    private AttachmentType attachmentType;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // 附件类型枚举
    public enum AttachmentType {
        IMAGE("图片"),
        DOCUMENT("文档"),
        AUDIO("音频"),
        VIDEO("视频"),
        OTHER("其他");

        private final String displayName;

        AttachmentType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // 关联消息 - 移除双向关联以避免序列化问题
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "message_id", insertable = false, updatable = false)
    // @JsonIgnore
    // private Message message;

    // 业务方法 - 添加JsonProperty注解确保序列化
    @com.fasterxml.jackson.annotation.JsonProperty("isImage")
    public boolean isImage() {
        return attachmentType == AttachmentType.IMAGE;
    }

    public String getFileUrl() {
        // 返回可访问的文件URL
        return "/api/files/" + fileName;
    }

    public String getFileSizeFormatted() {
        if (fileSize == null) return "未知";
        
        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        }
    }

    public String getDimensions() {
        if (width != null && height != null) {
            return width + "×" + height;
        }
        return null;
    }

    // 设置创建时间
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 