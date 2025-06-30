package com.aiplatform.controller;

import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.User;
import com.aiplatform.entity.UserSettings;
import com.aiplatform.repository.ChatRepository;
import com.aiplatform.repository.MessageRepository;
import com.aiplatform.repository.UserRepository;
import com.aiplatform.repository.UserSettingsRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/data")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@Tag(name = "数据管理", description = "数据管理相关接口")
public class DataController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;

    @Operation(summary = "获取用户设置", description = "获取用户数据管理设置")
    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        try {
            String email = getCurrentUserEmail();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            Long userId = user.getId();
            log.info("获取用户设置: 用户ID={}", userId);
            
            // 从数据库获取用户设置
            Optional<UserSettings> userSettingsOpt = userSettingsRepository.findByUserId(userId);
            
            Map<String, Object> settings = new HashMap<>();
            if (userSettingsOpt.isPresent()) {
                UserSettings userSettings = userSettingsOpt.get();
                settings.put("autoDelete", userSettings.getAutoCleanupEnabled());
                settings.put("retentionDays", userSettings.getRetentionDays());
                settings.put("maxChatCount", userSettings.getMaxChats());
                settings.put("protectedChats", userSettings.getProtectedLimit());
            } else {
                // 如果没有设置记录，创建默认设置
                UserSettings defaultSettings = new UserSettings();
                defaultSettings.setUserId(userId);
                defaultSettings.setAutoCleanupEnabled(false);
                defaultSettings.setRetentionDays(30);
                defaultSettings.setMaxChats(100);
                defaultSettings.setProtectedLimit(10);
                defaultSettings.setCleanupFrequency(UserSettings.CleanupFrequency.weekly);
                
                UserSettings savedSettings = userSettingsRepository.save(defaultSettings);
                
                settings.put("autoDelete", savedSettings.getAutoCleanupEnabled());
                settings.put("retentionDays", savedSettings.getRetentionDays());
                settings.put("maxChatCount", savedSettings.getMaxChats());
                settings.put("protectedChats", savedSettings.getProtectedLimit());
            }
            
            log.info("返回用户设置: {}", settings);
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            log.error("获取设置失败", e);
            return ResponseEntity.status(500).body(Map.of("error", "获取设置失败: " + e.getMessage()));
        }
    }

    @Operation(summary = "更新用户设置", description = "更新用户数据管理设置")
    @PutMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> settingsRequest) {
        try {
            String email = getCurrentUserEmail();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            Long userId = user.getId();
            log.info("更新用户设置: 用户ID={}, 设置={}", userId, settingsRequest);
            
            // 查找或创建用户设置
            UserSettings userSettings = userSettingsRepository.findByUserId(userId)
                    .orElse(new UserSettings());
            
            // 如果是新创建的，设置用户ID
            if (userSettings.getUserId() == null) {
                userSettings.setUserId(userId);
            }
            
            // 更新设置字段
            if (settingsRequest.containsKey("autoDelete")) {
                userSettings.setAutoCleanupEnabled((Boolean) settingsRequest.get("autoDelete"));
            }
            if (settingsRequest.containsKey("retentionDays")) {
                userSettings.setRetentionDays(((Number) settingsRequest.get("retentionDays")).intValue());
            }
            if (settingsRequest.containsKey("maxChatCount")) {
                userSettings.setMaxChats(((Number) settingsRequest.get("maxChatCount")).intValue());
            }
            if (settingsRequest.containsKey("protectedChats")) {
                userSettings.setProtectedLimit(((Number) settingsRequest.get("protectedChats")).intValue());
            }
            
            // 保存到数据库
            UserSettings savedSettings = userSettingsRepository.save(userSettings);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "设置更新成功");
            response.put("autoDelete", savedSettings.getAutoCleanupEnabled());
            response.put("retentionDays", savedSettings.getRetentionDays());
            response.put("maxChatCount", savedSettings.getMaxChats());
            response.put("protectedChats", savedSettings.getProtectedLimit());
            
            log.info("用户设置更新成功: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("更新设置失败", e);
            return ResponseEntity.status(500).body(Map.of("error", "更新设置失败: " + e.getMessage()));
        }
    }

    @Operation(summary = "获取数据统计", description = "获取用户数据统计信息")
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            String email = getCurrentUserEmail();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            Long userId = user.getId();
            log.info("获取数据统计: 用户ID={}", userId);
            
            // 获取真实统计数据
            long totalChats = chatRepository.countByUserId(userId);
            long totalMessages = messageRepository.countByUserId(userId);
            long protectedChats = chatRepository.countByUserIdAndIsProtectedTrue(userId);
            
            // 计算存储占用（简单估算）
            double storageMB = (totalMessages * 0.5) / 1024; // 假设每条消息平均0.5KB
            String storageSize = String.format("%.1f MB", storageMB);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalChats", totalChats);
            stats.put("totalMessages", totalMessages);
            stats.put("protectedChats", protectedChats);
            stats.put("totalSize", storageSize);
            stats.put("oldChats", calculateOldChats(userId));
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("获取统计数据失败", e);
            return ResponseEntity.status(500).body(Map.of("error", "获取统计数据失败"));
        }
    }

    @Operation(summary = "清理过期数据", description = "清理用户的过期聊天数据")
    @PostMapping("/cleanup")
    @Transactional
    public ResponseEntity<Map<String, Object>> cleanupData() {
        try {
            String email = getCurrentUserEmail();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            Long userId = user.getId();
            log.info("清理过期数据: 用户ID={}", userId);
            
            // 计算30天前的时间
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            
            // 查找需要清理的聊天（非保护且超过30天）
            List<Chat> chatsToCleanup = chatRepository.findChatsToCleanup(userId, cutoffDate);
            
            int deletedChats = 0;
            for (Chat chat : chatsToCleanup) {
                // 删除聊天的所有消息
                messageRepository.deleteByChatId(chat.getId());
                // 删除聊天记录
                chatRepository.delete(chat);
                deletedChats++;
            }
            
            // 计算释放的空间
            double freedSpaceMB = deletedChats * 0.5; // 简单估算
            String freedSpace = String.format("%.1f MB", freedSpaceMB);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "数据清理完成");
            response.put("deletedChats", deletedChats);
            response.put("freedSpace", freedSpace);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("清理数据失败", e);
            return ResponseEntity.status(500).body(Map.of("error", "清理数据失败"));
        }
    }

    @Operation(summary = "删除所有数据", description = "删除用户的所有非保护数据")
    @DeleteMapping("/all")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteAllData(@RequestBody Map<String, Object> request) {
        try {
            String email = getCurrentUserEmail();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            String confirmText = (String) request.get("confirmText");
            if (!"CONFIRM_DELETE".equals(confirmText)) {
                return ResponseEntity.badRequest().body(Map.of("error", "确认文本不正确"));
            }
            
            Long userId = user.getId();
            log.info("删除所有数据: 用户ID={}", userId);
            
            // 获取所有非保护的聊天
            List<Chat> allChats = chatRepository.findByUserIdOrderByLastActivityDesc(userId);
            int deletedChats = 0;
            
            for (Chat chat : allChats) {
                if (!chat.getIsProtected()) {
                    // 删除聊天的所有消息
                    messageRepository.deleteByChatId(chat.getId());
                    // 删除聊天记录
                    chatRepository.delete(chat);
                    deletedChats++;
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "所有非保护数据已删除");
            response.put("deletedChats", deletedChats);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("删除所有数据失败", e);
            return ResponseEntity.status(500).body(Map.of("error", "删除数据失败"));
        }
    }

    @Operation(summary = "导出数据", description = "导出用户的聊天数据")
    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportData() {
        try {
            String email = getCurrentUserEmail();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            Long userId = user.getId();
            log.info("导出数据: 用户ID={}", userId);
            
            // 获取用户所有聊天
            List<Chat> chats = chatRepository.findByUserIdOrderByLastActivityDesc(userId);
            
            Map<String, Object> exportData = new HashMap<>();
            exportData.put("exportTime", LocalDateTime.now().toString());
            exportData.put("userEmail", email);
            exportData.put("totalChats", chats.size());
            
            // 添加聊天数据
            List<Map<String, Object>> chatData = chats.stream().map(chat -> {
                Map<String, Object> chatInfo = new HashMap<>();
                chatInfo.put("id", chat.getId());
                chatInfo.put("title", chat.getTitle());
                chatInfo.put("aiType", chat.getAiType().name());
                chatInfo.put("createdAt", chat.getCreatedAt().toString());
                chatInfo.put("lastActivity", chat.getLastActivity().toString());
                chatInfo.put("isFavorite", chat.getIsFavorite());
                chatInfo.put("isProtected", chat.getIsProtected());
                
                // 获取聊天消息
                List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chat.getId());
                List<Map<String, Object>> messageData = messages.stream().map(message -> {
                    Map<String, Object> msgInfo = new HashMap<>();
                    msgInfo.put("role", message.getRole().name());
                    msgInfo.put("content", message.getContent());
                    msgInfo.put("createdAt", message.getCreatedAt().toString());
                    return msgInfo;
                }).toList();
                
                chatInfo.put("messages", messageData);
                return chatInfo;
            }).toList();
            
            exportData.put("chats", chatData);
            
            return ResponseEntity.ok(exportData);
        } catch (Exception e) {
            log.error("导出数据失败", e);
            return ResponseEntity.status(500).body(Map.of("error", "导出数据失败"));
        }
    }

    // 计算过期对话数量
    private long calculateOldChats(Long userId) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        return chatRepository.findChatsToCleanup(userId, cutoffDate).size();
    }

    // 获取当前用户邮箱
    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("用户未登录");
        }
        return authentication.getName();
    }
} 