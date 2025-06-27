package com.aiplatform.controller;

import com.aiplatform.dto.UserDTO;
import com.aiplatform.service.UserService;
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

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "管理员管理", description = "管理员相关接口")
public class AdminController {

    private final UserService userService;

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
            @RequestBody String message) {
        
        // 这里可以实现发送系统消息的逻辑
        log.info("向用户 {} 发送系统消息: {}", userId, message);
        return ResponseEntity.ok("消息发送成功");
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
} 