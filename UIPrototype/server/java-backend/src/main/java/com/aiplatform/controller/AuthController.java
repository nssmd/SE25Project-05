package com.aiplatform.controller;

import com.aiplatform.dto.UserDTO;
import com.aiplatform.exception.BusinessException;
import com.aiplatform.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@Tag(name = "认证管理", description = "用户认证相关接口")
public class AuthController {

    private final UserService userService;

    @Operation(summary = "用户注册", description = "新用户注册接口")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserDTO.UserRegisterRequest request) {
        try {
            log.info("收到用户注册请求: email={}, username={}", request.getEmail(), request.getUsername());
            UserDTO.AuthResponse response = userService.register(request);
            log.info("用户注册成功返回: {}", response.getUser().getEmail());
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            log.error("注册业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("注册系统异常: ", e);
            e.printStackTrace(); // 打印完整堆栈跟踪
            return ResponseEntity.internalServerError().body(new ErrorResponse("注册失败，请稍后重试"));
        }
    }

    @Operation(summary = "用户登录", description = "用户登录接口")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody UserDTO.UserLoginRequest request) {
        try {
            log.info("收到用户登录请求: {}", request.getEmail());
            UserDTO.AuthResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            log.error("登录业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("登录系统异常: ", e);
            return ResponseEntity.internalServerError().body(new ErrorResponse("登录失败，请稍后重试"));
        }
    }

    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的详细信息")
    @GetMapping("/me")
    public ResponseEntity<UserDTO.UserResponse> getCurrentUser() {
        UserDTO.UserResponse response = userService.getCurrentUser();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "更新用户资料", description = "更新当前用户的个人资料")
    @PutMapping("/profile")
    public ResponseEntity<UserDTO.UserResponse> updateProfile(@Valid @RequestBody UserDTO.UserProfileUpdateRequest request) {
        UserDTO.UserResponse response = userService.updateProfile(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "修改密码", description = "修改当前用户的登录密码")
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody UserDTO.PasswordChangeRequest request) {
        try {
            log.info("收到密码修改请求");
            userService.changePassword(request);
            log.info("密码修改成功");
            return ResponseEntity.ok("密码修改成功");
        } catch (BusinessException e) {
            log.error("密码修改业务异常: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("密码修改系统异常: ", e);
            return ResponseEntity.internalServerError().body(new ErrorResponse("密码修改失败，请稍后重试"));
        }
    }

    @Operation(summary = "用户登出", description = "用户登出接口")
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // JWT是无状态的，登出主要在前端处理（删除token）
        // 这里可以添加黑名单逻辑或其他处理
        return ResponseEntity.ok("登出成功");
    }

    // 错误响应类
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
} 