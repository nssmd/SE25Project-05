package com.aiplatform.controller;

import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.entity.User;
import com.aiplatform.service.ChatService;
import com.aiplatform.service.DashScopeImageService;
import com.aiplatform.service.MessageService;
import com.aiplatform.service.UserService;
import com.aiplatform.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/image")
@RequiredArgsConstructor
@Slf4j
public class ImageGenerationController {

    private final DashScopeImageService dashScopeImageService;
    private final MessageService messageService;
    private final ChatService chatService;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 文生图接口
     */
    @PostMapping("/text-to-image")
    public ResponseEntity<Map<String, Object>> generateTextToImage(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request) {
        
        try {
            // 验证token
            String token = authHeader.substring(7);
            String username = jwtTokenProvider.getEmailFromToken(token);
            
            // 获取参数
            String prompt = (String) request.get("prompt");
            String size = (String) request.get("size");
            String style = (String) request.get("style");
            Long chatId = Long.valueOf(request.get("chatId").toString());
            
            if (prompt == null || prompt.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "提示词不能为空")
                );
            }
            
            // 检查DashScope服务是否可用
            if (!dashScopeImageService.isAvailable()) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "图像生成服务不可用")
                );
            }
            
            // 获取或创建聊天
            Chat chat;
            try {
                chat = chatService.getChatById(chatId);
            } catch (Exception e) {
                // 如果聊天会话不存在，创建一个新的图像生成会话
                User user = userService.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
                chat = chatService.createChat(user.getId(), "智能生图", Chat.AiType.text_to_image);
                log.info("为用户 {} 创建新的图像生成聊天会话: {}", username, chat.getId());
            }
            
            // 创建消息
            Message message = new Message();
            message.setChatId(chat.getId());
            message.setContent("【图像生成】" + prompt);
            message.setRole(Message.MessageRole.user);
            message = messageService.saveMessage(message);
            
            // 生成图片
            MessageAttachment attachment = dashScopeImageService.generateTextToImage(
                prompt, size, style, message
            );
            
            if (attachment != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "图片生成成功");
                response.put("imageUrl", "http://localhost:8080/api/files/" + attachment.getFileName());
                response.put("messageId", message.getId());
                response.put("attachmentId", attachment.getId());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "图片生成失败")
                );
            }
            
        } catch (Exception e) {
            log.error("文生图失败", e);
            return ResponseEntity.badRequest().body(
                Map.of("error", "图片生成失败: " + e.getMessage())
            );
        }
    }

    /**
     * 图生图接口
     */
    @PostMapping("/image-to-image")
    public ResponseEntity<Map<String, Object>> generateImageToImage(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request) {
        
        try {
            // 验证token
            String token = authHeader.substring(7);
            String username = jwtTokenProvider.getEmailFromToken(token);
            
            // 获取参数
            String prompt = (String) request.get("prompt");
            String referenceImageUrl = (String) request.get("referenceImageUrl");
            String size = (String) request.get("size");
            String style = (String) request.get("style");
            Long chatId = Long.valueOf(request.get("chatId").toString());
            
            if (prompt == null || prompt.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "提示词不能为空")
                );
            }
            
            if (referenceImageUrl == null || referenceImageUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "参考图片不能为空")
                );
            }
            
            // 检查DashScope服务是否可用
            if (!dashScopeImageService.isAvailable()) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "图像生成服务不可用")
                );
            }
            
            // 获取或创建聊天
            Chat chat;
            try {
                chat = chatService.getChatById(chatId);
            } catch (Exception e) {
                // 如果聊天会话不存在，创建一个新的图像生成会话
                User user = userService.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
                chat = chatService.createChat(user.getId(), "智能生图", Chat.AiType.image_to_image);
                log.info("为用户 {} 创建新的图像生成聊天会话: {}", username, chat.getId());
            }
            
            // 创建消息
            Message message = new Message();
            message.setChatId(chat.getId());
            message.setContent("【图生图】" + prompt);
            message.setRole(Message.MessageRole.user);
            message = messageService.saveMessage(message);
            
            // 生成图片
            MessageAttachment attachment = dashScopeImageService.generateImageToImage(
                prompt, referenceImageUrl, size, style, message
            );
            
            if (attachment != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "图片生成成功");
                response.put("imageUrl", "http://localhost:8080/api/files/" + attachment.getFileName());
                response.put("messageId", message.getId());
                response.put("attachmentId", attachment.getId());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "图片生成失败")
                );
            }
            
        } catch (Exception e) {
            log.error("图生图失败", e);
            return ResponseEntity.badRequest().body(
                Map.of("error", "图片生成失败: " + e.getMessage())
            );
        }
    }

    /**
     * 获取支持的图片尺寸
     */
    @GetMapping("/supported-sizes")
    public ResponseEntity<Map<String, Object>> getSupportedSizes() {
        try {
            List<String> sizes = dashScopeImageService.getSupportedSizes();
            return ResponseEntity.ok(Map.of("sizes", sizes));
        } catch (Exception e) {
            log.error("获取支持的尺寸失败", e);
            return ResponseEntity.badRequest().body(
                Map.of("error", "获取支持的尺寸失败: " + e.getMessage())
            );
        }
    }

    /**
     * 获取支持的风格
     */
    @GetMapping("/supported-styles")
    public ResponseEntity<Map<String, Object>> getSupportedStyles() {
        try {
            List<String> styles = dashScopeImageService.getSupportedStyles();
            return ResponseEntity.ok(Map.of("styles", styles));
        } catch (Exception e) {
            log.error("获取支持的风格失败", e);
            return ResponseEntity.badRequest().body(
                Map.of("error", "获取支持的风格失败: " + e.getMessage())
            );
        }
    }

    /**
     * 检查服务状态
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        try {
            boolean available = dashScopeImageService.isAvailable();
            Map<String, Object> status = new HashMap<>();
            status.put("available", available);
            status.put("service", "DashScope");
            status.put("message", available ? "服务可用" : "服务不可用");
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("检查服务状态失败", e);
            return ResponseEntity.badRequest().body(
                Map.of("error", "检查服务状态失败: " + e.getMessage())
            );
        }
    }
} 