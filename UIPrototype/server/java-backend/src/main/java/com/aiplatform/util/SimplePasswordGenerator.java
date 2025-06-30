package com.aiplatform.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class SimplePasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password = "123456";
        
        System.out.println("=== 为密码 123456 生成BCrypt哈希 ===");
        System.out.println("管理员密码哈希:");
        System.out.println(encoder.encode(password));
        System.out.println();
        System.out.println("客服密码哈希:");
        System.out.println(encoder.encode(password));
        System.out.println();
        System.out.println("注意：每次运行都会生成不同的哈希值，但都能验证密码123456");
    }
} 