package com.aiplatform.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class MessageTypeConverter implements AttributeConverter<AdminMessage.MessageType, String> {

    @Override
    public String convertToDatabaseColumn(AdminMessage.MessageType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getDatabaseValue();
    }

    @Override
    public AdminMessage.MessageType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        
        // 根据数据库值查找对应的枚举
        for (AdminMessage.MessageType messageType : AdminMessage.MessageType.values()) {
            if (messageType.getDatabaseValue().equals(dbData)) {
                return messageType;
            }
        }
        
        // 如果找不到匹配的值，抛出异常或返回默认值
        throw new IllegalArgumentException("Unknown message type: " + dbData);
    }
} 