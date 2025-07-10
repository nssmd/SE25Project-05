package com.aiplatform.service;

import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.repository.MessageAttachmentRepository;
import com.aiplatform.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileUploadService {

    private final MessageAttachmentRepository attachmentRepository;

    @Value("${file.upload.path:./uploads}")
    private String uploadPath;

    @Value("${file.upload.max-size:50MB}")
    private String maxFileSize;

    // 支持的图片类型
    private static final List<String> SUPPORTED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp"
    );

    // 最大文件大小 (50MB)
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    /**
     * 上传文件并创建附件记录
     */
    public MessageAttachment uploadFile(MultipartFile file, Long messageId) throws IOException {
        if (file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }

        // 验证文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("文件大小不能超过50MB");
        }

        // 验证文件类型
        String mimeType = file.getContentType();
        if (mimeType == null) {
            throw new BusinessException("无法确定文件类型");
        }

        MessageAttachment.AttachmentType attachmentType = determineAttachmentType(mimeType);
        
        // 如果是图片，验证是否支持
        if (attachmentType == MessageAttachment.AttachmentType.IMAGE && 
            !SUPPORTED_IMAGE_TYPES.contains(mimeType)) {
            throw new BusinessException("不支持的图片格式，支持：JPEG, PNG, GIF, WebP, BMP");
        }

        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String fileName = generateUniqueFileName(extension);

        // 创建上传目录
        Path uploadDir = createUploadDirectory();
        
        // 保存文件
        Path filePath = uploadDir.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("文件上传成功: {} -> {}", originalFilename, fileName);

        // 获取图片尺寸（如果是图片）
        Integer width = null, height = null;
        if (attachmentType == MessageAttachment.AttachmentType.IMAGE) {
            try {
                BufferedImage image = ImageIO.read(filePath.toFile());
                if (image != null) {
                    width = image.getWidth();
                    height = image.getHeight();
                }
            } catch (Exception e) {
                log.warn("获取图片尺寸失败: {}", e.getMessage());
            }
        }

        // 创建附件记录
        MessageAttachment attachment = MessageAttachment.builder()
                .messageId(messageId)
                .fileName(fileName)
                .originalName(originalFilename)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .mimeType(mimeType)
                .attachmentType(attachmentType)
                .width(width)
                .height(height)
                .build();

        return attachmentRepository.save(attachment);
    }

    /**
     * 获取文件信息
     */
    public MessageAttachment getFileInfo(String fileName) {
        MessageAttachment attachment = attachmentRepository.findByFileName(fileName);
        if (attachment == null) {
            throw new BusinessException("文件不存在");
        }
        return attachment;
    }

    /**
     * 将图片转换为Base64编码（用于AI API）
     */
    public String imageToBase64(String fileName) throws IOException {
        MessageAttachment attachment = attachmentRepository.findByFileName(fileName);
        if (attachment == null || !attachment.isImage()) {
            throw new BusinessException("图片文件不存在");
        }

        Path filePath = Paths.get(attachment.getFilePath());
        if (!Files.exists(filePath)) {
            throw new BusinessException("物理文件不存在");
        }

        byte[] fileBytes = Files.readAllBytes(filePath);
        return Base64.getEncoder().encodeToString(fileBytes);
    }

    /**
     * 获取文件内容（用于文件下载）
     */
    public byte[] getFileContent(String fileName) throws IOException {
        MessageAttachment attachment = attachmentRepository.findByFileName(fileName);
        if (attachment == null) {
            throw new BusinessException("文件不存在");
        }

        Path filePath = Paths.get(attachment.getFilePath());
        if (!Files.exists(filePath)) {
            throw new BusinessException("物理文件不存在");
        }

        return Files.readAllBytes(filePath);
    }

    /**
     * 删除文件
     */
    public void deleteFile(String fileName) throws IOException {
        MessageAttachment attachment = attachmentRepository.findByFileName(fileName);
        if (attachment == null) {
            return; // 文件不存在，无需删除
        }

        // 删除物理文件
        Path filePath = Paths.get(attachment.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
            log.info("物理文件删除成功: {}", filePath);
        }

        // 删除数据库记录
        attachmentRepository.delete(attachment);
        log.info("附件记录删除成功: {}", fileName);
    }

    /**
     * 清理孤立文件
     */
    public void cleanOrphanedFiles() {
        List<MessageAttachment> orphaned = attachmentRepository.findOrphanedAttachments();
        for (MessageAttachment attachment : orphaned) {
            try {
                deleteFile(attachment.getFileName());
                log.info("清理孤立文件: {}", attachment.getFileName());
            } catch (IOException e) {
                log.error("清理孤立文件失败: {}", attachment.getFileName(), e);
            }
        }
    }

    // 私有方法

    private MessageAttachment.AttachmentType determineAttachmentType(String mimeType) {
        if (mimeType.startsWith("image/")) {
            return MessageAttachment.AttachmentType.IMAGE;
        } else if (mimeType.startsWith("audio/")) {
            return MessageAttachment.AttachmentType.AUDIO;
        } else if (mimeType.startsWith("video/")) {
            return MessageAttachment.AttachmentType.VIDEO;
        } else if (mimeType.contains("pdf") || mimeType.contains("document") || mimeType.contains("text")) {
            return MessageAttachment.AttachmentType.DOCUMENT;
        } else {
            return MessageAttachment.AttachmentType.OTHER;
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    private String generateUniqueFileName(String extension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return timestamp + "_" + uuid + extension;
    }

    private Path createUploadDirectory() throws IOException {
        // 按日期创建子目录
        String dateDir = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path uploadDir = Paths.get(uploadPath, dateDir);
        
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
            log.info("创建上传目录: {}", uploadDir);
        }
        
        return uploadDir;
    }
} 