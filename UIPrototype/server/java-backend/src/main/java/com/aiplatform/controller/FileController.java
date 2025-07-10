package com.aiplatform.controller;

import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.service.FileUploadService;
import com.aiplatform.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileUploadService fileUploadService;

    /**
     * 上传文件
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('user') or hasRole('admin')")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "messageId", required = false) Long messageId) {
        
        try {
            log.info("接收文件上传请求: {}, messageId: {}", file.getOriginalFilename(), messageId);
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("文件不能为空"));
            }

            MessageAttachment attachment = fileUploadService.uploadFile(file, messageId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "文件上传成功");
            
            // 添加前端期望的字段到根级别
            response.put("fileId", attachment.getId());
            response.put("fileUrl", attachment.getFileUrl());
            
            // 创建附件数据Map
            Map<String, Object> attachmentData = new HashMap<>();
            attachmentData.put("id", attachment.getId());
            attachmentData.put("fileName", attachment.getFileName());
            attachmentData.put("originalName", attachment.getOriginalName());
            attachmentData.put("fileSize", attachment.getFileSize());
            attachmentData.put("fileSizeFormatted", attachment.getFileSizeFormatted());
            attachmentData.put("mimeType", attachment.getMimeType());
            attachmentData.put("attachmentType", attachment.getAttachmentType());
            attachmentData.put("width", attachment.getWidth());
            attachmentData.put("height", attachment.getHeight());
            attachmentData.put("dimensions", attachment.getDimensions());
            attachmentData.put("fileUrl", attachment.getFileUrl());
            attachmentData.put("isImage", attachment.isImage());
            attachmentData.put("createdAt", attachment.getCreatedAt());
            
            response.put("data", attachmentData);
            
            log.info("文件上传成功: {} -> {}", file.getOriginalFilename(), attachment.getFileName());
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.warn("文件上传业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("文件上传IO异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("文件上传失败：" + e.getMessage()));
        } catch (Exception e) {
            log.error("文件上传未知异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("系统异常，请稍后重试"));
        }
    }

    /**
     * 获取文件内容
     */
    @GetMapping("/{fileName}")
    public ResponseEntity<byte[]> getFile(@PathVariable String fileName) {
        try {
            log.debug("请求文件: {}", fileName);
            
            // 先获取文件信息以确定MIME类型
            MessageAttachment attachment = fileUploadService.getFileInfo(fileName);
            byte[] fileContent = fileUploadService.getFileContent(fileName);
            
            // 根据文件的MIME类型设置Content-Type
            HttpHeaders headers = new HttpHeaders();
            String mimeType = attachment.getMimeType();
            if (mimeType != null && !mimeType.trim().isEmpty()) {
                headers.setContentType(MediaType.parseMediaType(mimeType));
            } else {
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            }
            
            // 对于图片文件，设置为inline显示；其他文件设置为attachment下载
            // 避免中文文件名编码问题，使用系统生成的文件名
            if (attachment.isImage()) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
            } else {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");
            }
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(fileContent);
                
        } catch (BusinessException e) {
            log.warn("获取文件业务异常: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            log.error("获取文件IO异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("获取文件未知异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 删除文件
     */
    @DeleteMapping("/{fileName}")
    @PreAuthorize("hasRole('user') or hasRole('admin')")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String fileName) {
        try {
            log.info("删除文件请求: {}", fileName);
            
            fileUploadService.deleteFile(fileName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "文件删除成功");
            
            log.info("文件删除成功: {}", fileName);
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.warn("删除文件业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("删除文件IO异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("文件删除失败：" + e.getMessage()));
        } catch (Exception e) {
            log.error("删除文件未知异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("系统异常，请稍后重试"));
        }
    }

    /**
     * 获取文件的Base64编码（用于图片预览）
     */
    @GetMapping("/{fileName}/base64")
    @PreAuthorize("hasRole('user') or hasRole('admin')")
    public ResponseEntity<Map<String, Object>> getFileBase64(@PathVariable String fileName) {
        try {
            log.debug("请求文件Base64: {}", fileName);
            
            String base64 = fileUploadService.imageToBase64(fileName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            Map<String, Object> data = new HashMap<>();
            data.put("fileName", fileName);
            data.put("base64", base64);
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.warn("获取文件Base64业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("获取文件Base64 IO异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("获取文件失败：" + e.getMessage()));
        } catch (Exception e) {
            log.error("获取文件Base64未知异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("系统异常，请稍后重试"));
        }
    }

    /**
     * 清理孤立文件（管理员功能）
     */
    @PostMapping("/cleanup")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, Object>> cleanupOrphanedFiles() {
        try {
            log.info("开始清理孤立文件");
            
            fileUploadService.cleanOrphanedFiles();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "孤立文件清理完成");
            
            log.info("孤立文件清理完成");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("清理孤立文件异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("清理失败：" + e.getMessage()));
        }
    }

    // 私有辅助方法
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
} 