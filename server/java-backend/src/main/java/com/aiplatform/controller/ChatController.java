package com.aiplatform.controller;

import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.User;
import com.aiplatform.service.ChatService;
import com.aiplatform.repository.UserRepository;
import com.aiplatform.exception.BusinessException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "聊天管理", description = "聊天相关接口")
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @Operation(summary = "创建聊天会话", description = "创建新的聊天会话")
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createChat(@RequestBody Map<String, Object> request) {
        try {
            log.info("创建聊天会话: {}", request);
            
            // 获取当前用户ID
            Long userId = getCurrentUserId();
            
            // 解析请求参数
            String title = (String) request.get("title");
            String aiTypeStr = (String) request.get("aiType");
            Chat.AiType aiType = Chat.AiType.text_to_text; // 默认值
            
            if (aiTypeStr != null) {
                try {
                    aiType = Chat.AiType.valueOf(aiTypeStr);
                } catch (IllegalArgumentException e) {
                    log.warn("无效的AI类型: {}, 使用默认值", aiTypeStr);
                }
            }
            
            // 创建聊天会话
            Chat chat = chatService.createChat(userId, title, aiType);
            
            // 准备响应数据
            Map<String, Object> chatData = new HashMap<>();
            chatData.put("id", chat.getId());
            chatData.put("title", chat.getTitle());
            chatData.put("aiType", chat.getAiType().name());
            chatData.put("createdAt", chat.getCreatedAt());
            chatData.put("messageCount", chat.getMessageCount());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("chat", chatData);
            response.put("message", "聊天会话创建成功");
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("创建聊天会话业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("创建聊天会话系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("创建聊天会话失败"));
        }
    }

    @Operation(summary = "发送消息", description = "向聊天会话发送消息")
    @PostMapping("/{chatId}/message")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable Long chatId, 
            @RequestBody Map<String, Object> request) {
        
        try {
            log.info("发送消息到聊天 {}: {}", chatId, request);
            
            // 获取当前用户ID
            Long userId = getCurrentUserId();
            
            String userMessage = (String) request.get("content");
            String roleStr = (String) request.get("role");
            
            if (userMessage == null || userMessage.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("消息内容不能为空"));
            }
            
            log.info("用户消息: {}", userMessage);
            
            // 保存用户消息
            Message userMessageEntity = chatService.sendMessage(
                chatId, userId, userMessage, Message.MessageRole.user);
            
            // 生成AI回复
            String aiResponse = chatService.generateAIResponse(userMessage);
            
            // 保存AI回复消息
            Message aiMessageEntity = chatService.sendMessage(
                chatId, userId, aiResponse, Message.MessageRole.assistant);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("messageId", aiMessageEntity.getId());
            response.put("response", aiResponse); // 前端期望的字段名
            response.put("userMessageId", userMessageEntity.getId());
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("发送消息业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("发送消息系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("发送消息失败"));
        }
    }

    @Operation(summary = "获取聊天历史", description = "获取指定聊天会话的历史消息")
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<Map<String, Object>> getChatMessages(@PathVariable Long chatId) {
        try {
            log.info("获取聊天历史: {}", chatId);
            
            // 获取当前用户ID
            Long userId = getCurrentUserId();
            
            // 获取消息列表
            List<Message> messages = chatService.getChatMessages(chatId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("messages", messages);
            response.put("count", messages.size());
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("获取聊天历史业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("获取聊天历史系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("获取聊天历史失败"));
        }
    }

    @Operation(summary = "删除聊天会话", description = "删除指定的聊天会话")
    @DeleteMapping("/{chatId}")
    public ResponseEntity<Map<String, Object>> deleteChat(@PathVariable Long chatId) {
        try {
            log.info("删除聊天会话: {}", chatId);
            
            // 获取当前用户ID
            Long userId = getCurrentUserId();
            
            // 删除聊天会话
            chatService.deleteChat(chatId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "聊天会话删除成功");
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("删除聊天会话业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("删除聊天会话系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("删除聊天会话失败"));
        }
    }

    // 辅助方法：获取当前用户ID
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException("用户未登录");
        }
        
        String username = authentication.getName();
        log.debug("当前认证用户名: {}", username);
        
        // 通过username查询用户获取ID
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BusinessException("用户不存在: " + username));
        
        return user.getId();
    }

    // 辅助方法：创建错误响应
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
} 