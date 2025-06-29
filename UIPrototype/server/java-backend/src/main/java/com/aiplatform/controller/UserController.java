package com.aiplatform.controller;

import com.aiplatform.dto.UserDTO;
import com.aiplatform.entity.AdminMessage;
import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.User;
import com.aiplatform.repository.AdminMessageRepository;
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
    public ResponseEntity<Page<AdminMessage>> getUserMessages(
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
            Page<AdminMessage> messages = adminMessageRepository.findByRecipientIdOrderByCreatedAtDesc(
                    user.getId(), pageable);
            
            return ResponseEntity.ok(messages);
            
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
    public ResponseEntity<List<AdminMessage>> getSupportChat() {
        
        try {
            // 获取当前用户
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // JWT token中存储的是email
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            log.info("获取用户 {} 的客服对话记录", email);
            
            // 获取与客服相关的消息（可以通过消息类型区分）
            List<AdminMessage> messages = adminMessageRepository.findByRecipientIdAndMessageTypeOrderByCreatedAtAsc(
                    user.getId(), AdminMessage.MessageType.SUPPORT);
            
            return ResponseEntity.ok(messages);
            
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
            
            log.info("用户 {} 向客服发送消息", email);
            
            // 创建用户给客服的消息记录
            AdminMessage message = new AdminMessage();
            message.setFromUserId(user.getId());
            message.setToUserId(null); // 发给客服，暂时设为null或特定客服ID
            message.setSubject("用户咨询");
            message.setContent(content);
            message.setMessageType(AdminMessage.MessageType.SUPPORT);
            message.setIsRead(false);
            
            adminMessageRepository.save(message);
            
            log.info("用户消息已保存，等待客服回复");
            
            return ResponseEntity.ok("消息已发送给客服，请等待回复");
            
        } catch (Exception e) {
            log.error("发送客服消息失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("发送失败: " + e.getMessage());
        }
    }
} 