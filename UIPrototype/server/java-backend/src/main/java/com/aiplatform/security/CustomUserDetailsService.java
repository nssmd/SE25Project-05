package com.aiplatform.security;

import com.aiplatform.entity.User;
import com.aiplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("=== CustomUserDetailsService.loadUserByUsername ===");
        log.info("加载用户: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + email));

        log.info("找到用户: id={}, email={}, username={}, role={}, status={}", 
                user.getId(), user.getEmail(), user.getUsername(), user.getRole(), user.getStatus());
        
        String authority = "ROLE_" + user.getRole().name();
        log.info("用户权限: {}", authority);
        
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority(authority)))
                .accountExpired(false)
                .accountLocked(user.getStatus() == User.UserStatus.banned)
                .credentialsExpired(false)
                .disabled(user.getStatus() != User.UserStatus.active)
                .build();
        
        log.info("用户详情构建完成: authorities={}", userDetails.getAuthorities());
        return userDetails;
    }
} 