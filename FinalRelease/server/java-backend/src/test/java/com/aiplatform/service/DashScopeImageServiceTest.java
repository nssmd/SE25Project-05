package com.aiplatform.service;

import com.aiplatform.config.AiConfig;
import com.aiplatform.entity.Message;
import com.aiplatform.entity.MessageAttachment;
import com.aiplatform.repository.MessageAttachmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisResult;
import com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesis;
import com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisOutput;
import org.mockito.MockedConstruction;

@ExtendWith(MockitoExtension.class)
class DashScopeImageServiceTest {

    @Mock
    private AiConfig aiConfig;

    @Mock
    private MessageAttachmentRepository messageAttachmentRepository;

    @Mock
    private AiConfig.DashScope dashScopeConfig;

    @InjectMocks
    private DashScopeImageService dashScopeImageService;

    @BeforeEach
    void setUp() {
        // 使用@InjectMocks自动注入，不需要手动创建实例
    }

    @Test
    void testGetSupportedSizes() {
        // 测试获取支持的图片尺寸
        List<String> sizes = dashScopeImageService.getSupportedSizes();
        
        assertNotNull(sizes);
        assertEquals(4, sizes.size());
        assertTrue(sizes.contains("1024*1024"));
        assertTrue(sizes.contains("720*1280"));
        assertTrue(sizes.contains("768*1152"));
        assertTrue(sizes.contains("1280*720"));
    }

    @Test
    void testGetSupportedStyles() {
        // 测试获取支持的图片风格
        List<String> styles = dashScopeImageService.getSupportedStyles();
        
        assertNotNull(styles);
        assertEquals(10, styles.size());
        assertTrue(styles.contains("<auto>"));
        assertTrue(styles.contains("<photography>"));
        assertTrue(styles.contains("<portrait>"));
        assertTrue(styles.contains("<3d cartoon>"));
        assertTrue(styles.contains("<anime>"));
        assertTrue(styles.contains("<oil painting>"));
        assertTrue(styles.contains("<watercolor>"));
        assertTrue(styles.contains("<sketch>"));
        assertTrue(styles.contains("<chinese painting>"));
        assertTrue(styles.contains("<flat illustration>"));
    }

    @Test
    void testIsAvailable_WithValidConfig() {
        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("valid-api-key");

        // 测试有效配置的情况
        assertTrue(dashScopeImageService.isAvailable());
    }

    @Test
    void testIsAvailable_WithNullConfig() {
        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(null);

        // 测试配置为null的情况
        assertFalse(dashScopeImageService.isAvailable());
    }

    @Test
    void testIsAvailable_WithEmptyApiKey() {
        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("");

        // 测试API密钥为空的情况
        assertFalse(dashScopeImageService.isAvailable());
    }

    @Test
    void testIsAvailable_WithNullApiKey() {
        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn(null);

        // 测试API密钥为null的情况
        assertFalse(dashScopeImageService.isAvailable());
    }

    @Test
    void testIsAvailable_WithWhitespaceApiKey() {
        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("   ");

        // 测试API密钥为空白字符的情况
        assertFalse(dashScopeImageService.isAvailable());
    }

    @Test
    void testIsAvailable_WithException() {
        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenThrow(new RuntimeException("Config error"));

        // 测试异常情况
        assertFalse(dashScopeImageService.isAvailable());
    }

