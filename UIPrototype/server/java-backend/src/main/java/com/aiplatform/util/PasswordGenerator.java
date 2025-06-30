package com.aiplatform.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String adminPassword = "admin123456";
        String servicePassword = "service123456";
        
        System.out.println("=== 密码加密结果 ===");
        System.out.println("管理员密码 (admin123456):");
        System.out.println(encoder.encode(adminPassword));
        System.out.println();
        System.out.println("客服密码 (service123456):");
        System.out.println(encoder.encode(servicePassword));
        System.out.println();
        System.out.println("请复制上面的加密密码到init-users.sql文件中");
    }
} 