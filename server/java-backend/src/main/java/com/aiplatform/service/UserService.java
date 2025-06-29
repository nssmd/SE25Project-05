package com.aiplatform.service;

import com.aiplatform.dto.UserDTO;
import com.aiplatform.entity.Chat;
import com.aiplatform.entity.User;
import com.aiplatform.exception.BusinessException;
import com.aiplatform.repository.ChatRepository;
import com.aiplatform.repository.MessageRepository;
import com.aiplatform.repository.UserRepository;
import com.aiplatform.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * 用户注册
     */
    public UserDTO.AuthResponse register(UserDTO.UserRegisterRequest request) {
        log.info("用户注册请求: email={}, username={}", request.getEmail(), request.getUsername());
        
        try {
            // 验证密码确认
            log.debug("验证密码确认");
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new BusinessException("两次输入的密码不一致");
            }
            
            // 检查邮箱是否已存在
            log.debug("检查邮箱是否已存在: {}", request.getEmail());
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("邮箱已被注册");
            }
            
            // 检查用户名是否已存在
            log.debug("检查用户名是否已存在: {}", request.getUsername());
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new BusinessException("用户名已被使用");
            }
            
            // 创建用户
            log.debug("创建用户对象");
            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(User.UserRole.user);
            user.setStatus(User.UserStatus.active);
            user.setPermissions("CHAT");
            
            log.debug("保存用户到数据库");
            user = userRepository.save(user);
            log.info("用户保存成功: id={}", user.getId());
            
            // 生成token
            log.debug("生成JWT token");
            String token = jwtTokenProvider.generateToken(user.getEmail());
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());
            
            log.debug("创建用户响应对象");
            UserDTO.UserResponse userResponse = UserDTO.UserResponse.fromEntity(user);
            
            log.info("用户注册完全成功: {}", user.getId());
            return new UserDTO.AuthResponse(token, refreshToken, userResponse);
            
        } catch (BusinessException e) {
            log.error("业务异常: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("注册过程中发生系统异常: ", e);
            throw e;
        }
    }

    /**
     * 用户登录
     */
    public UserDTO.AuthResponse login(UserDTO.UserLoginRequest request) {
        log.info("用户登录请求: {}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        // 检查账户状态
        if (user.getStatus() != User.UserStatus.active) {
            throw new BusinessException("账户已被禁用");
        }
        
        // 简化的状态检查
        if (user.getStatus() == User.UserStatus.banned) {
            throw new BusinessException("账户已被封禁");
        }
        
        try {
            // 验证密码
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // 更新最后登录时间
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
            
            // 登录成功后，触发自动清理（异步执行）
            triggerAutoCleanupForUser(user.getId());
            
            // 生成token
            String token = jwtTokenProvider.generateToken(user.getEmail());
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());
            
            UserDTO.UserResponse userResponse = UserDTO.UserResponse.fromEntity(user);
            log.info("用户登录成功: {}", user.getId());
            
            return new UserDTO.AuthResponse(token, refreshToken, userResponse);
            
        } catch (Exception e) {
            // 简化的错误处理
            log.warn("用户登录失败: {}", user.getEmail());
            throw new BusinessException("用户名或密码错误");
        }
    }

    /**
     * 登录时触发自动清理（异步执行）
     */
    @Async
    public void triggerAutoCleanupForUser(Long userId) {
        try {
            log.info("开始为用户 {} 执行登录自动清理", userId);
            
            // 计算30天前的时间
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            
            // 查找需要清理的聊天（非保护且超过30天）
            List<Chat> chatsToCleanup = chatRepository.findChatsToCleanup(userId, cutoffDate);
            
            if (!chatsToCleanup.isEmpty()) {
                int deletedChats = 0;
                for (Chat chat : chatsToCleanup) {
                    try {
                        // 删除聊天的所有消息
                        messageRepository.deleteByChatId(chat.getId());
                        // 删除聊天记录
                        chatRepository.delete(chat);
                        deletedChats++;
                    } catch (Exception e) {
                        log.warn("删除过期聊天失败 - chatId: {}, error: {}", chat.getId(), e.getMessage());
                    }
                }
                
                log.info("用户 {} 登录自动清理完成: 删除了 {} 个过期对话", userId, deletedChats);
            } else {
                log.info("用户 {} 没有需要清理的过期对话", userId);
            }
            
        } catch (Exception e) {
            log.error("用户 {} 登录自动清理失败: {}", userId, e.getMessage());
        }
    }

    /**
     * 获取当前用户信息
     */
    @Transactional(readOnly = true)
    public UserDTO.UserResponse getCurrentUser() {
        String email = getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        return UserDTO.UserResponse.fromEntity(user);
    }

    /**
     * 更新用户资料
     */
    public UserDTO.UserResponse updateProfile(UserDTO.UserProfileUpdateRequest request) {
        String email = getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        // 检查用户名是否被其他用户使用
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new BusinessException("用户名已被使用");
            }
            user.setUsername(request.getUsername());
        }
        
        if (request.getPermissions() != null) {
            user.setPermissions(request.getPermissions());
        }
        
        user = userRepository.save(user);
        log.info("用户资料更新成功: {}", user.getId());
        
        return UserDTO.UserResponse.fromEntity(user);
    }

    /**
     * 修改密码
     */
    public void changePassword(UserDTO.PasswordChangeRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("两次输入的新密码不一致");
        }
        
        String email = getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        // 验证当前密码
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException("当前密码错误");
        }
        
        // 检查新密码是否与当前密码相同
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BusinessException("新密码不能与当前密码相同");
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        log.info("用户密码修改成功: {}", user.getId());
    }

    /**
     * 搜索用户（管理员功能）
     */
    @Transactional(readOnly = true)
    public Page<UserDTO.UserResponse> searchUsers(UserDTO.UserSearchRequest request) {
        log.info("=== UserService.searchUsers 开始 ===");
        log.info("请求参数: keyword={}, page={}, size={}, sortBy={}, sortDirection={}", 
                request.getKeyword(), request.getPage(), request.getSize(), 
                request.getSortBy(), request.getSortDirection());
        
        // 检查当前用户权限
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("当前认证用户: name={}, authorities={}", auth.getName(), auth.getAuthorities());
        
        Sort sort = Sort.by(
            "desc".equalsIgnoreCase(request.getSortDirection()) ? 
            Sort.Direction.DESC : Sort.Direction.ASC,
            request.getSortBy()
        );
        
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);
        Page<User> users;
        
        if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
            log.info("根据关键字搜索用户: {}", request.getKeyword());
            users = userRepository.searchUsers(request.getKeyword(), pageable);
        } else {
            log.info("查询所有用户");
            users = userRepository.findAll(pageable);
        }
        
        log.info("查询结果: 总数={}, 当前页数量={}", users.getTotalElements(), users.getNumberOfElements());
        
        if (users.hasContent()) {
            users.getContent().forEach(user -> {
                log.info("用户: id={}, email={}, username={}, role={}, status={}", 
                        user.getId(), user.getEmail(), user.getUsername(), 
                        user.getRole(), user.getStatus());
            });
        }
        
        Page<UserDTO.UserResponse> result = users.map(UserDTO.UserResponse::fromEntity);
        log.info("=== UserService.searchUsers 结束 ===");
        return result;
    }

    /**
     * 更新用户状态（管理员功能）
     */
    public void updateUserStatus(Long userId, UserDTO.UserStatusUpdateRequest request) {
        log.info("=== UserService.updateUserStatus 开始 ===");
        log.info("请求参数: userId={}, status={}", userId, request.getStatus());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        log.info("找到用户: id={}, email={}, 当前状态={}", user.getId(), user.getEmail(), user.getStatus());
        
        // 枚举值应该用小写，所以用toLowerCase()而不是toUpperCase()
        User.UserStatus newStatus;
        try {
            newStatus = User.UserStatus.valueOf(request.getStatus().toLowerCase());
        } catch (IllegalArgumentException e) {
            log.error("无效的状态值: {}", request.getStatus());
            throw new BusinessException("无效的状态值: " + request.getStatus());
        }
        
        log.info("状态转换: {} -> {}", user.getStatus(), newStatus);
        user.setStatus(newStatus);
        
        user = userRepository.save(user);
        log.info("用户状态更新成功: 用户ID={}, 新状态={}, 原因={}", userId, newStatus, request.getReason());
        log.info("=== UserService.updateUserStatus 结束 ===");
    }

    /**
     * 获取用户统计信息
     */
    @Transactional(readOnly = true)
    public UserDTO.UserStatistics getUserStatistics() {
        UserDTO.UserStatistics stats = new UserDTO.UserStatistics();
        
        stats.setTotalUsers(userRepository.count());
        stats.setActiveUsers(userRepository.countByStatus(User.UserStatus.active));
        stats.setAdminUsers(userRepository.countByRole(User.UserRole.admin));
        stats.setCustomerServiceUsers(userRepository.countByRole(User.UserRole.support));
        
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        stats.setNewUsersThisMonth(userRepository.countByCreatedAtAfter(monthStart));
        stats.setLockedUsers(userRepository.countByStatus(User.UserStatus.banned));
        
        return stats;
    }

    /**
     * 获取当前登录用户的邮箱
     */
    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException("用户未登录");
        }
        return authentication.getName();
    }

    /**
     * 根据邮箱查找用户
     */
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * 修改用户角色
     */
    @Transactional
    public UserDTO.UserResponse updateUserRole(Long userId, UserDTO.UserRoleUpdateRequest request) {
        log.info("开始修改用户 {} 的角色为: {}", userId, request.getRole());
        
        // 查找目标用户
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        // 验证角色
        User.UserRole newRole;
        try {
            newRole = User.UserRole.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("无效的角色类型: " + request.getRole());
        }
        
        // 记录角色变更
        User.UserRole oldRole = user.getRole();
        log.info("用户 {} ({}) 角色变更: {} -> {}, 原因: {}", 
                user.getUsername(), user.getEmail(), oldRole, newRole, request.getReason());
        
        // 更新角色
        user.setRole(newRole);
        
        // 根据新角色设置相应的权限
        switch (newRole) {
            case admin:
                user.setPermissions("ALL");
                break;
            case support:
                user.setPermissions("SUPPORT");
                break;
            case user:
                user.setPermissions("CHAT");
                break;
        }
        
        // 保存用户
        user = userRepository.save(user);
        
        log.info("用户角色修改成功: {} -> {}", oldRole, newRole);
        
        return UserDTO.UserResponse.fromEntity(user);
    }

} 