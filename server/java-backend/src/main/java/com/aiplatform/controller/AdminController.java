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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "管理员管理", description = "管理员相关接口")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    @Operation(summary = "获取用户列表", description = "分页获取用户列表")
    @GetMapping("/users")
    public ResponseEntity<Page<UserDTO.UserResponse>> getUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        
        UserDTO.UserSearchRequest request = new UserDTO.UserSearchRequest();
        request.setKeyword(keyword);
        request.setPage(page);
        request.setSize(size);
        request.setSortBy(sortBy);
        request.setSortDirection(sortDirection);
        
        Page<UserDTO.UserResponse> users = userService.searchUsers(request);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "更新用户状态", description = "更新指定用户的状态")
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<String> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserDTO.UserStatusUpdateRequest request) {
        
        userService.updateUserStatus(userId, request);
        return ResponseEntity.ok("用户状态更新成功");
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
} 