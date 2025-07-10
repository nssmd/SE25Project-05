package com.aiplatform.controller;

import com.aiplatform.service.AiService;
import com.aiplatform.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI服务管理", description = "AI服务相关接口")
public class AIController {

    private final AiService aiService;
    private final ChatService chatService;

    @Operation(summary = "获取AI服务状态", description = "检查AI服务是否可用")
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAIStatus() {
        try {
            log.info("检查AI服务状态");
            
            boolean isAvailable = aiService.isAIServiceAvailable();
            String currentModel = aiService.getCurrentModel();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("available", isAvailable);
            response.put("model", currentModel);
            response.put("service", isAvailable ? "OpenRouter API" : "本地回复模式");
            response.put("message", isAvailable ? "AI服务正常" : "AI API未配置，使用本地回复");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取AI服务状态异常: ", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("available", false);
            response.put("message", "检查AI服务状态失败");
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Operation(summary = "测试AI回复", description = "测试AI服务是否正常工作")
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testAI(@RequestBody Map<String, Object> request) {
        try {
            String testMessage = (String) request.getOrDefault("message", "你好");
            log.info("测试AI回复: {}", testMessage);
            
            String response = aiService.generateResponse(testMessage, null);
            boolean isAvailable = aiService.isAIServiceAvailable();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("response", response);
            result.put("available", isAvailable);
            result.put("model", aiService.getCurrentModel());
            result.put("mode", isAvailable ? "API" : "本地");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("测试AI回复异常: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "AI测试失败");
            result.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(result);
        }
    }

    @Operation(summary = "获取AI配置信息", description = "获取当前AI服务的配置信息")
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getAIConfig() {
        try {
            log.info("获取AI配置信息");
            
            Map<String, Object> config = new HashMap<>();
            config.put("success", true);
            config.put("model", aiService.getCurrentModel());
            config.put("available", aiService.isAIServiceAvailable());
            config.put("provider", "OpenRouter");
            config.put("features", new String[]{
                "文本对话",
                "上下文理解",
                "多轮对话"
            });
            
            if (!aiService.isAIServiceAvailable()) {
                config.put("notice", "AI API未配置，当前使用本地回复模式。要启用完整AI功能，请在环境变量中配置有效的OpenRouter API密钥。");
            }
            
            return ResponseEntity.ok(config);
            
        } catch (Exception e) {
            log.error("获取AI配置信息异常: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "获取AI配置失败");
            result.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(result);
        }
    }

    @Operation(summary = "检查聊天服务状态", description = "检查聊天服务的AI功能状态")
    @GetMapping("/chat/status")
    public ResponseEntity<Map<String, Object>> getChatAIStatus() {
        try {
            log.info("检查聊天服务AI状态");
            
            boolean isAvailable = chatService.isAIServiceAvailable();
            String currentModel = chatService.getCurrentAIModel();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("aiEnabled", isAvailable);
            response.put("model", currentModel);
            response.put("chatAIStatus", isAvailable ? "启用" : "本地模式");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("检查聊天服务AI状态异常: ", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "检查聊天AI状态失败");
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Operation(summary = "获取可用AI模型列表", description = "获取所有支持的AI模型")
    @GetMapping("/models")
    public ResponseEntity<Map<String, Object>> getAvailableModels() {
        try {
            log.info("获取可用AI模型列表");
            
            var modelEnums = aiService.getAvailableModels();
            
            // 转换为前端友好的格式
            var models = new java.util.ArrayList<Map<String, Object>>();
            for (var model : modelEnums) {
                Map<String, Object> modelMap = new HashMap<>();
                modelMap.put("modelId", model.getModelId());
                modelMap.put("displayName", model.getDisplayName());
                modelMap.put("description", model.getDescription());
                modelMap.put("supportsText", model.isSupportsText());
                modelMap.put("supportsImage", model.isSupportsImage());
                modelMap.put("inputPrice", model.getInputPrice());
                modelMap.put("outputPrice", model.getOutputPrice());
                models.add(modelMap);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("models", models);
            response.put("count", models.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取AI模型列表异常: ", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取模型列表失败");
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Operation(summary = "获取支持图片的AI模型", description = "获取支持图片输入的AI模型列表")
    @GetMapping("/models/image-support")
    public ResponseEntity<Map<String, Object>> getImageSupportModels() {
        try {
            log.info("获取支持图片的AI模型列表");
            
            var models = aiService.getImageSupportModels();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("models", models);
            response.put("count", models.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取图片支持模型列表异常: ", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取图片支持模型列表失败");
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Operation(summary = "获取模型详细信息", description = "获取指定模型的详细信息")
    @GetMapping("/models/{modelId}")
    public ResponseEntity<Map<String, Object>> getModelInfo(@PathVariable String modelId) {
        try {
            log.info("获取模型信息: {}", modelId);
            
            var model = aiService.getModelInfo(modelId);
            if (model == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "模型不存在");
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("model", model);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("获取模型信息异常: ", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取模型信息失败");
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Operation(summary = "验证模型可用性", description = "检查指定模型是否可用")
    @GetMapping("/models/{modelId}/available")
    public ResponseEntity<Map<String, Object>> checkModelAvailability(@PathVariable String modelId) {
        try {
            log.info("检查模型可用性: {}", modelId);
            
            boolean available = aiService.isModelAvailable(modelId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("modelId", modelId);
            response.put("available", available);
            response.put("message", available ? "模型可用" : "模型不可用");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("检查模型可用性异常: ", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "检查模型可用性失败");
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 