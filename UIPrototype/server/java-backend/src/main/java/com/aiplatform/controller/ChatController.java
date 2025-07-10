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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
            String aiModel = (String) request.get("aiModel"); // 获取模型参数
            Chat.AiType aiType = Chat.AiType.text_to_text; // 默认值，与实体类保持一致
            
            if (aiTypeStr != null) {
                try {
                    aiType = Chat.AiType.valueOf(aiTypeStr);
                } catch (IllegalArgumentException e) {
                    log.warn("无效的AI类型: {}, 使用默认值", aiTypeStr);
                }
            }
            
            log.info("创建聊天会话: title={}, aiType={}, aiModel={}", title, aiType, aiModel);
            
            // 创建聊天会话
            Chat chat = chatService.createChat(userId, title, aiType);
            
            // 如果指定了模型，更新模型设置
            if (aiModel != null && !aiModel.trim().isEmpty()) {
                chat = chatService.updateChatModel(chat.getId(), aiModel);
            }
            
            // 准备响应数据
            Map<String, Object> chatData = new HashMap<>();
            chatData.put("id", chat.getId());
            chatData.put("title", chat.getTitle());
            chatData.put("aiType", chat.getAiType().name());
            chatData.put("aiModel", chat.getAiModel()); // 包含模型信息
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
            String aiType = (String) request.getOrDefault("aiType", "text_to_text");
            String model = (String) request.get("model");
            String aiModel = (String) request.get("aiModel"); // 获取模型参数
            
            // 处理附件
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> attachments = (List<Map<String, Object>>) request.get("attachments");
            
            // 如果既没有文本内容也没有附件，返回错误
            if ((userMessage == null || userMessage.trim().isEmpty()) && (attachments == null || attachments.isEmpty())) {
                return ResponseEntity.badRequest().body(createErrorResponse("消息内容和附件不能同时为空"));
            }
            
            // 如果没有文本内容但有附件，设置默认文本
            if (userMessage == null || userMessage.trim().isEmpty()) {
                userMessage = "请分析这张图片";
            }
            
            log.info("用户消息: {}, AI类型: {}, 模型: {}, 附件数量: {}", 
                     userMessage, aiType, model != null ? model : aiModel, 
                     attachments != null ? attachments.size() : 0);
            
            // 保存用户消息
            Message userMessageEntity = chatService.sendMessage(
                chatId, userId, userMessage, Message.MessageRole.user);
            
            // 如果有附件，关联到消息
            if (attachments != null && !attachments.isEmpty()) {
                chatService.attachFilesToMessage(userMessageEntity.getId(), attachments);
            }
            
            // 构建AI参数
            Map<String, Object> aiOptions = new HashMap<>();
            if (request.containsKey("imageUrl")) {
                aiOptions.put("imageUrl", request.get("imageUrl"));
            }
            if (request.containsKey("audioFile")) {
                aiOptions.put("audioFile", request.get("audioFile"));
            }
            if (request.containsKey("inputs")) {
                aiOptions.put("inputs", request.get("inputs"));
            }
            if (request.containsKey("maxTokens")) {
                aiOptions.put("maxTokens", request.get("maxTokens"));
            }
            if (request.containsKey("temperature")) {
                aiOptions.put("temperature", request.get("temperature"));
            }
            if (request.containsKey("size")) {
                aiOptions.put("size", request.get("size"));
            }
            if (request.containsKey("quality")) {
                aiOptions.put("quality", request.get("quality"));
            }
            
            // 如果有附件，传递消息ID以便AI服务获取图片
            if (attachments != null && !attachments.isEmpty()) {
                aiOptions.put("messageId", userMessageEntity.getId());
            }
            
            // 生成AI回复 - 使用新的智能对话接口（优先使用 aiModel 参数）
            String effectiveModel = aiModel != null ? aiModel : model;
            String aiResponse = chatService.generateAIResponse(userMessage, aiType, effectiveModel, aiOptions);
            
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

    @Operation(summary = "切换收藏状态", description = "切换聊天会话的收藏状态")
    @PatchMapping("/{chatId}/favorite")
    public ResponseEntity<Map<String, Object>> toggleFavorite(@PathVariable Long chatId) {
        try {
            log.info("切换收藏状态: {}", chatId);
            
            Long userId = getCurrentUserId();
            Chat chat = chatService.toggleFavorite(chatId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("isFavorite", chat.getIsFavorite());
            response.put("message", chat.getIsFavorite() ? "已添加到收藏" : "已取消收藏");
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("切换收藏状态业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("切换收藏状态系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("操作失败"));
        }
    }

    @Operation(summary = "切换保护状态", description = "切换聊天会话的保护状态")
    @PatchMapping("/{chatId}/protect")
    public ResponseEntity<Map<String, Object>> toggleProtection(@PathVariable Long chatId) {
        try {
            log.info("切换保护状态: {}", chatId);
            
            Long userId = getCurrentUserId();
            Chat chat = chatService.toggleProtection(chatId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("isProtected", chat.getIsProtected());
            response.put("message", chat.getIsProtected() ? "已设为保护对话" : "已取消保护");
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("切换保护状态业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("切换保护状态系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("操作失败"));
        }
    }

    @Operation(summary = "更新对话标题", description = "更新聊天会话的标题")
    @PatchMapping("/{chatId}/title")
    public ResponseEntity<Map<String, Object>> updateTitle(
            @PathVariable Long chatId, 
            @RequestBody Map<String, Object> request) {
        try {
            log.info("更新对话标题: {}", chatId);
            
            Long userId = getCurrentUserId();
            String title = (String) request.get("title");
            
            if (title == null || title.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("标题不能为空"));
            }
            
            Chat chat = chatService.updateChatTitle(chatId, userId, title);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("title", chat.getTitle());
            response.put("message", "标题更新成功");
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("更新对话标题业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("更新对话标题系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("操作失败"));
        }
    }

    @Operation(summary = "更新对话模型", description = "更新聊天会话使用的AI模型")
    @PatchMapping("/{chatId}/model")
    public ResponseEntity<Map<String, Object>> updateModel(
            @PathVariable Long chatId, 
            @RequestBody Map<String, Object> request) {
        try {
            log.info("更新对话模型: {}", chatId);
            
            Long userId = getCurrentUserId();
            String aiModel = (String) request.get("aiModel");
            
            if (aiModel == null || aiModel.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("模型参数不能为空"));
            }
            
            Chat chat = chatService.updateChatModel(chatId, userId, aiModel);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("aiModel", chat.getAiModel());
            response.put("message", "模型更新成功");
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("更新对话模型业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("更新对话模型系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("操作失败"));
        }
    }

    @Operation(summary = "获取用户聊天列表", description = "获取当前用户的聊天会话列表")
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getUserChatList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("获取用户聊天列表: page={}, size={}", page, size);
            
            // 获取当前用户ID
            Long userId = getCurrentUserId();
            
            // 获取聊天列表
            Pageable pageable = PageRequest.of(page, size);
            Page<Chat> chatPage = chatService.getUserChats(userId, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("chats", chatPage.getContent());
            response.put("totalElements", chatPage.getTotalElements());
            response.put("totalPages", chatPage.getTotalPages());
            response.put("currentPage", page);
            response.put("size", size);
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("获取聊天列表业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("获取聊天列表系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("获取聊天列表失败"));
        }
    }

    // 辅助方法：获取当前用户ID
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException("用户未登录");
        }
        
        String principal = authentication.getName();
        log.debug("当前认证主体: {}", principal);
        
        // 首先尝试通过邮箱查找用户，如果失败再尝试用户名
        User user = userRepository.findByEmail(principal)
            .orElseGet(() -> userRepository.findByUsername(principal)
                .orElseThrow(() -> new BusinessException("用户不存在: " + principal)));
        
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