package com.aiplatform.controller;

import com.aiplatform.dto.UserDTO;
import com.aiplatform.entity.AdminMessage;
import com.aiplatform.entity.User;
import com.aiplatform.repository.AdminMessageRepository;
import com.aiplatform.repository.UserRepository;
import com.aiplatform.repository.SupportChatRepository;
import com.aiplatform.entity.SupportChat;
import com.aiplatform.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "管理员管理", description = "管理员相关接口")
public class AdminController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final AdminMessageRepository adminMessageRepository;
    private final SupportChatRepository supportChatRepository;
    private final ObjectMapper objectMapper;

    @Operation(summary = "获取用户列表", description = "分页获取用户列表")
    @GetMapping("/users")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Page<UserDTO.UserResponse>> getUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        
        try {
            log.info("=== AdminController.getUsers 开始 ===");
            log.info("管理员获取用户列表请求: keyword={}, page={}, size={}", keyword, page, size);
            
            // 检查当前用户权限
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            log.info("当前请求用户: name={}, authenticated={}, authorities={}", 
                    auth.getName(), auth.isAuthenticated(), auth.getAuthorities());
            
            UserDTO.UserSearchRequest request = new UserDTO.UserSearchRequest();
            request.setKeyword(keyword);
            request.setPage(page);
            request.setSize(size);
            request.setSortBy(sortBy);
            request.setSortDirection(sortDirection);
            
            log.info("调用 UserService.searchUsers...");
            Page<UserDTO.UserResponse> users = userService.searchUsers(request);
            log.info("用户列表查询成功: 总数={}, 当前页数量={}", users.getTotalElements(), users.getNumberOfElements());
            
            log.info("=== AdminController.getUsers 结束 ===");
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("获取用户列表失败: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Operation(summary = "更新用户状态", description = "更新指定用户的状态")
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<String> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserDTO.UserStatusUpdateRequest request) {
        
        try {
            log.info("=== AdminController.updateUserStatus 开始 ===");
            log.info("更新用户状态: userId={}, newStatus={}", userId, request.getStatus());
            
            userService.updateUserStatus(userId, request);
            log.info("用户状态更新成功");
            
            return ResponseEntity.ok("用户状态更新成功");
        } catch (Exception e) {
            log.error("更新用户状态失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("更新失败: " + e.getMessage());
        }
    }

    @Operation(summary = "获取用户统计信息", description = "获取系统用户的统计数据")
    @GetMapping("/statistics")
    public ResponseEntity<UserDTO.UserStatistics> getUserStatistics() {
        UserDTO.UserStatistics statistics = userService.getUserStatistics();
        return ResponseEntity.ok(statistics);
    }

    @Operation(summary = "发送系统消息", description = "向指定用户发送系统消息")
    @PostMapping("/users/{userId}/message")
    public ResponseEntity<String> sendMessageToUser(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {
        
        try {
            log.info("管理员向用户 {} 发送消息", userId);
            
            String content = (String) request.get("content");
            String title = (String) request.get("title");
            
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("消息内容不能为空");
            }
            
            // 验证目标用户存在
            Optional<User> targetUser = userRepository.findById(userId);
            if (!targetUser.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // 获取当前管理员用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String adminEmail = auth.getName();
            Optional<User> adminUser = userRepository.findByEmail(adminEmail);
            
            if (!adminUser.isPresent()) {
                return ResponseEntity.status(403).body("管理员用户不存在");
            }
            
            // 创建管理员消息
            AdminMessage adminMessage = new AdminMessage();
            adminMessage.setFromUserId(adminUser.get().getId());
            adminMessage.setToUserId(userId);
            adminMessage.setMessageType(AdminMessage.MessageType.PRIVATE);
            adminMessage.setSubject(title);
            adminMessage.setContent(content);
            adminMessage.setIsRead(false);
            
            adminMessageRepository.save(adminMessage);
            
            log.info("消息发送成功: 从用户 {} 发送到用户 {}", adminUser.get().getId(), userId);
            return ResponseEntity.ok("消息发送成功");
            
        } catch (Exception e) {
            log.error("发送消息失败: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("发送消息失败");
        }
    }

    @Operation(summary = "更新用户权限", description = "更新指定用户的权限")
    @PatchMapping("/users/{userId}/permissions")
    public ResponseEntity<String> updateUserPermissions(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> permissions) {
        
        try {
            log.info("管理员更新用户 {} 的权限: {}", userId, permissions);
            
            if (permissions == null || permissions.isEmpty()) {
                return ResponseEntity.badRequest().body("权限数据不能为空");
            }
            
            // 验证用户存在
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            // 将权限转换为JSON字符串保存
            String permissionsJson = objectToJson(permissions);
            user.setPermissions(permissionsJson);
            
            userRepository.save(user);
            
            log.info("用户 {} 权限更新成功: {}", userId, permissionsJson);
            return ResponseEntity.ok("权限更新成功");
            
        } catch (Exception e) {
            log.error("更新用户权限失败: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("更新权限失败: " + e.getMessage());
        }
    }

    @Operation(summary = "批量更新用户权限", description = "批量更新多个用户的权限")
    @PutMapping("/users/permissions")
    public ResponseEntity<String> updateUsersPermissions(
            @RequestBody UserDTO.BatchPermissionUpdateRequest request) {
        
        // 这里可以实现批量权限更新的逻辑
        log.info("批量更新用户权限: {}", request);
        return ResponseEntity.ok("权限更新成功");
    }

    @Operation(summary = "修改用户角色", description = "修改指定用户的角色身份")
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<UserDTO.UserResponse> updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody UserDTO.UserRoleUpdateRequest request) {
        
        try {
            log.info("管理员修改用户 {} 的角色为: {}, 原因: {}", userId, request.getRole(), request.getReason());
            UserDTO.UserResponse updatedUser = userService.updateUserRole(userId, request);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            log.error("修改用户角色失败: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "测试接口", description = "测试管理员权限和数据库连接")
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        try {
            log.info("管理员测试接口被调用");
            
            // 简单统计用户数
            UserDTO.UserStatistics stats = userService.getUserStatistics();
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "管理员权限正常");
            result.put("totalUsers", stats.getTotalUsers());
            result.put("activeUsers", stats.getActiveUsers());
            result.put("timestamp", java.time.LocalDateTime.now());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("测试接口失败: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 客服工作台 - 获取客户对话列表
     */
    @Operation(summary = "获取客户对话列表", description = "客服工作台获取所有客户对话")
    @GetMapping("/support/customer-chats")
    @PreAuthorize("hasRole('support')")
    public ResponseEntity<java.util.List<Map<String, Object>>> getCustomerChats() {
        
        try {
            // 获取当前认证信息进行调试
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            log.info("客服工作台访问请求:");
            log.info("- 用户名: {}", auth.getName());
            log.info("- 权限列表: {}", auth.getAuthorities());
            log.info("- 是否已认证: {}", auth.isAuthenticated());
            
            log.info("开始获取客户对话列表");
            
            // 获取所有有对话的用户ID列表
            java.util.List<Long> userIds = supportChatRepository.findDistinctUserIdsOrderByLatestMessage();
            
            java.util.List<Map<String, Object>> customerChats = new java.util.ArrayList<>();
            
            // 为每个用户创建对话项
            for (Long userId : userIds) {
                // 获取用户信息
                Optional<User> userOpt = userRepository.findById(userId);
                if (!userOpt.isPresent()) continue;
                
                User user = userOpt.get();
                
                // 获取该用户的所有对话记录
                java.util.List<SupportChat> userChats = supportChatRepository.findByUserIdOrderByCreatedAtAsc(userId);
                if (userChats.isEmpty()) continue;
                
                // 获取最新消息
                SupportChat latestMessage = userChats.get(userChats.size() - 1);
                
                // 统计未读消息数量（用户发送给客服的未读消息）
                long unreadCount = userChats.stream()
                        .filter(chat -> chat.getSenderType() == SupportChat.SenderType.USER && !chat.getIsRead())
                        .count();
                
                Map<String, Object> chatInfo = new HashMap<>();
                chatInfo.put("id", userId);
                chatInfo.put("customerId", userId);
                chatInfo.put("customerName", user.getUsername());
                chatInfo.put("customerEmail", user.getEmail());
                chatInfo.put("lastMessage", latestMessage.getContent());
                chatInfo.put("updatedAt", latestMessage.getCreatedAt());
                chatInfo.put("unreadCount", unreadCount);
                
                // 添加消息列表
                java.util.List<Map<String, Object>> messages = userChats.stream()
                        .map(chat -> {
                            Map<String, Object> messageData = new HashMap<>();
                            messageData.put("id", chat.getId());
                            messageData.put("content", chat.getContent());
                            messageData.put("isFromCustomer", chat.getSenderType() == SupportChat.SenderType.USER);
                            messageData.put("senderType", chat.getSenderType().name());
                            messageData.put("createdAt", chat.getCreatedAt());
                            messageData.put("isRead", chat.getIsRead());
                            return messageData;
                        })
                        .collect(java.util.stream.Collectors.toList());
                
                chatInfo.put("messages", messages);
                customerChats.add(chatInfo);
            }
            
            log.info("获取到 {} 个客户对话", customerChats.size());
            return ResponseEntity.ok(customerChats);
            
        } catch (Exception e) {
            log.error("获取客户对话列表失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 客服回复客户
     */
    @Operation(summary = "客服回复客户", description = "客服向客户发送回复消息")
    @PostMapping("/support/reply")
    @PreAuthorize("hasRole('support')")
    public ResponseEntity<String> replyToCustomer(@RequestBody Map<String, Object> request) {
        
        try {
            log.info("客服回复客户");
            
            Long customerId = Long.valueOf(request.get("customerId").toString());
            String content = (String) request.get("content");
            
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("回复内容不能为空");
            }
            
            // 获取当前客服用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String supportEmail = auth.getName();
            Optional<User> supportUser = userRepository.findByEmail(supportEmail);
            
            if (!supportUser.isPresent()) {
                return ResponseEntity.status(403).body("客服用户不存在");
            }
            
            // 验证客户存在
            Optional<User> customer = userRepository.findById(customerId);
            if (!customer.isPresent()) {
                return ResponseEntity.badRequest().body("客户不存在");
            }
            
            // 创建客服回复记录
            SupportChat supportReply = new SupportChat();
            supportReply.setUserId(customerId);
            supportReply.setSupportId(supportUser.get().getId());
            supportReply.setContent(content);
            supportReply.setSenderType(SupportChat.SenderType.SUPPORT);
            supportReply.setIsRead(false);
            
            supportChatRepository.save(supportReply);
            
            // 标记该客户的用户消息为已读
            java.util.List<SupportChat> userMessages = supportChatRepository.findByUserIdOrderByCreatedAtAsc(customerId);
            for (SupportChat userMsg : userMessages) {
                if (userMsg.getSenderType() == SupportChat.SenderType.USER && !userMsg.getIsRead()) {
                    userMsg.setIsRead(true);
                    supportChatRepository.save(userMsg);
                }
            }
            
            log.info("客服 {} 回复客户 {} 成功", supportUser.get().getUsername(), customer.get().getUsername());
            
            return ResponseEntity.ok("回复发送成功");
            
        } catch (Exception e) {
            log.error("客服回复失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("回复失败: " + e.getMessage());
        }
    }

    /**
     * 将对象转换为JSON字符串
     */
    private String objectToJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("转换对象到JSON失败: {}", e.getMessage());
            return "{}";
        }
    }
} 