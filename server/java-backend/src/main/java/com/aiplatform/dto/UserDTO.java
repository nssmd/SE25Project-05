package com.aiplatform.dto;

import com.aiplatform.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class UserDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserRegisterRequest {
        @NotBlank(message = "用户名不能为空")
        @Size(min = 3, max = 50, message = "用户名长度必须在3-50个字符之间")
        private String username;

        @NotBlank(message = "邮箱不能为空")
        @Email(message = "邮箱格式不正确")
        private String email;

        @NotBlank(message = "密码不能为空")
        @Size(min = 6, message = "密码长度至少6个字符")
        private String password;

        @NotBlank(message = "确认密码不能为空")
        private String confirmPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserLoginRequest {
        @NotBlank(message = "邮箱不能为空")
        private String email;

        @NotBlank(message = "密码不能为空")
        private String password;

        private boolean rememberMe = false;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserResponse {
        private Long id;
        private String email;
        private String username;
        private User.UserRole role;
        private String permissions;
        private User.UserStatus status;
        private LocalDateTime lastLogin;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static UserResponse fromEntity(User user) {
            UserResponse response = new UserResponse();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setUsername(user.getUsername());
            response.setRole(user.getRole());
            response.setPermissions(user.getPermissions());
            response.setStatus(user.getStatus());
            response.setLastLogin(user.getLastLogin());
            response.setCreatedAt(user.getCreatedAt());
            response.setUpdatedAt(user.getUpdatedAt());
            return response;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileUpdateRequest {
        private String username;
        private String permissions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasswordChangeRequest {
        @NotBlank(message = "当前密码不能为空")
        private String currentPassword;

        @NotBlank(message = "新密码不能为空")
        @Size(min = 6, message = "新密码长度至少6个字符")
        private String newPassword;

        @NotBlank(message = "确认新密码不能为空")
        private String confirmPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuthResponse {
        private String token;
        private String refreshToken;
        private UserResponse user;
        private String message;

        public AuthResponse(String token, String refreshToken, UserResponse user) {
            this.token = token;
            this.refreshToken = refreshToken;
            this.user = user;
        }

        public AuthResponse(String message) {
            this.message = message;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSearchRequest {
        private String keyword;
        private User.UserRole role;
        private User.UserStatus status;
        private String department;
        private int page = 0;
        private int size = 20;
        private String sortBy = "createdAt";
        private String sortDirection = "desc";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserStatistics {
        private long totalUsers;
        private long activeUsers;
        private long adminUsers;
        private long customerServiceUsers;
        private long newUsersThisMonth;
        private long lockedUsers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStatusUpdateRequest {
        @NotBlank(message = "状态不能为空")
        private String status;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchPermissionUpdateRequest {
        private Long[] userIds;
        private User.UserRole role;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserRoleUpdateRequest {
        @NotBlank(message = "角色不能为空")
        private String role; // admin, support, user
        private String reason; // 修改原因
    }
} 