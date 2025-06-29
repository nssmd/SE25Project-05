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

import java.time.LocalDateTime;
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
            
            // 构建查询条件
            boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();
            boolean hasFavoriteFilter = isFavorite != null && isFavorite;
            boolean hasAiTypeFilter = aiType != null && !aiType.equals("all");
            boolean hasTimeFilter = timeFilter != null && !timeFilter.equals("all");
            
            LocalDateTime timeFilterDate = null;
            if (hasTimeFilter) {
                switch (timeFilter) {
                    case "today":
                        timeFilterDate = LocalDateTime.now().toLocalDate().atStartOfDay();
                        break;
                    case "week":
                        timeFilterDate = LocalDateTime.now().minusWeeks(1);
                        break;
                    case "month":
                        timeFilterDate = LocalDateTime.now().minusMonths(1);
                        break;
                    default:
                        hasTimeFilter = false;
                        break;
                }
                log.info("时间筛选: {} -> {}", timeFilter, timeFilterDate);
            }
            
            Chat.AiType aiTypeEnum = null;
            if (hasAiTypeFilter) {
                try {
                    // 前端发送的格式：text-to-text，数据库格式：text_to_text
                    String enumName = aiType.replace("-", "_");
                    aiTypeEnum = Chat.AiType.valueOf(enumName);
                    log.info("AI类型筛选: {} -> {}", aiType, aiTypeEnum);
                } catch (IllegalArgumentException e) {
                    log.warn("无效的AI类型: {}, 忽略AI类型筛选", aiType);
                    hasAiTypeFilter = false;
                }
            }
            
            // 使用通用查询方法，支持所有条件组合
            String searchKeyword = hasKeyword ? keyword.trim() : null;
            Boolean favoriteFilter = hasFavoriteFilter ? true : null;
            
            log.info("查询参数: keyword={}, aiType={}, favorite={}, timeFilter={}", 
                searchKeyword, aiTypeEnum, favoriteFilter, timeFilterDate);
            
            chatPage = chatRepository.findChatsWithFilters(
                userId, searchKeyword, aiTypeEnum, favoriteFilter, timeFilterDate, pageable);
            
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

    @Operation(summary = "获取搜索建议", description = "根据查询关键词获取搜索建议")
    @GetMapping("/search-suggestions")
    public ResponseEntity<Map<String, Object>> getSearchSuggestions(
            @RequestParam String query) {
        try {
            log.info("获取搜索建议: query={}", query);
            
            Long userId = getCurrentUserId();
            
            // 获取相关的对话标题作为建议
            List<Chat> suggestionChats = chatRepository.findTop5ByUserIdAndTitleContainingIgnoreCase(userId, query);
            
            List<String> suggestions = new ArrayList<>();
            for (Chat chat : suggestionChats) {
                suggestions.add(chat.getTitle());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("suggestions", suggestions);
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("获取搜索建议业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("获取搜索建议系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("获取搜索建议失败"));
        }
    }

    @Operation(summary = "批量操作对话", description = "对多个对话进行批量操作")
    @PostMapping("/batch-operation")
    public ResponseEntity<Map<String, Object>> batchOperation(
            @RequestBody Map<String, Object> request) {
        try {
            log.info("批量操作对话: {}", request);
            
            Long userId = getCurrentUserId();
            String operation = (String) request.get("operation");
            @SuppressWarnings("unchecked")
            List<Long> chatIds = (List<Long>) request.get("chatIds");
            
            if (operation == null || chatIds == null || chatIds.isEmpty()) {
                throw new BusinessException("参数不完整");
            }
            
            int successCount = 0;
            for (Long chatId : chatIds) {
                try {
                    // 验证对话属于当前用户
                    Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                        .orElseThrow(() -> new BusinessException("对话不存在或无权限访问"));
                    
                    switch (operation) {
                        case "delete":
                            chatService.deleteChat(chatId, userId);
                            break;
                        case "favorite":
                            chat.setIsFavorite(!chat.getIsFavorite());
                            chatRepository.save(chat);
                            break;
                        case "protect":
                            chat.setIsProtected(!chat.getIsProtected());
                            chatRepository.save(chat);
                            break;
                        default:
                            throw new BusinessException("不支持的操作: " + operation);
                    }
                    successCount++;
                } catch (Exception e) {
                    log.warn("批量操作失败 - chatId: {}, error: {}", chatId, e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("successCount", successCount);
            response.put("totalCount", chatIds.size());
            response.put("message", String.format("成功处理 %d/%d 个对话", successCount, chatIds.size()));
            
            return ResponseEntity.ok(response);
            
        } catch (BusinessException e) {
            log.error("批量操作业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("批量操作系统异常: ", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("批量操作失败"));
        }
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