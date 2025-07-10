package com.aiplatform.entity;

public enum AIModel {
    GPT_4_1_NANO("openai/gpt-4.1-nano", "GPT-4.1 Nano", "快速高效的多模态模型", true, true, 0.10, 0.40),
    GEMINI_2_5_FLASH("google/gemini-2.5-flash", "Gemini 2.5 Flash", "Google的多模态模型", true, true, 0.30, 0.60),
    DEEPSEEK_R1("deepseek/deepseek-r1-distill-qwen-7b", "DeepSeek R1", "DeepSeek推理模型", true, false, 0.15, 0.30),
    QWEN_3_30B("qwen/qwen3-30b-a3b:free", "Qwen 3 30B (免费)", "通义千问大模型", true, false, 0.00, 0.00);

    private final String modelId;           // OpenRouter API中的模型标识
    private final String displayName;       // 显示名称
    private final String description;       // 模型描述
    private final boolean supportsText;     // 是否支持文本
    private final boolean supportsImage;    // 是否支持图片
    private final double inputPrice;        // 输入价格 ($/M tokens)
    private final double outputPrice;       // 输出价格 ($/M tokens)

    AIModel(String modelId, String displayName, String description, 
            boolean supportsText, boolean supportsImage, double inputPrice, double outputPrice) {
        this.modelId = modelId;
        this.displayName = displayName;
        this.description = description;
        this.supportsText = supportsText;
        this.supportsImage = supportsImage;
        this.inputPrice = inputPrice;
        this.outputPrice = outputPrice;
    }

    // Getters
    public String getModelId() { return modelId; }
    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }
    public boolean isSupportsText() { return supportsText; }
    public boolean isSupportsImage() { return supportsImage; }
    public double getInputPrice() { return inputPrice; }
    public double getOutputPrice() { return outputPrice; }

    // 根据modelId查找模型
    public static AIModel fromModelId(String modelId) {
        for (AIModel model : values()) {
            if (model.getModelId().equals(modelId)) {
                return model;
            }
        }
        return GPT_4_1_NANO; // 默认模型
    }

    // 获取支持图片的模型列表
    public static AIModel[] getImageSupportModels() {
        return java.util.Arrays.stream(values())
                .filter(AIModel::isSupportsImage)
                .toArray(AIModel[]::new);
    }

    // 获取免费模型列表
    public static AIModel[] getFreeModels() {
        return java.util.Arrays.stream(values())
                .filter(m -> m.getInputPrice() == 0.0)
                .toArray(AIModel[]::new);
    }
} 