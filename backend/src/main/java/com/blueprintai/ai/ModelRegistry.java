package com.blueprintai.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

public class ModelRegistry {

    @Data
    @AllArgsConstructor
    @Builder
    public static class ModelConfig {
        private String provider;
        private String displayName;
        private String apiModelId;
        private int creditCost;
        private String tier;
        private String speed;
        private String quality;
        private String description;
        private boolean supportsVision;
        private int maxOutputTokens;
    }

    public static final String DEFAULT_MODEL = "gemini-3.6-flash";

    public static final Map<String, ModelConfig> MODELS = Map.ofEntries(
        Map.entry("claude-sonnet-4-5", ModelConfig.builder()
            .provider("anthropic").displayName("Claude Sonnet 4.5")
            .apiModelId("claude-sonnet-4-5-20250929").creditCost(2).tier("premium")
            .speed("fast").quality("high").supportsVision(true).maxOutputTokens(64000)
            .description("Most capable Claude model").build()),

        Map.entry("claude-haiku-3-5", ModelConfig.builder()
            .provider("anthropic").displayName("Claude Haiku 3.5")
            .apiModelId("claude-haiku-3-5-20251001").creditCost(1).tier("fast")
            .speed("very-fast").quality("good").supportsVision(true).maxOutputTokens(64000)
            .description("Fast and affordable Claude model").build()),

        Map.entry("gpt-4o", ModelConfig.builder()
            .provider("openai").displayName("GPT-4o")
            .apiModelId("gpt-4o").creditCost(2).tier("premium")
            .speed("fast").quality("high").supportsVision(true).maxOutputTokens(16384)
            .description("OpenAI flagship model").build()),

        Map.entry("gpt-4o-mini", ModelConfig.builder()
            .provider("openai").displayName("GPT-4o Mini")
            .apiModelId("gpt-4o-mini").creditCost(1).tier("fast")
            .speed("very-fast").quality("good").supportsVision(true).maxOutputTokens(16384)
            .description("Fast and affordable OpenAI model").build()),

        Map.entry("gemini-2.0-flash-legacy", ModelConfig.builder()
            .provider("google").displayName("Gemini 2.0 Flash Legacy")
            .apiModelId("gemini-3.6-flash").creditCost(1).tier("fast")
            .speed("very-fast").quality("good").supportsVision(true).maxOutputTokens(32768)
            .description("Legacy app option routed to the available Gemini Flash model").build()),

        Map.entry("gemini-2.0-pro", ModelConfig.builder()
            .provider("google").displayName("Gemini 2.0 Pro")
            .apiModelId("gemini-1.5-pro-002").creditCost(2).tier("premium")
            .speed("medium").quality("high").supportsVision(true).maxOutputTokens(32768)
            .description("Google pro model").build()),

        Map.entry("deepseek-v3", ModelConfig.builder()
            .provider("deepseek").displayName("DeepSeek V3")
            .apiModelId("deepseek-chat").creditCost(1).tier("fast")
            .speed("fast").quality("good").supportsVision(false).maxOutputTokens(8000)
            .description("DeepSeek chat model").build()),

        Map.entry("deepseek-r1", ModelConfig.builder()
            .provider("deepseek").displayName("DeepSeek R1")
            .apiModelId("deepseek-reasoner").creditCost(1).tier("fast")
            .speed("fast").quality("good").supportsVision(false).maxOutputTokens(8000)
            .description("DeepSeek reasoning model").build()),

        Map.entry("gemini-2.5-flash", ModelConfig.builder()
            .provider("google").displayName("Gemini 2.5 Flash")
            .apiModelId("gemini-3.6-flash").creditCost(1).tier("fast")
            .speed("very-fast").quality("good").supportsVision(true).maxOutputTokens(32768)
            .description("Legacy app option routed to the available Gemini Flash model").build()),

        Map.entry("gemini-2.5-pro", ModelConfig.builder()
            .provider("google").displayName("Gemini 2.5 Pro")
            .apiModelId("gemini-1.5-pro-002").creditCost(2).tier("premium")
            .speed("medium").quality("high").supportsVision(true).maxOutputTokens(32768)
            .description("Google latest pro model").build()),

        Map.entry("gemini-3.1-flash", ModelConfig.builder()
            .provider("google").displayName("Gemini 3.1 Flash")
            .apiModelId("gemini-3.6-flash").creditCost(1).tier("fast")
            .speed("very-fast").quality("good").supportsVision(true).maxOutputTokens(32768)
            .description("Legacy app option routed to the available Gemini Flash model").build()),

        Map.entry("gemini-3.6-flash", ModelConfig.builder()
            .provider("google").displayName("Gemini 3.6 Flash")
            .apiModelId("gemini-3.6-flash").creditCost(1).tier("fast")
            .speed("very-fast").quality("good").supportsVision(true).maxOutputTokens(32768)
            .description("Google fast model (default)").build()),

        Map.entry("grok-beta", ModelConfig.builder()
            .provider("grok").displayName("Grok Beta")
            .apiModelId("grok-2-1212").creditCost(1).tier("fast")
            .speed("fast").quality("good").supportsVision(false).maxOutputTokens(8192)
            .description("xAI Grok model").build())
    );

    public static ModelConfig getModel(String modelId) {
        return MODELS.getOrDefault(modelId, MODELS.get(DEFAULT_MODEL));
    }

    public static boolean isValidModel(String modelId) {
        return MODELS.containsKey(modelId);
    }
}
