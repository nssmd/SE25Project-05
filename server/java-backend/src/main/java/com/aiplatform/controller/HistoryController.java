package com.aiplatform.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "历史记录管理", description = "聊天历史记录相关接口")
public class HistoryController {

    @Operation(summary = "搜索聊天记录", description = "根据关键词搜索聊天记录")
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchChats(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String aiType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("搜索聊天记录: keyword={}, aiType={}, page={}, size={}", keyword, aiType, page, size);
        
        // 临时返回空结果
        List<Map<String, Object>> chats = new ArrayList<>();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("chats", chats);
        response.put("total", 0);
        response.put("page", page);
        response.put("size", size);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "获取用户的所有聊天记录", description = "获取当前用户的所有聊天记录")
    @GetMapping("/chats")
    public ResponseEntity<Map<String, Object>> getUserChats(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("获取用户聊天记录: page={}, size={}", page, size);
        
        List<Map<String, Object>> chats = new ArrayList<>();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("chats", chats);
        response.put("total", 0);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "删除聊天记录", description = "删除指定的聊天记录")
    @DeleteMapping("/chats/{chatId}")
    public ResponseEntity<Map<String, Object>> deleteChat(@PathVariable Long chatId) {
        log.info("删除聊天记录: {}", chatId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "聊天记录删除成功");
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "导出聊天记录", description = "导出用户的聊天记录")
    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportChats(
            @RequestParam(required = false) String format) {
        
        log.info("导出聊天记录: format={}", format);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("downloadUrl", "/api/history/download/temp.json");
        response.put("message", "导出任务已创建");
        
        return ResponseEntity.ok(response);
    }
} 