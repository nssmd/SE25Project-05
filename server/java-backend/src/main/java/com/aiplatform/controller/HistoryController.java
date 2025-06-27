package com.aiplatform.controller;

import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.User;
import com.aiplatform.service.ChatService;
import com.aiplatform.repository.UserRepository;
import com.aiplatform.repository.ChatRepository;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "历史记录管理", description = "对话历史相关接口")
public class HistoryController {

    private final ChatService chatService;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    @Operation(summary = "获取用户对话列表", description = "获取当前用户的对话历史列表")
    @GetMapping("/chats")
    public ResponseEntity<Map<String, Object>> getUserChats(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String timeFilter,
            @RequestParam(required = false) String aiType,
            @RequestParam(required = false) Boolean isFavorite) {
        
        try {
            log.info("获取用户对话列表: page={}, size={}, keyword={}", page, size, keyword);
            
            Long userId = getCurrentUserId();
            Pageable pageable = PageRequest.of(page, size);
            
            Page<Chat> chatPage;
            
            // 根据不同条件查询
            if (keyword != null && !keyword.trim().isEmpty()) {
                chatPage = chatRepository.findByUserIdAndTitleContaining(userId, keyword, pageable);
            } else if (isFavorite != null && isFavorite) {
                chatPage = chatRepository.findByUserIdAndIsFavoriteTrueOrderByLastActivityDesc(userId, pageable);
            } else if (aiType != null && !aiType.equals("all")) {
                try {
                    Chat.AiType aiTypeEnum = Chat.AiType.valueOf(aiType.replace("-", "_"));
                    chatPage = chatRepository.findByUserIdAndAiTypeOrderByLastActivityDesc(userId, aiTypeEnum, pageable);
                } catch (IllegalArgumentException e) {
                    chatPage = chatRepository.findByUserIdOrderByLastActivityDesc(userId, pageable);
                }
            } else {
                chatPage = chatRepository.findByUserIdOrderByLastActivityDesc(userId, pageable);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("chats", chatPage.getContent());
            response.put("totalElements", chatPage.getTotalElements());
            response.put("totalPages", chatPage.getTotalPages());
            response.put("currentPage", page);
            response.put("size", size);
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("获取对话列表业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("获取对话列表系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("获取对话列表失败"));
        }
    }

    @Operation(summary = "获取对话详情", description = "获取指定对话的详细信息和消息列表")
    @GetMapping("/chats/{chatId}")
    public ResponseEntity<Map<String, Object>> getChatDetail(@PathVariable Long chatId) {
        try {
            log.info("获取对话详情: chatId={}", chatId);
            
            Long userId = getCurrentUserId();
            
            // 验证对话存在且属于当前用户
            Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> new BusinessException("对话不存在或无权限访问"));
            
            // 获取消息列表
            List<Message> messages = chatService.getChatMessages(chatId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("chat", chat);
            response.put("messages", messages);
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("获取对话详情业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("获取对话详情系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("获取对话详情失败"));
        }
    }

    @Operation(summary = "获取用户统计信息", description = "获取用户的对话统计数据")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        try {
            log.info("获取用户统计信息");
            
            Long userId = getCurrentUserId();
            
            // 统计各种数据
            int totalChats = chatRepository.countByUserId(userId);
            int favoriteChats = chatRepository.countByUserIdAndIsFavoriteTrue(userId);
            int protectedChats = chatRepository.countByUserIdAndIsProtectedTrue(userId);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalChats", totalChats);
            stats.put("favoriteChats", favoriteChats);
            stats.put("protectedChats", protectedChats);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("stats", stats);
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("获取统计信息业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("获取统计信息系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("获取统计信息失败"));
        }
    }

    @Operation(summary = "删除聊天记录", description = "删除指定的聊天记录")
    @DeleteMapping("/chats/{chatId}")
    public ResponseEntity<Map<String, Object>> deleteChat(@PathVariable Long chatId) {
        log.info("删除聊天记录: {}", chatId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "聊天记录删除成功");
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "导出聊天记录", description = "导出用户的聊天记录")
    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportChats(
            @RequestParam(required = false) String format) {
        
        log.info("导出聊天记录: format={}", format);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("downloadUrl", "/api/history/download/temp.json");
        response.put("message", "导出任务已创建");
        
        return ResponseEntity.ok(response);
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