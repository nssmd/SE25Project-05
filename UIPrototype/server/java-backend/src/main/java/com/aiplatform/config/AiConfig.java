package com.aiplatform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "ai")
@Data
public class AiConfig {
    
    private OpenRouter openrouter = new OpenRouter();
    private Local local = new Local();
    private DashScope dashscope = new DashScope();
    
    @Data
    public static class OpenRouter {
        /**
         * AI服务的基础URL
         */
        private String baseUrl = "https://openrouter.ai/api/v1";
        
        /**
         * AI服务的API密钥
         */
        private String apiKey = "";
        
        /**
         * 默认模型
         */
        private String defaultModel = "openai/gpt-4.1-nano";
        
        /**
         * 请求超时时间（毫秒）
         */
        private Integer timeout = 30000;
        
        /**
         * 最大tokens
         */
        private Integer maxTokens = 2000;
        
        /**
         * 温度参数
         */
        private Double temperature = 0.7;
    }
    
    @Data
    public static class Local {
        /**
         * 是否启用本地AI服务
         */
        private boolean enabled = true;
        
        /**
         * 本地AI服务URL
         */
        private String baseUrl = "http://202.120.38.3:55322";
        
        /**
         * 本地AI服务API密钥
         */
        private String apiKey = "";
        
        /**
         * 请求超时时间（毫秒）
         */
        private Integer timeout = 60000;
        
        /**
         * 最大tokens
         */
        private Integer maxTokens = 4000;
        
        /**
         * 温度参数
         */
        private Double temperature = 0.7;
    }
    
    @Data
    public static class DashScope {
        /**
         * 是否启用DashScope服务
         */
        private boolean enabled = true;
        
        /**
         * DashScope API密钥
         */
        private String apiKey = "";
        
        /**
         * 请求超时时间（毫秒）
         */
        private Integer timeout = 60000;
        
        /**
         * 默认模型
         */
        private String defaultModel = "wanx-v1";
        
        /**
         * 默认图片尺寸
         */
        private String defaultSize = "1024*1024";
        
        /**
         * 默认风格
         */
        private String defaultStyle = "<auto>";
    }
    
    // 兼容性方法
    public String getBaseUrl() {
        return openrouter.getBaseUrl();
    }
    
    public String getApiKey() {
        return openrouter.getApiKey();
    }
    
    public String getDefaultModel() {
        return openrouter.getDefaultModel();
    }
    
    public Integer getTimeout() {
        return openrouter.getTimeout();
    }
} 