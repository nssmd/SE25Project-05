package com.aiplatform.controller;

import com.aiplatform.dto.UserDTO;
import com.aiplatform.entity.AdminMessage;
import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.User;
import com.aiplatform.repository.AdminMessageRepository;
import com.aiplatform.repository.SupportChatRepository;
import com.aiplatform.entity.SupportChat;
import com.aiplatform.repository.ChatRepository;
import com.aiplatform.repository.MessageRepository;
import com.aiplatform.repository.UserRepository;
import com.aiplatform.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@Tag(name = "用户管理", description = "用户相关接口")
public class UserController {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AdminMessageRepository adminMessageRepository;
    private final SupportChatRepository supportChatRepository;

    // 获取用户资料
    @Operation(summary = "获取用户资料", description = "获取当前用户的个人资料")
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile() {
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // JWT token中存储的是email
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("username", user.getUsername());
            profile.put("email", user.getEmail());
            profile.put("role", user.getRole());
            profile.put("status", user.getStatus());
            profile.put("permissions", user.getPermissions());
            profile.put("createdAt", user.getCreatedAt());
            
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            log.error("获取用户资料失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // 更新用户资料
    @Operation(summary = "更新用户资料", description = "更新当前用户的个人资料")
    @PutMapping("/profile")
    public ResponseEntity<String> updateUserProfile(@RequestBody Map<String, Object> request) {
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // JWT token中存储的是email
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            // 只允许更新部分字段
            if (request.containsKey("email")) {
                String newEmail = (String) request.get("email");
                if (newEmail != null && !newEmail.trim().isEmpty()) {
                    user.setEmail(newEmail.trim());
                }
            }
            
            userRepository.save(user);
            
            log.info("用户 {} 更新了资料", email);
            return ResponseEntity.ok("资料更新成功");
            
        } catch (Exception e) {
            log.error("更新用户资料失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("更新失败: " + e.getMessage());
        }
    }

    // 获取用户使用统计
    @GetMapping("/usage-stats")
    public ResponseEntity<?> getUsageStats(Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body("用户不存在");
            }
            
            User user = userOpt.get();
            Long userId = user.getId();
            
            // 统计数据
            long totalChats = chatRepository.countByUserId(userId);
            long totalMessages = messageRepository.countByUserId(userId);
            long favoriteChats = chatRepository.countByUserIdAndIsFavoriteTrue(userId);
            
            // 计算使用天数 - 使用简单的计算方式
            long usageDays = 1; // 默认至少1天
            if (user.getCreatedAt() != null) {
                usageDays = ChronoUnit.DAYS.between(user.getCreatedAt().toLocalDate(), LocalDateTime.now().toLocalDate()) + 1;
            }
            
            // 创建统计数据对象并返回Map
            return ResponseEntity.ok(Map.of(
                "totalChats", totalChats,
                "totalMessages", totalMessages,
                "favoriteChats", favoriteChats,
                "usageDays", usageDays
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("获取使用统计失败: " + e.getMessage());
        }
    }

    // 获取用户权限信息
    @GetMapping("/permissions")
    public ResponseEntity<?> getPermissions(Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body("用户不存在");
            }
            
            User user = userOpt.get();
            
            return ResponseEntity.ok(Map.of(
                "role", user.getRole().name(),
                "permissions", user.getPermissions() != null ? user.getPermissions() : "",
                "isAdmin", user.isAdmin(),
                "isSupport", user.isSupport()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("获取权限信息失败: " + e.getMessage());
        }
    }

    /**
     * 获取当前用户收到的消息
     */
    @Operation(summary = "获取用户消息", description = "获取当前用户收到的消息列表")
    @GetMapping("/messages")
    public ResponseEntity<Map<String, Object>> getUserMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        try {
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // JWT token中存储的是email
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            log.info("获取用户 {} 的消息列表", email);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<AdminMessage> messagesPage = adminMessageRepository.findByToUserIdOrderByCreatedAtDesc(
                    user.getId(), pageable);
            
            // 构建包含发信人信息的响应数据
            List<Map<String, Object>> messageList = messagesPage.getContent().stream()
                    .map(message -> {
                        Map<String, Object> messageData = new HashMap<>();
                        messageData.put("id", message.getId());
                        messageData.put("subject", message.getSubject());
                        messageData.put("content", message.getContent());
                        messageData.put("messageType", message.getMessageType().getDatabaseValue());
                        messageData.put("isRead", message.getIsRead());
                        messageData.put("createdAt", message.getCreatedAt());
                        messageData.put("fromUserId", message.getFromUserId());
                        messageData.put("toUserId", message.getToUserId());
                        
                        // 获取发信人信息
                        if (message.getFromUserId() != null) {
                            userRepository.findById(message.getFromUserId()).ifPresent(fromUser -> {
                                Map<String, Object> fromUserData = new HashMap<>();
                                fromUserData.put("id", fromUser.getId());
                                fromUserData.put("username", fromUser.getUsername());
                                fromUserData.put("email", fromUser.getEmail());
                                fromUserData.put("role", fromUser.getRole().name());
                                messageData.put("fromUser", fromUserData);
                            });
                        }
                        
                        return messageData;
                    })
                    .toList();
            
            // 构建分页响应
            Map<String, Object> response = new HashMap<>();
            response.put("content", messageList);
            response.put("totalPages", messagesPage.getTotalPages());
            response.put("totalElements", messagesPage.getTotalElements());
            response.put("size", messagesPage.getSize());
            response.put("number", messagesPage.getNumber());
            response.put("first", messagesPage.isFirst());
            response.put("last", messagesPage.isLast());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取用户消息失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 标记消息为已读
     */
    @Operation(summary = "标记消息已读", description = "将指定消息标记为已读")
    @PatchMapping("/messages/{messageId}/read")
    public ResponseEntity<String> markMessageAsRead(@PathVariable Long messageId) {
        
        try {
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // JWT token中存储的是email
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            AdminMessage message = adminMessageRepository.findById(messageId)
                    .orElseThrow(() -> new RuntimeException("消息不存在"));
            
            // 检查消息是否属于当前用户
            if (!message.getToUserId().equals(user.getId())) {
                return ResponseEntity.status(403).body("无权限访问此消息");
            }
            
            message.setIsRead(true);
            adminMessageRepository.save(message);
            
            log.info("用户 {} 标记消息 {} 为已读", email, messageId);
            return ResponseEntity.ok("消息已标记为已读");
            
        } catch (Exception e) {
            log.error("标记消息已读失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("标记失败: " + e.getMessage());
        }
    }

    /**
     * 删除消息
     */
    @Operation(summary = "删除消息", description = "删除指定的消息")
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<String> deleteMessage(@PathVariable Long messageId) {
        
        try {
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // JWT token中存储的是email
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            AdminMessage message = adminMessageRepository.findById(messageId)
                    .orElseThrow(() -> new RuntimeException("消息不存在"));
            
            // 检查消息是否属于当前用户
            if (!message.getToUserId().equals(user.getId())) {
                return ResponseEntity.status(403).body("无权限删除此消息");
            }
            
            adminMessageRepository.deleteById(messageId);
            
            log.info("用户 {} 删除了消息 {}", email, messageId);
            return ResponseEntity.ok("消息已删除");
            
        } catch (Exception e) {
            log.error("删除消息失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("删除失败: " + e.getMessage());
        }
    }

    /**
     * 获取客服对话记录
     */
    @Operation(summary = "获取客服对话", description = "获取当前用户与客服的对话记录")
    @GetMapping("/support/chat")
    public ResponseEntity<List<Map<String, Object>>> getSupportChat() {
        
        try {
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // JWT token中存储的是email
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            log.info("获取用户 {} 的客服对话记录", email);
            
            // 获取用户的所有客服对话记录
            List<SupportChat> supportChats = supportChatRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
            
            // 构建响应数据，包含发送者信息
            List<Map<String, Object>> chatList = supportChats.stream()
                    .map(chat -> {
                        Map<String, Object> chatData = new HashMap<>();
                        chatData.put("id", chat.getId());
                        chatData.put("content", chat.getContent());
                        chatData.put("senderType", chat.getSenderType().name());
                        chatData.put("isRead", chat.getIsRead());
                        chatData.put("createdAt", chat.getCreatedAt());
                        chatData.put("userId", chat.getUserId());
                        chatData.put("supportId", chat.getSupportId());
                        chatData.put("fromUserId", chat.isFromUser() ? chat.getUserId() : chat.getSupportId());
                        
                        // 添加发送者信息
                        if (chat.isFromSupport() && chat.getSupportId() != null) {
                            userRepository.findById(chat.getSupportId()).ifPresent(supportUser -> {
                                Map<String, Object> fromUserData = new HashMap<>();
                                fromUserData.put("id", supportUser.getId());
                                fromUserData.put("username", supportUser.getUsername());
                                fromUserData.put("email", supportUser.getEmail());
                                fromUserData.put("role", supportUser.getRole().name());
                                chatData.put("fromUser", fromUserData);
                            });
                        } else if (chat.isFromUser()) {
                            Map<String, Object> fromUserData = new HashMap<>();
                            fromUserData.put("id", user.getId());
                            fromUserData.put("username", user.getUsername());
                            fromUserData.put("email", user.getEmail());
                            fromUserData.put("role", user.getRole().name());
                            chatData.put("fromUser", fromUserData);
                        }
                        
                        return chatData;
                    })
                    .toList();
            
            return ResponseEntity.ok(chatList);
            
        } catch (Exception e) {
            log.error("获取客服对话失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 发送消息给客服
     */
    @Operation(summary = "发送消息给客服", description = "用户向客服发送消息")
    @PostMapping("/support/message")
    public ResponseEntity<String> sendToSupport(@RequestBody Map<String, Object> request) {
        
        try {
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // JWT token中存储的是email
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            String content = (String) request.get("content");
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("消息内容不能为空");
            }
            
            // 获取指定的客服ID（可选）
            Object supportIdObj = request.get("supportId");
            Long supportId = null;
            if (supportIdObj != null) {
                if (supportIdObj instanceof String) {
                    try {
                        supportId = Long.parseLong((String) supportIdObj);
                    } catch (NumberFormatException e) {
                        // 忽略无效的supportId
                    }
                } else if (supportIdObj instanceof Number) {
                    supportId = ((Number) supportIdObj).longValue();
                }
            }
            
            log.info("用户 {} 向客服发送消息", email);
            
            // 创建客服对话记录
            SupportChat supportChat = new SupportChat();
            supportChat.setUserId(user.getId());
            supportChat.setSupportId(supportId);
            supportChat.setContent(content);
            supportChat.setSenderType(SupportChat.SenderType.USER);
            supportChat.setIsRead(false);
            
            supportChatRepository.save(supportChat);
            
            log.info("用户消息已保存到客服对话，等待客服回复");
            
            return ResponseEntity.ok("消息已发送给客服，请等待回复");
            
        } catch (Exception e) {
            log.error("发送客服消息失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("发送失败: " + e.getMessage());
        }
    }

    /**
     * 获取客服人员列表
     */
    @Operation(summary = "获取客服人员列表", description = "获取可用的客服人员列表")
    @GetMapping("/support/staff")
    public ResponseEntity<List<Map<String, Object>>> getSupportStaff() {
        
        try {
            log.info("获取客服人员列表");
            
            // 只查询客服用户，不包含管理员
            List<User> supportStaff = userRepository.findByRoleInAndStatus(
                    List.of(User.UserRole.support), 
                    User.UserStatus.active);
            
            List<Map<String, Object>> staffList = supportStaff.stream()
                    .map(staff -> {
                        Map<String, Object> staffInfo = new HashMap<>();
                        staffInfo.put("id", staff.getId());
                        staffInfo.put("username", staff.getUsername());
                        staffInfo.put("email", staff.getEmail());
                        staffInfo.put("role", staff.getRole().name());
                        // 简单的在线状态判断（实际应用中可能需要更复杂的逻辑）
                        staffInfo.put("status", "online"); // 暂时都设为在线
                        return staffInfo;
                    })
                    .toList();
            
            return ResponseEntity.ok(staffList);
            
        } catch (Exception e) {
            log.error("获取客服人员列表失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
} 