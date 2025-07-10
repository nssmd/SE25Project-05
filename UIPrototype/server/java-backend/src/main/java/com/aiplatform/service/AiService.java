package com.aiplatform.service;

import com.aiplatform.config.AiConfig;
import com.aiplatform.dto.AIRequestDTO;
import com.aiplatform.dto.AIResponseDTO;
import com.aiplatform.entity.AIModel;
import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.repository.MessageAttachmentRepository;
import com.aiplatform.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final AiConfig aiConfig;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final FileUploadService fileUploadService;

    private WebClient getWebClient() {
        return WebClient.builder()
                .baseUrl(aiConfig.getBaseUrl())
                .defaultHeader("Authorization", "Bearer " + aiConfig.getApiKey())
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    /**
     * 智能对话 - 自动判断输入类型（文本或图片）
     */
    public String generateConversationResponse(String prompt, String imageUrl, String model) {
        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            // 包含图片，使用多模态分析
            return analyzeImage(imageUrl, prompt, model);
        } else {
            // 纯文本对话
            return generateText(prompt, model);
        }
    }

    /**
     * 生成文本回复
     */
    public String generateText(String prompt, String model) {
        try {
            log.info("调用AI服务生成文本 - 模型: {}, 提示: {}", model, prompt);
            
            AIRequestDTO request = AIRequestDTO.builder()
                    .model(model != null ? model : "gpt-3.5-turbo")
                    .messages(Arrays.asList(
                            AIRequestDTO.Message.builder()
                                    .role("user")
                                    .content(prompt)
                                    .build()
                    ))
                    .maxTokens(1000)
                    .temperature(0.7)
                    .build();
            
            AIResponseDTO response = getWebClient()
                    .post()
                    .uri("/chat/completions")
                    .body(BodyInserters.fromValue(request))
                    .retrieve()
                    .bodyToMono(AIResponseDTO.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();
            
            if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                String aiResponse = response.getChoices().get(0).getMessage().getContent();
                log.info("AI响应: {}", aiResponse);
                return aiResponse;
            } else {
                log.warn("AI服务返回空响应");
                return "抱歉，AI服务暂时无法响应，请稍后再试。";
            }
            
        } catch (WebClientResponseException e) {
            log.error("AI API调用失败: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "抱歉，AI服务遇到错误：" + e.getMessage();
        } catch (Exception e) {
            log.error("调用AI服务异常: ", e);
            return "抱歉，AI服务暂时不可用，请稍后再试。";
        }
    }

    /**
     * 生成图像
     */
    public String generateImage(String prompt, String model) {
        try {
            log.info("调用AI服务生成图像 - 模型: {}, 提示: {}", model, prompt);
            
            Map<String, Object> request = new HashMap<>();
            request.put("model", model != null ? model : "dall-e-3");
            request.put("prompt", prompt);
            request.put("n", 1);
            request.put("size", "1024x1024");
            request.put("quality", "standard");
            
            AIResponseDTO response = getWebClient()
                    .post()
                    .uri("/images/generations")
                    .body(BodyInserters.fromValue(request))
                    .retrieve()
                    .bodyToMono(AIResponseDTO.class)
                    .timeout(Duration.ofSeconds(60))
                    .block();
            
            if (response != null && response.getData() != null && !response.getData().isEmpty()) {
                String imageUrl = response.getData().get(0).getUrl();
                log.info("图像生成成功: {}", imageUrl);
                return "图像生成成功！\n图像URL: " + imageUrl;
            } else {
                log.warn("AI图像生成返回空响应");
                return "抱歉，图像生成失败，请稍后再试。";
            }
            
        } catch (WebClientResponseException e) {
            log.error("AI图像生成API调用失败: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "抱歉，图像生成服务遇到错误：" + e.getMessage();
        } catch (Exception e) {
            log.error("调用AI图像生成服务异常: ", e);
            return "抱歉，图像生成服务暂时不可用，请稍后再试。";
        }
    }

    /**
     * 分析图像
     */
    public String analyzeImage(String imageUrl, String prompt, String model) {
        try {
            log.info("调用AI服务分析图像 - 模型: {}, 图像: {}", model, imageUrl);
            
            // 如果是本地URL，转换为base64
            String finalImageUrl = imageUrl;
            if (imageUrl.startsWith("http://localhost:8080/api/files/")) {
                try {
                    String fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
                    String base64 = fileUploadService.imageToBase64(fileName);
                    finalImageUrl = "data:image/png;base64," + base64;
                    log.info("图片已转换为base64格式");
                } catch (Exception e) {
                    log.error("转换图片为base64失败: ", e);
                    return "抱歉，图片处理失败，请稍后再试。";
                }
            }
            
            AIRequestDTO.Content textContent = new AIRequestDTO.Content();
            textContent.setType("text");
            textContent.setText(prompt != null ? prompt : "请分析这张图片");
            
            AIRequestDTO.Content imageContent = new AIRequestDTO.Content();
            imageContent.setType("image_url");
            AIRequestDTO.ImageUrl imgUrl = new AIRequestDTO.ImageUrl();
            imgUrl.setUrl(finalImageUrl);
            imgUrl.setDetail("auto");  // 设置详细程度
            imageContent.setImageUrl(imgUrl);
            
            AIRequestDTO request = AIRequestDTO.builder()
                    .model(model != null ? model : "gpt-4-turbo-preview")
                    .messages(Arrays.asList(
                            AIRequestDTO.Message.builder()
                                    .role("user")
                                    .content(Arrays.asList(textContent, imageContent))
                                    .build()
                    ))
                    .maxTokens(1000)
                    .build();
            
            AIResponseDTO response = getWebClient()
                    .post()
                    .uri("/chat/completions")
                    .body(BodyInserters.fromValue(request))
                    .retrieve()
                    .bodyToMono(AIResponseDTO.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();
            
            if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                String analysis = response.getChoices().get(0).getMessage().getContent();
                log.info("图像分析完成: {}", analysis);
                return analysis;
            } else {
                log.warn("AI图像分析返回空响应");
                return "抱歉，图像分析失败，请稍后再试。";
            }
            
        } catch (WebClientResponseException e) {
            log.error("AI图像分析API调用失败: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "抱歉，图像分析服务遇到错误：" + e.getMessage();
        } catch (Exception e) {
            log.error("调用AI图像分析服务异常: ", e);
            return "抱歉，图像分析服务暂时不可用，请稍后再试。";
        }
    }

    /**
     * 根据AI类型和输入生成响应
     */
    public String generateResponse(String prompt, String aiType, String model, Map<String, Object> options) {
        // 检查是否有消息ID，从中获取图片信息
        String imageUrl = (String) options.get("imageUrl");
        Long messageId = (Long) options.get("messageId");
        
        if (messageId != null && imageUrl == null) {
            // 从消息附件中获取图片信息
            List<MessageAttachment> attachments = messageAttachmentRepository.findByMessageIdOrderByCreatedAtAsc(messageId);
            List<MessageAttachment> imageAttachments = attachments.stream()
                    .filter(MessageAttachment::isImage)
                    .collect(Collectors.toList());
            
            if (!imageAttachments.isEmpty()) {
                MessageAttachment firstImage = imageAttachments.get(0);
                imageUrl = "http://localhost:8080/api/files/" + firstImage.getFileName();
                log.info("从消息附件中获取图片: messageId={}, fileName={}, imageUrl={}", 
                        messageId, firstImage.getFileName(), imageUrl);
            }
        }
        
        switch (aiType) {
            case "conversation":
            case "text_to_text":
                // 智能对话：自动判断是否包含图片
                return generateConversationResponse(prompt, imageUrl, model);
            case "image_to_text":
                // 图片分析
                if (imageUrl != null) {
                    return analyzeImage(imageUrl, prompt, model);
                } else {
                    return "请上传图片进行分析";
                }
            case "text_to_image":
                return generateImage(prompt, model);
            case "image_to_image":
                // 图像到图像转换（待实现）
                return "图像到图像转换功能正在开发中...";
            case "text_to_3d":
                // 文本到3D（待实现）
                return "文本到3D功能正在开发中...";
            case "text_to_video":
                // 文本到视频（待实现）
                return "文本到视频功能正在开发中...";
            default:
                return generateText(prompt, model);
        }
    }

    /**
     * 获取可用模型列表
     */
    public java.util.List<AIModel> getAvailableModels() {
        // 返回预定义的模型列表
        return java.util.Arrays.asList(AIModel.values());
    }

    /**
     * 检查AI服务是否可用
     */
    public boolean isAIServiceAvailable() {
        return aiConfig.getApiKey() != null && !aiConfig.getApiKey().trim().isEmpty();
    }

    /**
     * 获取当前模型
     */
    public String getCurrentModel() {
        return aiConfig.getDefaultModel();
    }

    /**
     * 生成响应（兼容旧方法签名）
     */
    public String generateResponse(String prompt, String model) {
        return generateText(prompt, model);
    }

    /**
     * 获取支持图片的模型列表
     */
    public java.util.List<AIModel> getImageSupportModels() {
        return java.util.Arrays.stream(AIModel.values())
                .filter(AIModel::isSupportsImage)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * 获取模型详细信息
     */
    public AIModel getModelInfo(String modelId) {
        return AIModel.fromModelId(modelId);
    }

    /**
     * 检查模型是否可用
     */
    public boolean isModelAvailable(String modelId) {
        return java.util.Arrays.stream(AIModel.values())
                .anyMatch(model -> model.getModelId().equals(modelId));
    }

    /**
     * 健康检查
     */
    public boolean healthCheck() {
        try {
            // 发送一个简单的请求来检查服务可用性
            AIRequestDTO request = AIRequestDTO.builder()
                    .model("gpt-3.5-turbo")
                    .messages(Arrays.asList(
                            AIRequestDTO.Message.builder()
                                    .role("user")
                                    .content("Hello")
                                    .build()
                    ))
                    .maxTokens(10)
                    .build();
            
            AIResponseDTO response = getWebClient()
                    .post()
                    .uri("/chat/completions")
                    .body(BodyInserters.fromValue(request))
                    .retrieve()
                    .bodyToMono(AIResponseDTO.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
            
            return response != null && response.getChoices() != null && !response.getChoices().isEmpty();
        } catch (Exception e) {
            log.error("AI服务健康检查失败: ", e);
            return false;
        }
    }
} 