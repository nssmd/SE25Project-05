package com.aiplatform.controller;

import com.aiplatform.entity.Chat;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.entity.User;
import com.aiplatform.security.JwtTokenProvider;
import com.aiplatform.service.ChatService;
import com.aiplatform.service.DashScopeImageService;
import com.aiplatform.service.MessageService;
import com.aiplatform.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.mockito.Mockito;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = {
        ImageGenerationController.class, 
        ImageGenerationControllerTest.TestConfig.class,
        ImageGenerationControllerTest.TestSecurityConfig.class
    }
)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.jpa.show-sql=false"
})
public class ImageGenerationControllerTest {

    @Configuration
    @EnableAutoConfiguration(exclude = {
        HibernateJpaAutoConfiguration.class,
        DataSourceAutoConfiguration.class,
        JpaRepositoriesAutoConfiguration.class
    })
    static class TestConfig {
    }

    @Configuration
    @EnableWebSecurity
    static class TestSecurityConfig {

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                    .anyRequest().permitAll()
                )
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(HttpServletRequest request, 
                                                 HttpServletResponse response, 
                                                 FilterChain filterChain) throws ServletException, IOException {
                        // 跳过JWT验证，直接放行
                        filterChain.doFilter(request, response);
                    }
                }, UsernamePasswordAuthenticationFilter.class);
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashScopeImageService dashScopeImageService;

    @MockBean
    private MessageService messageService;

    @MockBean
    private ChatService chatService;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testBasicConfiguration() {
        System.out.println("✅ ImageGenerationControllerTest 基础配置测试通过");
    }