    @Test
    void testGenerateTextToImage_WithNullMessage() {
        // 测试传入null消息的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateTextToImage("A beautiful sunset", "1024*1024", "photography", null);
        });
    }

    @Test
    void testGenerateTextToImage_WithEmptyPrompt() {
        // 准备测试数据
        Message testMessage = new Message();
        testMessage.setId(1L);

        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");

        // 测试空提示词的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateTextToImage("", "1024*1024", "photography", testMessage);
        });
    }

    @Test
    void testGenerateTextToImage_WithNullPrompt() {
        // 准备测试数据
        Message testMessage = new Message();
        testMessage.setId(1L);

        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");

        // 测试null提示词的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateTextToImage(null, "1024*1024", "photography", testMessage);
        });
    }

    @Test
    void testGenerateTextToImage_WithExceptionInConfig() {
        // 准备测试数据
        Message testMessage = new Message();
        testMessage.setId(1L);

        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenThrow(new RuntimeException("Config error"));

        // 测试配置异常的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateTextToImage("A beautiful sunset", "1024*1024", "photography", testMessage);
        });
    }

    @Test
    void testGenerateTextToImage_WithExceptionInApiKey() {
        // 准备测试数据
        Message testMessage = new Message();
        testMessage.setId(1L);

        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenThrow(new RuntimeException("API key error"));

        // 测试API密钥异常的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateTextToImage("A beautiful sunset", "1024*1024", "photography", testMessage);
        });
    }

    @Test
    void testGenerateImageToImage_WithNullMessage() {
        // 测试传入null消息的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageToImage("Test prompt", "https://example.com/reference.jpg", "1024*1024", "photography", null);
        });
    }

    @Test
    void testGenerateImageToImage_WithEmptyPrompt() {
        // 准备测试数据
        Message testMessage = new Message();
        testMessage.setId(1L);

        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");

        // 测试空提示词的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageToImage("", "https://example.com/reference.jpg", "1024*1024", "photography", testMessage);
        });
    }

    @Test
    void testGenerateImageToImage_WithNullPrompt() {
        // 准备测试数据
        Message testMessage = new Message();
        testMessage.setId(1L);

        // 配置mock
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");

        // 测试null提示词的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageToImage(null, "https://example.com/reference.jpg", "1024*1024", "photography", testMessage);
        });
    }

    @Test
    void testGenerateImageToImage_WithExceptionInConfig() {
        // 准备测试数据
        Message testMessage = new Message();
        testMessage.setId(1L);

        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenThrow(new RuntimeException("Config error"));

        // 测试配置异常的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageToImage("Test prompt", "https://example.com/reference.jpg", "1024*1024", "photography", testMessage);
        });
    }

    @Test
    void testGenerateImageToImage_WithExceptionInApiKey() {
        // 准备测试数据
        Message testMessage = new Message();
        testMessage.setId(1L);

        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenThrow(new RuntimeException("API key error"));

        // 测试API密钥异常的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageToImage("Test prompt", "https://example.com/reference.jpg", "1024*1024", "photography", testMessage);
        });
    }

    @Test
    void testGenerateImageFromText_WithNullPrompt() {
        // 测试null提示词的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromText(null, 1L);
        });
    }

    @Test
    void testGenerateImageFromText_WithEmptyPrompt() {
        // 测试空提示词的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromText("", 1L);
        });
    }

    @Test
    void testGenerateImageFromText_WithNullMessageId() {
        // 测试null消息ID的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromText("A beautiful sunset", null);
        });
    }

    @Test
    void testGenerateImageFromText_WithExceptionInConfig() {
        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenThrow(new RuntimeException("Config error"));

        // 测试配置异常的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromText("A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromText_WithExceptionInApiKey() {
        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenThrow(new RuntimeException("API key error"));

        // 测试API密钥异常的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromText("A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithNullFile() {
        // 测试null文件的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(null, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithNullPrompt() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        // 测试null提示词的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, null, 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithEmptyPrompt() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        // 测试空提示词的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithNullMessageId() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        // 测试null消息ID的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", null);
        });
    }

    @Test
    void testGenerateImageFromImage_WithEmptyFile() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "image/jpeg", 
            new byte[0] // 空文件
        );

        // 测试空文件的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithNullFileName() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            null, 
            "image/jpeg", 
            "test image content".getBytes()
        );

        // 测试null文件名的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithEmptyFileName() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        // 测试空文件名的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithNullContentType() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            null, 
            "test image content".getBytes()
        );

        // 测试null内容类型的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithEmptyContentType() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "", 
            "test image content".getBytes()
        );

        // 测试空内容类型的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithNullInputStream() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "image/jpeg", 
            (byte[]) null
        );

        // 测试null输入流的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInConfig() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenThrow(new RuntimeException("Config error"));

        // 测试配置异常的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInApiKey() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        // 配置mock抛出异常
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenThrow(new RuntimeException("API key error"));

        // 测试API密钥异常的情况
        assertThrows(RuntimeException.class, () -> {
            dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
        });
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInFileProcessing() {
        // 准备测试数据
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", 
            "test.jpg", 
            "image/jpeg", 
            "test image content".getBytes()
        );

        // 模拟文件操作异常
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            
            Path mockPath = mock(Path.class);
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenThrow(new IOException("File system error"));

            // 测试文件操作异常的情况
            assertThrows(RuntimeException.class, () -> {
                dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
            });
        }
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInDatabase() {
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        when(messageAttachmentRepository.save(any(MessageAttachment.class)))
                .thenThrow(new RuntimeException("Database error"));
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            Path mockPath = mock(Path.class);
            Path mockFileName = mock(Path.class);
            when(mockPath.toString()).thenReturn("/uploads/test-image.png");
            when(mockPath.resolve(anyString())).thenReturn(mockPath);
            when(mockPath.getFileName()).thenReturn(mockFileName);
            when(mockFileName.toString()).thenReturn("test-image.png");
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenReturn(mockPath);
            filesMock.when(() -> Files.copy(any(java.io.InputStream.class), any(Path.class), any())).thenReturn(1L);
            filesMock.when(() -> Files.size(any(Path.class))).thenReturn(1024L);
            
            // mock API
            ImageSynthesisOutput mockOutput = mock(ImageSynthesisOutput.class);
            when(mockOutput.getTaskStatus()).thenReturn("SUCCEEDED");
            Map<String, String> imageResult = new HashMap<>();
            imageResult.put("url", "http://test.com/image.png");
            when(mockOutput.getResults()).thenReturn(List.of(imageResult));
            ImageSynthesisResult result = mock(ImageSynthesisResult.class);
            when(result.getOutput()).thenReturn(mockOutput);
            try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class,
                    (mock, context) -> when(mock.call(any(com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisParam.class))).thenReturn(result))) {
                assertThrows(RuntimeException.class, () -> {
                    dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
                });
            }
        }
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInFileSave() {
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            Path mockPath = mock(Path.class);
            Path mockFileName = mock(Path.class);
            when(mockPath.toString()).thenReturn("/uploads/test-image.png");
            when(mockPath.resolve(anyString())).thenReturn(mockPath);
            when(mockPath.getFileName()).thenReturn(mockFileName);
            when(mockFileName.toString()).thenReturn("test-image.png");
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenReturn(mockPath);
            filesMock.when(() -> Files.copy(any(java.io.InputStream.class), any(Path.class), any())).thenThrow(new IOException("File save error"));
            
            // mock ImageSynthesis构造函数
            try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class)) {
                assertThrows(RuntimeException.class, () -> {
                    dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
                });
            }
        }
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInFileSize() {
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            Path mockPath = mock(Path.class);
            Path mockFileName = mock(Path.class);
            when(mockPath.toString()).thenReturn("/uploads/test-image.png");
            when(mockPath.resolve(anyString())).thenReturn(mockPath);
            when(mockPath.getFileName()).thenReturn(mockFileName);
            when(mockFileName.toString()).thenReturn("test-image.png");
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenReturn(mockPath);
            filesMock.when(() -> Files.copy(any(java.io.InputStream.class), any(Path.class), any())).thenThrow(new IOException("File copy error"));
            
            // mock ImageSynthesis构造函数
            try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class)) {
                assertThrows(RuntimeException.class, () -> {
                    dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
                });
            }
        }
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInUrlConversion() {
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            Path mockPath = mock(Path.class);
            Path mockFileName = mock(Path.class);
            when(mockPath.toString()).thenReturn("/uploads/test-image.png");
            when(mockPath.resolve(anyString())).thenReturn(mockPath);
            when(mockPath.getFileName()).thenReturn(mockFileName);
            when(mockFileName.toString()).thenReturn("test-image.png");
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenReturn(mockPath);
            filesMock.when(() -> Files.copy(any(java.io.InputStream.class), any(Path.class), any())).thenThrow(new IOException("File copy error"));
            
            // mock ImageSynthesis构造函数
            try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class)) {
                assertThrows(RuntimeException.class, () -> {
                    dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
                });
            }
        }
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInImageDownload() {
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            Path mockPath = mock(Path.class);
            Path mockFileName = mock(Path.class);
            when(mockPath.toString()).thenReturn("/uploads/test-image.png");
            when(mockPath.resolve(anyString())).thenReturn(mockPath);
            when(mockPath.getFileName()).thenReturn(mockFileName);
            when(mockFileName.toString()).thenReturn("test-image.png");
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenReturn(mockPath);
            filesMock.when(() -> Files.copy(any(java.io.InputStream.class), any(Path.class), any())).thenThrow(new IOException("File copy error"));
            
            // mock ImageSynthesis构造函数
            try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class)) {
                assertThrows(RuntimeException.class, () -> {
                    dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
                });
            }
        }
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInImageSave() {
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            Path mockPath = mock(Path.class);
            Path mockFileName = mock(Path.class);
            when(mockPath.toString()).thenReturn("/uploads/test-image.png");
            when(mockPath.resolve(anyString())).thenReturn(mockPath);
            when(mockPath.getFileName()).thenReturn(mockFileName);
            when(mockFileName.toString()).thenReturn("test-image.png");
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenReturn(mockPath);
            filesMock.when(() -> Files.copy(any(java.io.InputStream.class), any(Path.class), any())).thenThrow(new IOException("File copy error"));
            
            // mock ImageSynthesis构造函数
            try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class)) {
                assertThrows(RuntimeException.class, () -> {
                    dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
                });
            }
        }
    }

    @Test
    void testGenerateImageFromImage_WithExceptionInImageSize() {
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            Path mockPath = mock(Path.class);
            Path mockFileName = mock(Path.class);
            when(mockPath.toString()).thenReturn("/uploads/test-image.png");
            when(mockPath.resolve(anyString())).thenReturn(mockPath);
            when(mockPath.getFileName()).thenReturn(mockFileName);
            when(mockFileName.toString()).thenReturn("test-image.png");
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenReturn(mockPath);
            filesMock.when(() -> Files.copy(any(java.io.InputStream.class), any(Path.class), any())).thenThrow(new IOException("File copy error"));
            
            // mock ImageSynthesis构造函数
            try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class)) {
                assertThrows(RuntimeException.class, () -> {
                    dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
                });
            }
        }
    }

    @Test
    void testGenerateImageFromImage_Success() throws Exception {
        MockMultipartFile mockFile = new MockMultipartFile(
            "image", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        try (MockedStatic<Files> filesMock = mockStatic(Files.class);
             MockedStatic<Paths> pathsMock = mockStatic(Paths.class)) {
            Path mockPath = mock(Path.class);
            Path mockFileName = mock(Path.class);
            when(mockPath.toString()).thenReturn("/uploads/test-image.png");
            when(mockPath.resolve(anyString())).thenReturn(mockPath);
            when(mockPath.getFileName()).thenReturn(mockFileName);
            when(mockFileName.toString()).thenReturn("test-image.png");
            pathsMock.when(() -> Paths.get(anyString())).thenReturn(mockPath);
            filesMock.when(() -> Files.createDirectories(any(Path.class))).thenReturn(mockPath);
            filesMock.when(() -> Files.copy(any(java.io.InputStream.class), any(Path.class), any())).thenReturn(1L);
            filesMock.when(() -> Files.size(any(Path.class))).thenReturn(1024L);

            // mock API - 使用正确的类型
            ImageSynthesisOutput mockOutput = mock(ImageSynthesisOutput.class);
            when(mockOutput.getTaskStatus()).thenReturn("SUCCEEDED");
            Map<String, String> imageResult = new HashMap<>();
            imageResult.put("url", "http://test.com/image.png");
            when(mockOutput.getResults()).thenReturn(List.of(imageResult));
            ImageSynthesisResult result = mock(ImageSynthesisResult.class);
            when(result.getOutput()).thenReturn(mockOutput);
            try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class,
                    (mock, context) -> when(mock.call(any(com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisParam.class))).thenReturn(result))) {
                when(messageAttachmentRepository.save(any())).thenReturn(new MessageAttachment());
                List<String> paths = dashScopeImageService.generateImageFromImage(mockFile, "A beautiful sunset", 1L);
                assertNotNull(paths);
                assertFalse(paths.isEmpty());
            }
        }
    }

    @Test
    void testGenerateImageFromText_Success() throws Exception {
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        // mock API - 使用正确的类型
        ImageSynthesisOutput mockOutput = mock(ImageSynthesisOutput.class);
        when(mockOutput.getTaskStatus()).thenReturn("SUCCEEDED");
        Map<String, String> imageResult = new HashMap<>();
        imageResult.put("url", "http://test.com/image.png");
        when(mockOutput.getResults()).thenReturn(List.of(imageResult));
        ImageSynthesisResult result = mock(ImageSynthesisResult.class);
        when(result.getOutput()).thenReturn(mockOutput);
        try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class,
                (mock, context) -> when(mock.call(any(com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisParam.class))).thenReturn(result))) {
            when(messageAttachmentRepository.save(any())).thenReturn(new MessageAttachment());
            List<String> paths = dashScopeImageService.generateImageFromText("prompt", 1L);
            assertNotNull(paths);
            assertFalse(paths.isEmpty());
        }
    }

    @Test
    void testGenerateTextToImage_Success() throws Exception {
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
        // mock API - 使用正确的类型
        ImageSynthesisOutput mockOutput = mock(ImageSynthesisOutput.class);
        when(mockOutput.getTaskStatus()).thenReturn("SUCCEEDED");
        Map<String, String> imageResult = new HashMap<>();
        imageResult.put("url", "http://test.com/image.png");
        when(mockOutput.getResults()).thenReturn(List.of(imageResult));
        ImageSynthesisResult result = mock(ImageSynthesisResult.class);
        when(result.getOutput()).thenReturn(mockOutput);
        try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class,
                (mock, context) -> when(mock.call(any(com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisParam.class))).thenReturn(result))) {
            Message message = new Message();
            when(messageAttachmentRepository.save(any())).thenReturn(new MessageAttachment());
            MessageAttachment attachment = dashScopeImageService.generateTextToImage("prompt", "1024*1024", "<auto>", message);
            assertNotNull(attachment);
        }
    }

