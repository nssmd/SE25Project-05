package com.aiplatform.controller;

import com.aiplatform.dto.UserDTO;
import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.User;
import com.aiplatform.repository.ChatRepository;
import com.aiplatform.repository.MessageRepository;
import com.aiplatform.repository.UserRepository;
import com.aiplatform.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    // 获取用户资料
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body("用户不存在");
            }
            
            User user = userOpt.get();
            
            // 只返回数据库中实际存在的字段
            UserDTO.UserResponse response = new UserDTO.UserResponse();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setUsername(user.getUsername());
            response.setRole(user.getRole());
            response.setStatus(user.getStatus());
            response.setLastLogin(user.getLastLogin());
            response.setCreatedAt(user.getCreatedAt());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("获取用户资料失败: " + e.getMessage());
        }
    }

    // 更新用户资料
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserDTO.UserProfileUpdateRequest request, 
                                         Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body("用户不存在");
            }
            
            User user = userOpt.get();
            
            // 只更新数据库中存在的字段
            if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
                // 检查用户名是否已被其他用户使用
                Optional<User> existingUser = userRepository.findByUsername(request.getUsername());
                if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                    return ResponseEntity.status(400).body("用户名已被使用");
                }
                user.setUsername(request.getUsername());
            }
            
            // 更新权限信息（如果请求中包含）
            if (request.getPermissions() != null) {
                user.setPermissions(request.getPermissions());
            }
            
            userRepository.save(user);
            
            return ResponseEntity.ok("用户资料更新成功");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("更新用户资料失败: " + e.getMessage());
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
} 