//    @Test
//    public void testGenerateTextToImage_success() throws Exception {
//        // 模拟 JWT Token
//        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
//                .thenReturn("test@example.com");
//
//        // 模拟用户
//        User testUser = createUser();
//        Mockito.when(userService.findByEmail("test@example.com"))
//                .thenReturn(Optional.of(testUser));
//
//        // 模拟聊天
//        Chat chat = createChat();
//        Mockito.when(chatService.getChatById(1L))
//                .thenReturn(chat);
//
//        // 模拟消息
//        Message message = createMessage();
//        Mockito.when(messageService.saveMessage(any(Message.class)))
//                .thenReturn(message);
//
//        // 模拟图片生成
//        MessageAttachment attachment = createMessageAttachment();
//        Mockito.when(dashScopeImageService.isAvailable())
//                .thenReturn(true);
//        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
//                .thenReturn(attachment);
//
//        Map<String, Object> request = new HashMap<>();
//        request.put("prompt", "一只可爱的小猫");
//        request.put("size", "1024x1024");
//        request.put("style", "realistic");
//        request.put("chatId", 1L);
//
//        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
//                        .header("Authorization", "Bearer valid-token")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(request)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.success").value(true))
//                .andExpect(jsonPath("$.message").value("图片生成成功"))
//                .andExpect(jsonPath("$.imageUrl").value("http://localhost:8080/api/files/test-image.jpg"))
//                .andExpect(jsonPath("$.messageId").value(1))
//                .andExpect(jsonPath("$.attachmentId").value(1));
//
//        System.out.println("✅ 文生图测试通过");
//    }

    @Test
    public void testGenerateTextToImage_emptyPrompt() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("提示词不能为空"));

        System.out.println("✅ 文生图（空提示词）测试通过");
    }

    @Test
    public void testGenerateTextToImage_serviceUnavailable() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟服务不可用
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(false);

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图像生成服务不可用"));

        System.out.println("✅ 文生图（服务不可用）测试通过");
    }

    @Test
    public void testGenerateTextToImage_createNewChat() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天不存在，需要创建新聊天
        Mockito.when(chatService.getChatById(999L))
                .thenThrow(new RuntimeException("聊天不存在"));

        Chat newChat = createChat();
        newChat.setId(2L);
        Mockito.when(chatService.createChat(anyLong(), anyString(), any(Chat.AiType.class)))
                .thenReturn(newChat);

        // 模拟消息
        Message message = createMessage();
        message.setId(2L);
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成
        MessageAttachment attachment = createMessageAttachment();
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(attachment);

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 999L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ 文生图（创建新聊天）测试通过");
    }

    @Test
    public void testGenerateImageToImage_success() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成
        MessageAttachment attachment = createMessageAttachment();
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateImageToImage(anyString(), anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(attachment);

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("referenceImageUrl", "http://example.com/reference.jpg");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/image-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("图片生成成功"));

        System.out.println("✅ 图生图测试通过");
    }

    @Test
    public void testGenerateImageToImage_emptyReferenceImage() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("referenceImageUrl", "");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/image-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("参考图片不能为空"));

        System.out.println("✅ 图生图（空参考图片）测试通过");
    }

    @Test
    public void testGetSupportedSizes_success() throws Exception {
        // 模拟支持的尺寸
        List<String> sizes = Arrays.asList("512x512", "1024x1024", "1024x1792", "1792x1024");
        Mockito.when(dashScopeImageService.getSupportedSizes())
                .thenReturn(sizes);

        mockMvc.perform(MockMvcRequestBuilders.get("/image/supported-sizes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sizes").isArray())
                .andExpect(jsonPath("$.sizes.length()").value(4))
                .andExpect(jsonPath("$.sizes[0]").value("512x512"))
                .andExpect(jsonPath("$.sizes[1]").value("1024x1024"));

        System.out.println("✅ 获取支持的尺寸测试通过");
    }

    @Test
    public void testGetSupportedStyles_success() throws Exception {
        // 模拟支持的风格
        List<String> styles = Arrays.asList("realistic", "cartoon", "anime", "oil-painting");
        Mockito.when(dashScopeImageService.getSupportedStyles())
                .thenReturn(styles);

        mockMvc.perform(MockMvcRequestBuilders.get("/image/supported-styles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.styles").isArray())
                .andExpect(jsonPath("$.styles.length()").value(4))
                .andExpect(jsonPath("$.styles[0]").value("realistic"))
                .andExpect(jsonPath("$.styles[1]").value("cartoon"));

        System.out.println("✅ 获取支持的风格测试通过");
    }

    @Test
    public void testGetStatus_available() throws Exception {
        // 模拟服务可用
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);

        mockMvc.perform(MockMvcRequestBuilders.get("/image/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.service").value("DashScope"))
                .andExpect(jsonPath("$.message").value("服务可用"));

        System.out.println("✅ 获取服务状态（可用）测试通过");
    }

    @Test
    public void testGetStatus_unavailable() throws Exception {
        // 模拟服务不可用
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(false);

        mockMvc.perform(MockMvcRequestBuilders.get("/image/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false))
                .andExpect(jsonPath("$.service").value("DashScope"))
                .andExpect(jsonPath("$.message").value("服务不可用"));

        System.out.println("✅ 获取服务状态（不可用）测试通过");
    }

    @Test
    public void testGenerateTextToImage_generationFailed() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成失败
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(null);

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败"));

        System.out.println("✅ 文生图（生成失败）测试通过");
    }

    @Test
    public void testGenerateTextToImage_invalidToken() throws Exception {
        // 模拟无效的 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("invalid-token"))
                .thenThrow(new RuntimeException("Invalid token"));

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer invalid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: Invalid token"));

        System.out.println("✅ 文生图（无效Token）测试通过");
    }

    @Test
    public void testGenerateTextToImage_userNotFound() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("nonexistent@example.com");

        // 模拟DashScope服务可用
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        // 模拟聊天不存在，抛出异常
        Mockito.when(chatService.getChatById(1L))
                .thenThrow(new RuntimeException("聊天不存在"));
        // 模拟用户不存在
        Mockito.when(userService.findByEmail("nonexistent@example.com"))
                .thenReturn(Optional.empty());

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: 用户不存在"));

        System.out.println("✅ 文生图（用户不存在）测试通过");
    }

    @Test
    public void testGenerateTextToImage_chatNotFound() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天不存在，抛出异常
        Mockito.when(chatService.getChatById(999L))
                .thenThrow(new RuntimeException("聊天会话不存在"));

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 999L);

        // 模拟创建新聊天
        Chat newChat = createChat();
        newChat.setId(999L);
        Mockito.when(chatService.createChat(any(), anyString(), any()))
                .thenReturn(newChat);

        // 模拟消息
        Message message = createMessage();
        message.setChatId(999L);
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成
        MessageAttachment attachment = createMessageAttachment();
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(attachment);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ 文生图（聊天不存在）测试通过");
    }

    @Test
    public void testGenerateTextToImage_invalidSize() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟DashScope服务可用，但在生成时抛出异常
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenThrow(new RuntimeException("不支持的图片尺寸"));

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "invalid-size");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: 不支持的图片尺寸"));

        System.out.println("✅ 文生图（无效尺寸）测试通过");
    }

    @Test
    public void testGenerateTextToImage_invalidStyle() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟DashScope服务可用，但在生成时抛出异常
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenThrow(new RuntimeException("不支持的图片风格"));

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "1024x1024");
        request.put("style", "invalid-style");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: 不支持的图片风格"));

        System.out.println("✅ 文生图（无效风格）测试通过");
    }

    @Test
    public void testGenerateTextToImage_serviceException() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟服务异常
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenThrow(new RuntimeException("服务异常"));

        Map<String, Object> request = new HashMap<>();
        request.put("prompt", "一只可爱的小猫");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: 服务异常"));

        System.out.println("✅ 文生图（服务异常）测试通过");
    }

    @Test
    public void testGenerateTextToImage_differentSizes() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成
        MessageAttachment attachment = createMessageAttachment();
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(attachment);

        String[] sizes = {"1024x1024", "1024x1792", "1792x1024"};
        for (String size : sizes) {
            Map<String, Object> request = new HashMap<>();
            request.put("prompt", "一只可爱的小猫");
            request.put("size", size);
            request.put("style", "realistic");
            request.put("chatId", 1L);

            mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                            .header("Authorization", "Bearer valid-token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        System.out.println("✅ 文生图（不同尺寸）测试通过");
    }

    @Test
    public void testGenerateTextToImage_differentStyles() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成
        MessageAttachment attachment = createMessageAttachment();
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(attachment);

        String[] styles = {"realistic", "cartoon", "oil-painting", "watercolor"};
        for (String style : styles) {
            Map<String, Object> request = new HashMap<>();
            request.put("prompt", "一只可爱的小猫");
            request.put("size", "1024x1024");
            request.put("style", style);
            request.put("chatId", 1L);

            mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                            .header("Authorization", "Bearer valid-token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        System.out.println("✅ 文生图（不同风格）测试通过");
    }

    @Test
    public void testGenerateImageToImage_invalidToken() throws Exception {
        // 模拟无效的 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("invalid-token"))
                .thenThrow(new RuntimeException("Invalid token"));

        Map<String, Object> request = new HashMap<>();
        request.put("referenceImageUrl", "base64-image-data");
        request.put("prompt", "修改后的图片");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/image-to-image")
                        .header("Authorization", "Bearer invalid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: Invalid token"));

        System.out.println("✅ 图生图（无效Token）测试通过");
    }

    @Test
    public void testGenerateImageToImage_userNotFound() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("nonexistent@example.com");

        // 模拟DashScope服务可用
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        // 模拟聊天不存在，抛出异常
        Mockito.when(chatService.getChatById(1L))
                .thenThrow(new RuntimeException("聊天不存在"));
        // 模拟用户不存在
        Mockito.when(userService.findByEmail("nonexistent@example.com"))
                .thenReturn(Optional.empty());

        Map<String, Object> request = new HashMap<>();
        request.put("referenceImageUrl", "base64-image-data");
        request.put("prompt", "修改后的图片");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/image-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: 用户不存在"));

        System.out.println("✅ 图生图（用户不存在）测试通过");
    }

    @Test
    public void testGenerateImageToImage_serviceException() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟服务异常
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateImageToImage(anyString(), anyString(), anyString(), anyString(), any(Message.class)))
                .thenThrow(new RuntimeException("服务异常"));

        Map<String, Object> request = new HashMap<>();
        request.put("referenceImageUrl", "base64-image-data");
        request.put("prompt", "修改后的图片");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/image-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: 服务异常"));

        System.out.println("✅ 图生图（服务异常）测试通过");
    }

    @Test
    public void testGenerateImageToImage_invalidSize() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟DashScope服务可用，但在生成时抛出异常
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateImageToImage(anyString(), anyString(), anyString(), anyString(), any(Message.class)))
                .thenThrow(new RuntimeException("不支持的图片尺寸"));

        Map<String, Object> request = new HashMap<>();
        request.put("referenceImageUrl", "base64-image-data");
        request.put("prompt", "修改后的图片");
        request.put("size", "invalid-size");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/image-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: 不支持的图片尺寸"));

        System.out.println("✅ 图生图（无效尺寸）测试通过");
    }

    @Test
    public void testGenerateImageToImage_invalidStyle() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟DashScope服务可用，但在生成时抛出异常
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateImageToImage(anyString(), anyString(), anyString(), anyString(), any(Message.class)))
                .thenThrow(new RuntimeException("不支持的图片风格"));

        Map<String, Object> request = new HashMap<>();
        request.put("referenceImageUrl", "base64-image-data");
        request.put("prompt", "修改后的图片");
        request.put("size", "1024x1024");
        request.put("style", "invalid-style");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/image-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("图片生成失败: 不支持的图片风格"));

        System.out.println("✅ 图生图（无效风格）测试通过");
    }

    @Test
    public void testGenerateImageToImage_chatNotFound() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟DashScope服务可用
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);

        // 模拟聊天不存在
        Mockito.when(chatService.getChatById(999L))
                .thenThrow(new RuntimeException("聊天会话不存在"));

        // 模拟创建新聊天
        Chat newChat = createChat();
        newChat.setId(999L);
        Mockito.when(chatService.createChat(any(), anyString(), any()))
                .thenReturn(newChat);

        // 模拟消息
        Message message = createMessage();
        message.setChatId(999L);
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成
        MessageAttachment attachment = createMessageAttachment();
        Mockito.when(dashScopeImageService.generateImageToImage(anyString(), anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(attachment);

        Map<String, Object> request = new HashMap<>();
        request.put("referenceImageUrl", "base64-image-data");
        request.put("prompt", "修改后的图片");
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 999L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/image-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ 图生图（聊天不存在）测试通过");
    }

    @Test
    public void testGenerateTextToImage_longPrompt() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成
        MessageAttachment attachment = createMessageAttachment();
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(attachment);

        // 长提示词
        String longPrompt = "一只非常可爱的小猫，坐在花园里，阳光明媚，背景是美丽的花朵，小猫有着金色的毛发，蓝色的眼睛，正在好奇地看着前方，整体画面温馨和谐，适合作为桌面壁纸使用";
        
        Map<String, Object> request = new HashMap<>();
        request.put("prompt", longPrompt);
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ 文生图（长提示词）测试通过");
    }

    @Test
    public void testGenerateTextToImage_specialCharacters() throws Exception {
        // 模拟 JWT Token
        Mockito.when(jwtTokenProvider.getEmailFromToken("valid-token"))
                .thenReturn("test@example.com");

        // 模拟用户
        User testUser = createUser();
        Mockito.when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // 模拟聊天
        Chat chat = createChat();
        Mockito.when(chatService.getChatById(1L))
                .thenReturn(chat);

        // 模拟消息
        Message message = createMessage();
        Mockito.when(messageService.saveMessage(any(Message.class)))
                .thenReturn(message);

        // 模拟图片生成
        MessageAttachment attachment = createMessageAttachment();
        Mockito.when(dashScopeImageService.isAvailable())
                .thenReturn(true);
        Mockito.when(dashScopeImageService.generateTextToImage(anyString(), anyString(), anyString(), any(Message.class)))
                .thenReturn(attachment);

        // 包含特殊字符的提示词
        String specialPrompt = "一只可爱的小猫@#$%^&*()_+{}|:<>?[]\\;'\",./";
        
        Map<String, Object> request = new HashMap<>();
        request.put("prompt", specialPrompt);
        request.put("size", "1024x1024");
        request.put("style", "realistic");
        request.put("chatId", 1L);

        mockMvc.perform(MockMvcRequestBuilders.post("/image/text-to-image")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ 文生图（特殊字符）测试通过");
    }

    // 辅助方法：创建测试用户对象
    private User createUser() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setUsername("testuser");
        return user;
    }

    // 辅助方法：创建测试聊天对象
    private Chat createChat() {
        Chat chat = new Chat();
        chat.setId(1L);
        chat.setUserId(1L);
        chat.setTitle("智能生图");
        chat.setAiType(Chat.AiType.text_to_image);
        chat.setCreatedAt(LocalDateTime.now());
        chat.setLastActivity(LocalDateTime.now());
        return chat;
    }

    // 辅助方法：创建测试消息对象
    private Message createMessage() {
        Message message = new Message();
        message.setId(1L);
        message.setChatId(1L);
        message.setContent("【图像生成】一只可爱的小猫");
        message.setRole(Message.MessageRole.user);
        message.setCreatedAt(LocalDateTime.now());
        return message;
    }

    // 辅助方法：创建测试附件对象
    private MessageAttachment createMessageAttachment() {
        return MessageAttachment.builder()
                .id(1L)
                .messageId(1L)
                .fileName("test-image.jpg")
                .originalName("generated-image.jpg")
                .filePath("/uploads/test-image.jpg")
                .fileSize(1024L)
                .mimeType("image/jpeg")
                .attachmentType(MessageAttachment.AttachmentType.IMAGE)
                .width(1024)
                .height(1024)
                .createdAt(LocalDateTime.now())
                .build();
    }
} 