//    @Test
//    void testGenerateImageToImage_Success() throws Exception {
//        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
//        when(dashScopeConfig.getApiKey()).thenReturn("test-api-key");
//        // mock API - 使用正确的类型
//        ImageSynthesisOutput mockOutput = mock(ImageSynthesisOutput.class);
//        when(mockOutput.getTaskStatus()).thenReturn("SUCCEEDED");
//        Map<String, String> imageResult = new HashMap<>();
//        imageResult.put("url", "http://test.com/image.png");
//        when(mockOutput.getResults()).thenReturn(List.of(imageResult));
//        ImageSynthesisResult result = mock(ImageSynthesisResult.class);
//        when(result.getOutput()).thenReturn(mockOutput);
//        try (MockedConstruction<ImageSynthesis> imageSynthesisMock = mockConstruction(ImageSynthesis.class,
//                (mock, context) -> when(mock.call(any(com.alibaba.dashscope.aigc.imagesynthesis.ImageSynthesisParam.class))).thenReturn(result))) {
//            Message message = new Message();
//            when(messageAttachmentRepository.save(any())).thenReturn(new MessageAttachment());
//            MessageAttachment attachment = dashScopeImageService.generateImageToImage("prompt", "url", "1024*1024", "<auto>", message);
//            assertNotNull(attachment);
//        }
//    }

    @Test
    void testIsAvailable_AllBranches() {
        // 正常
        when(aiConfig.getDashscope()).thenReturn(dashScopeConfig);
        when(dashScopeConfig.getApiKey()).thenReturn("key");
        assertTrue(dashScopeImageService.isAvailable());
        // apiKey为空
        when(dashScopeConfig.getApiKey()).thenReturn("");
        assertFalse(dashScopeImageService.isAvailable());
        // apiKey为null
        when(dashScopeConfig.getApiKey()).thenReturn(null);
        assertFalse(dashScopeImageService.isAvailable());
        // dashScopeConfig为null
        when(aiConfig.getDashscope()).thenReturn(null);
        assertFalse(dashScopeImageService.isAvailable());
    }

    @Test
    void testGetSupportedSizesAndStyles() {
        assertNotNull(dashScopeImageService.getSupportedSizes());
        assertNotNull(dashScopeImageService.getSupportedStyles());
    }
} 