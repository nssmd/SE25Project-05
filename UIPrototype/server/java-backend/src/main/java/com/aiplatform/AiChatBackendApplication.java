package com.aiplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableJpaAuditing
@EnableTransactionManagement
@EnableAsync
@EnableScheduling
public class AiChatBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiChatBackendApplication.class, args);
        System.out.println("=================================");
        System.out.println("🚀 AI Chat Backend Started Successfully!");
        System.out.println("📖 API Documentation: http://localhost:8080/api/swagger-ui.html");
        System.out.println("🔍 Health Check: http://localhost:8080/api/actuator/health");
        System.out.println("=================================");
    }
} 