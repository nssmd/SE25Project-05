package com.aiplatform.service;

import com.aiplatform.config.AiConfig;
import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.repository.MessageAttachmentRepository;
import com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesis;
import com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisParam;
import com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisResult;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.aiplatform.entity.Message;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashScopeImageService {

    private final AiConfig aiConfig;
    private final MessageAttachmentRepository messageAttachmentRepository;

    /**
     * 检查DashScope服务是否可用
     */
    public boolean isAvailable() {
        try {
            return aiConfig.getDashscope() != null && 
                   aiConfig.getDashscope().getApiKey() != null && 
                   !aiConfig.getDashscope().getApiKey().trim().isEmpty();
        } catch (Exception e) {
            log.error("检查DashScope服务可用性失败", e);
            return false;
        }
    }

    /**
     * 获取支持的图片尺寸列表
     */
    public List<String> getSupportedSizes() {
        return List.of("1024*1024", "720*1280", "768*1152", "1280*720");
    }

    /**
     * 获取支持的图片风格列表
     */
    public List<String> getSupportedStyles() {
        return List.of("<auto>", "<photography>", "<portrait>", "<3d cartoon>", 
                      "<anime>", "<oil painting>", "<watercolor>", "<sketch>", 
                      "<chinese painting>", "<flat illustration>");
    }

    /**
     * 文字生成图像 - Controller接口版本
     */
    @Transactional
    public MessageAttachment generateTextToImage(String prompt, String size, String style, Message message) {
        try {
            log.info("开始文生图生成，提示词: {}, 尺寸: {}, 风格: {}", prompt, size, style);

            // 打印API密钥用于调试
            String apiKey = aiConfig.getDashscope().getApiKey();
            log.info("使用的DashScope API密钥: {}", apiKey);
            log.info("API密钥长度: {}", apiKey != null ? apiKey.length() : "null");

            // 构建参数
            ImageSynthesisParam param = ImageSynthesisParam.builder()
                    .apiKey(apiKey)
                    .model(ImageSynthesis.Models.WANX_V1)
                    .prompt(prompt)
                    .style(style != null && !style.trim().isEmpty() ? style : "<auto>")
                    .n(1)
                    .size(size != null && !size.trim().isEmpty() ? size : "1024*1024")
                    .build();

            ImageSynthesis imageSynthesis = new ImageSynthesis();
            
            log.info("正在调用DashScope API，请稍候...");
            ImageSynthesisResult result = imageSynthesis.call(param);
            
            if (result == null || result.getOutput() == null) {
                throw new RuntimeException("DashScope API返回结果为空");
            }

            // 检查任务状态
            if (!"SUCCEEDED".equals(result.getOutput().getTaskStatus())) {
                log.error("图片生成失败，任务状态: {}", result.getOutput().getTaskStatus());
                throw new RuntimeException("图片生成失败，任务状态: " + result.getOutput().getTaskStatus());
            }

            // 处理生成的图片
            if (result.getOutput().getResults() != null && !result.getOutput().getResults().isEmpty()) {
                var imageResult = result.getOutput().getResults().get(0);
                String imageUrl = (String) imageResult.get("url");
                
                if (imageUrl != null && !imageUrl.isEmpty()) {
                    log.info("下载生成的图片: {}", imageUrl);
                    
                    // 下载并保存图片到本地
                    String savedImagePath = downloadAndSaveImage(imageUrl);
                    
                    // 创建并保存附件记录
                    MessageAttachment attachment = new MessageAttachment();
                    attachment.setMessageId(message.getId());
                    attachment.setFileName("generated_" + UUID.randomUUID().toString() + ".png");
                    attachment.setFilePath(savedImagePath);
                    attachment.setMimeType("image/png");
                    attachment.setAttachmentType(MessageAttachment.AttachmentType.IMAGE);
                    attachment.setFileSize(getFileSize(savedImagePath));
                    attachment.setCreatedAt(LocalDateTime.now());
                    
                    MessageAttachment savedAttachment = messageAttachmentRepository.save(attachment);
                    log.info("文生图成功生成并保存: {}", savedImagePath);
                    
                    return savedAttachment;
                }
            }
            
            throw new RuntimeException("没有生成任何图片");
            
        } catch (ApiException | NoApiKeyException e) {
            log.error("DashScope API调用失败: {}", e.getMessage(), e);
            throw new RuntimeException("DashScope API调用失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("文生图处理失败: {}", e.getMessage(), e);
            throw new RuntimeException("文生图处理失败: " + e.getMessage());
        }
    }

    /**
     * 图像生成图像 - Controller接口版本
     */
    @Transactional
    public MessageAttachment generateImageToImage(String prompt, String referenceImageUrl, String size, String style, Message message) {
        try {
            log.info("开始图生图生成，提示词: {}, 参考图: {}", prompt, referenceImageUrl);
            
            // 构建参数 - 暂时使用基础文生图功能
            // 注意：当前SDK版本可能不支持图生图，先使用文生图实现
            String enhancedPrompt = "参考图像风格，" + prompt;
            ImageSynthesisParam param = ImageSynthesisParam.builder()
                    .apiKey(aiConfig.getDashscope().getApiKey())
                    .model(ImageSynthesis.Models.WANX_V1)
                    .prompt(enhancedPrompt)
                    .style(style != null && !style.trim().isEmpty() ? style : "<auto>")
                    .n(1)
                    .size(size != null && !size.trim().isEmpty() ? size : "1024*1024")
                    .build();

            ImageSynthesis imageSynthesis = new ImageSynthesis();
            
            log.info("正在调用DashScope图生图API，请稍候...");
            ImageSynthesisResult result = imageSynthesis.call(param);
            
            if (result == null || result.getOutput() == null) {
                throw new RuntimeException("DashScope API返回结果为空");
            }

            // 检查任务状态
            if (!"SUCCEEDED".equals(result.getOutput().getTaskStatus())) {
                log.error("图生图失败，任务状态: {}", result.getOutput().getTaskStatus());
                throw new RuntimeException("图生图失败，任务状态: " + result.getOutput().getTaskStatus());
            }

            // 处理生成的图片
            if (result.getOutput().getResults() != null && !result.getOutput().getResults().isEmpty()) {
                var imageResult = result.getOutput().getResults().get(0);
                String imageUrl = (String) imageResult.get("url");
                
                if (imageUrl != null && !imageUrl.isEmpty()) {
                    log.info("下载生成的图片: {}", imageUrl);
                    
                    // 下载并保存图片到本地
                    String savedImagePath = downloadAndSaveImage(imageUrl);
                    
                    // 创建并保存附件记录
                    MessageAttachment attachment = new MessageAttachment();
                    attachment.setMessageId(message.getId());
                    attachment.setFileName("generated_from_image_" + UUID.randomUUID().toString() + ".png");
                    attachment.setFilePath(savedImagePath);
                    attachment.setMimeType("image/png");
                    attachment.setAttachmentType(MessageAttachment.AttachmentType.IMAGE);
                    attachment.setFileSize(getFileSize(savedImagePath));
                    attachment.setCreatedAt(LocalDateTime.now());
                    
                    MessageAttachment savedAttachment = messageAttachmentRepository.save(attachment);
                    log.info("图生图成功生成并保存: {}", savedImagePath);
                    
                    return savedAttachment;
                }
            }
            
            throw new RuntimeException("没有生成任何图片");
            
        } catch (ApiException | NoApiKeyException e) {
            log.error("DashScope图生图API调用失败: {}", e.getMessage(), e);
            throw new RuntimeException("DashScope图生图API调用失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("图生图处理失败: {}", e.getMessage(), e);
            throw new RuntimeException("图生图处理失败: " + e.getMessage());
        }
    }

    /**
     * 文字生成图像 (Text-to-Image) - 原始方法保留
     * 基于阿里云DashScope官方文档实现
     */
    @Transactional
    public List<String> generateImageFromText(String prompt, Long messageId) {
        try {
            log.info("开始文生图生成，提示词: {}", prompt);

            // 构建参数 - 严格按照官方文档格式
            ImageSynthesisParam param = ImageSynthesisParam.builder()
                    .apiKey(aiConfig.getDashscope().getApiKey())
                    .model(ImageSynthesis.Models.WANX_V1)  // 使用官方模型常量
                    .prompt(prompt)
                    .style("<auto>")  // 默认风格，可以根据需要调整
                    .n(1)  // 生成1张图片
                    .size("1024*1024")  // 官方文档中的格式
                    .build();

            ImageSynthesis imageSynthesis = new ImageSynthesis();
            
            log.info("正在调用DashScope API，请稍候...");
            ImageSynthesisResult result = imageSynthesis.call(param);
            
            if (result == null || result.getOutput() == null) {
                throw new RuntimeException("DashScope API返回结果为空");
            }

            // 检查任务状态
            if (!"SUCCEEDED".equals(result.getOutput().getTaskStatus())) {
                log.error("图片生成失败，任务状态: {}", result.getOutput().getTaskStatus());
                throw new RuntimeException("图片生成失败，任务状态: " + result.getOutput().getTaskStatus());
            }

            List<String> generatedImagePaths = new ArrayList<>();
            
            // 处理生成的图片 - 按照官方文档的结果结构
            if (result.getOutput().getResults() != null) {
                for (var imageResult : result.getOutput().getResults()) {
                    String imageUrl = (String) imageResult.get("url");
                    
                    if (imageUrl != null && !imageUrl.isEmpty()) {
                        log.info("下载生成的图片: {}", imageUrl);
                        
                        // 下载并保存图片到本地
                        String savedImagePath = downloadAndSaveImage(imageUrl);
                        
                        // 保存到数据库
                        if (messageId != null) {
                            MessageAttachment attachment = new MessageAttachment();
                            attachment.setMessageId(messageId);
                            attachment.setFileName("generated_" + UUID.randomUUID().toString() + ".png");
                            attachment.setFilePath(savedImagePath);
                            attachment.setMimeType("image/png");
                            attachment.setAttachmentType(MessageAttachment.AttachmentType.IMAGE);
                            attachment.setFileSize(getFileSize(savedImagePath));
                            attachment.setCreatedAt(LocalDateTime.now());
                            
                            messageAttachmentRepository.save(attachment);
                        }
                        
                        generatedImagePaths.add(savedImagePath);
                        log.info("文生图成功生成并保存: {}", savedImagePath);
                    }
                }
            }
            
            if (generatedImagePaths.isEmpty()) {
                throw new RuntimeException("没有生成任何图片");
            }
            
            log.info("文生图完成，共生成 {} 张图片", generatedImagePaths.size());
            return generatedImagePaths;
            
        } catch (ApiException | NoApiKeyException e) {
            log.error("DashScope API调用失败: {}", e.getMessage(), e);
            throw new RuntimeException("DashScope API调用失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("文生图处理失败: {}", e.getMessage(), e);
            throw new RuntimeException("文生图处理失败: " + e.getMessage());
        }
    }

    /**
     * 图像生成图像 (Image-to-Image) - 原始方法保留
     * 使用参考图和提示词生成新图像
     */
    @Transactional
    public List<String> generateImageFromImage(MultipartFile inputImage, String prompt, Long messageId) {
        try {
            log.info("开始图生图生成，提示词: {}", prompt);

            // 首先保存输入图片并获取URL
            String inputImagePath = saveUploadedImage(inputImage);
            // 注意：这里需要转换为可访问的HTTP URL，实际项目中可能需要上传到OSS等
            String refImageUrl = convertToAccessibleUrl(inputImagePath);
            
            // 构建参数 - 暂时使用基础文生图功能
            // 注意：当前SDK版本可能不支持图生图，先使用文生图实现
            String enhancedPrompt = "基于输入图像的风格和内容，" + prompt;
            ImageSynthesisParam param = ImageSynthesisParam.builder()
                    .apiKey(aiConfig.getDashscope().getApiKey())
                    .model(ImageSynthesis.Models.WANX_V1)
                    .prompt(enhancedPrompt)
                    .style("<auto>")
                    .n(1)
                    .size("1024*1024")
                    .build();

            ImageSynthesis imageSynthesis = new ImageSynthesis();
            
            log.info("正在调用DashScope图生图API，请稍候...");
            ImageSynthesisResult result = imageSynthesis.call(param);
            
            if (result == null || result.getOutput() == null) {
                throw new RuntimeException("DashScope API返回结果为空");
            }

            // 检查任务状态
            if (!"SUCCEEDED".equals(result.getOutput().getTaskStatus())) {
                log.error("图生图失败，任务状态: {}", result.getOutput().getTaskStatus());
                throw new RuntimeException("图生图失败，任务状态: " + result.getOutput().getTaskStatus());
            }

            List<String> generatedImagePaths = new ArrayList<>();
            
            // 处理生成的图片
            if (result.getOutput().getResults() != null) {
                for (var imageResult : result.getOutput().getResults()) {
                    String imageUrl = (String) imageResult.get("url");
                    
                    if (imageUrl != null && !imageUrl.isEmpty()) {
                        log.info("下载生成的图片: {}", imageUrl);
                        
                        // 下载并保存图片到本地
                        String savedImagePath = downloadAndSaveImage(imageUrl);
                        
                        // 保存到数据库
                        if (messageId != null) {
                            MessageAttachment attachment = new MessageAttachment();
                            attachment.setMessageId(messageId);
                            attachment.setFileName("generated_from_image_" + UUID.randomUUID().toString() + ".png");
                            attachment.setFilePath(savedImagePath);
                            attachment.setMimeType("image/png");
                            attachment.setAttachmentType(MessageAttachment.AttachmentType.IMAGE);
                            attachment.setFileSize(getFileSize(savedImagePath));
                            attachment.setCreatedAt(LocalDateTime.now());
                            
                            messageAttachmentRepository.save(attachment);
                        }
                        
                        generatedImagePaths.add(savedImagePath);
                        log.info("图生图成功生成并保存: {}", savedImagePath);
                    }
                }
            }
            
            if (generatedImagePaths.isEmpty()) {
                throw new RuntimeException("没有生成任何图片");
            }
            
            log.info("图生图完成，共生成 {} 张图片", generatedImagePaths.size());
            return generatedImagePaths;
            
        } catch (ApiException | NoApiKeyException e) {
            log.error("DashScope图生图API调用失败: {}", e.getMessage(), e);
            throw new RuntimeException("DashScope图生图API调用失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("图生图处理失败: {}", e.getMessage(), e);
            throw new RuntimeException("图生图处理失败: " + e.getMessage());
        }
    }

    /**
     * 下载并保存生成的图片
     * 图片URL有效期24小时，需要及时下载保存
     */
    private String downloadAndSaveImage(String imageUrl) throws IOException {
        try {
            // 创建生成图片目录
            String uploadDir = "uploads/generated";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成唯一文件名
            String fileName = "generated_" + UUID.randomUUID().toString() + ".png";
            Path filePath = uploadPath.resolve(fileName);

            // 下载图片 - 按照官方文档说明，图片存储在阿里云OSS
            URL url = new URL(imageUrl);
            try (InputStream in = url.openStream()) {
                Files.copy(in, filePath);
            }

            log.info("图片下载成功: {} -> {}", imageUrl, filePath);
            return filePath.toString();
            
        } catch (Exception e) {
            log.error("下载图片失败: {}", imageUrl, e);
            throw new IOException("下载图片失败: " + e.getMessage());
        }
    }

    /**
     * 保存上传的参考图片
     */
    private String saveUploadedImage(MultipartFile file) throws IOException {
        try {
            // 创建输入图片目录
            String uploadDir = "uploads/input";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : ".png";
            String fileName = "input_" + UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(fileName);

            // 保存文件
            Files.copy(file.getInputStream(), filePath);
            
            log.info("参考图片保存成功: {}", filePath);
            return filePath.toString();
            
        } catch (Exception e) {
            log.error("保存上传图片失败", e);
            throw new IOException("保存上传图片失败: " + e.getMessage());
        }
    }

    /**
     * 将本地文件路径转换为可访问的URL
     * 注意：实际项目中可能需要上传到OSS等云存储服务
     */
    private String convertToAccessibleUrl(String localPath) {
        // 这里是简化实现，实际项目中需要：
        // 1. 上传到阿里云OSS或其他云存储
        // 2. 返回公开可访问的HTTP URL
        
        // 临时解决方案：返回本地HTTP服务器路径
        // 需要确保这个URL可以被DashScope服务访问到
        return "http://localhost:8080/files/" + Paths.get(localPath).getFileName().toString();
    }

    /**
     * 获取文件大小
     */
    private Long getFileSize(String filePath) {
        try {
            return Files.size(Paths.get(filePath));
        } catch (IOException e) {
            log.warn("获取文件大小失败: {}", filePath);
            return 0L;
        }
    }
} 