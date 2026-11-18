package com.blueprintai.service;

import com.blueprintai.ai.ModelRegistry;
import com.blueprintai.ai.ModelRegistry.ModelConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class AiProviderService {

    @Value("${blueprintai.ai.anthropic-api-key:}")
    private String anthropicApiKey;

    @Value("${blueprintai.ai.openai-api-key:}")
    private String openaiApiKey;

    @Value("${blueprintai.ai.google-ai-api-key:}")
    private String googleAiApiKey;

    @Value("${blueprintai.ai.groq-api-key:}")
    private String groqApiKey;

    @Value("${blueprintai.ai.deepseek-api-key:}")
    private String deepseekApiKey;

    @Value("${blueprintai.ai.grok-api-key:}")
    private String grokApiKey;

    private static final Duration AI_REQUEST_TIMEOUT = Duration.ofSeconds(45);
    private static final Duration HTTP_RESPONSE_TIMEOUT = Duration.ofSeconds(60);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WebClient webClient = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(
                    HttpClient.create().responseTimeout(HTTP_RESPONSE_TIMEOUT)))
            .exchangeStrategies(ExchangeStrategies.builder()
                    .codecs(config -> config.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                    .build())
            .build();
    private final AtomicInteger currentGoogleKeyIndex = new AtomicInteger(0);

    private List<String> getGoogleKeys() {
        if (googleAiApiKey == null || googleAiApiKey.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(googleAiApiKey.split(","))
                .map(String::trim)
                .filter(k -> !k.isEmpty())
                .toList();
    }

    public List<String> streamChat(String modelId, String systemPrompt,
                                    List<Map<String, Object>> messages) throws Exception {
        ModelConfig config = ModelRegistry.getModel(modelId);
        String provider = config.getProvider();

        log.info("Starting AI request: provider={}, model={}", provider, config.getApiModelId());
        try {
            List<String> chunks = switch (provider) {
                case "anthropic" -> streamAnthropic(config, systemPrompt, messages);
                case "openai" -> streamOpenAi(config, systemPrompt, messages);
                case "google" -> streamGoogle(config, systemPrompt, messages);
                case "groq" -> streamGroq(config, systemPrompt, messages);
                case "deepseek" -> streamDeepSeek(config, systemPrompt, messages);
                case "grok" -> streamGrok(config, systemPrompt, messages);
                default -> throw new IllegalArgumentException("Unknown provider: " + provider);
            };
            int responseCharacters = chunks.stream().mapToInt(String::length).sum();
            log.info("AI request succeeded: provider={}, model={}, responseCharacters={}",
                    provider, config.getApiModelId(), responseCharacters);
            return chunks;
        } catch (Exception ex) {
            log.error("AI request failed: provider={}, model={}, error={}",
                    provider, config.getApiModelId(), ex.getMessage(), ex);
            throw ex;
        }
    }

    private List<String> streamAnthropic(ModelConfig config, String systemPrompt,
                                          List<Map<String, Object>> messages) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", config.getApiModelId());
        body.put("max_tokens", config.getMaxOutputTokens());
        body.put("system", systemPrompt);

        ArrayNode messagesNode = body.putArray("messages");
        for (Map<String, Object> msg : messages) {
            ObjectNode msgNode = messagesNode.addObject();
            msgNode.put("role", (String) msg.get("role"));
            msgNode.put("content", (String) msg.get("content"));
        }

        String responseJson = webClient.post()
                .uri("https://api.anthropic.com/v1/messages")
                .header("x-api-key", anthropicApiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(objectMapper.writeValueAsString(body))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode response = objectMapper.readTree(responseJson);
        List<String> chunks = new ArrayList<>();
        if (response.has("content")) {
            for (JsonNode block : response.get("content")) {
                if ("text".equals(block.path("type").asText())) {
                    chunks.add(block.get("text").asText());
                }
            }
        }
        return chunks;
    }

    private List<String> streamOpenAi(ModelConfig config, String systemPrompt,
                                       List<Map<String, Object>> messages) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", config.getApiModelId());
        body.put("max_tokens", config.getMaxOutputTokens());

        ArrayNode messagesNode = body.putArray("messages");
        ObjectNode systemMsg = messagesNode.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);

        for (Map<String, Object> msg : messages) {
            ObjectNode msgNode = messagesNode.addObject();
            msgNode.put("role", (String) msg.get("role"));
            msgNode.put("content", (String) msg.get("content"));
        }

        String responseJson = webClient.post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + openaiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(objectMapper.writeValueAsString(body))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode response = objectMapper.readTree(responseJson);
        String content = response.path("choices").path(0)
                .path("message").path("content").asText("");
        return List.of(content);
    }

    private List<String> streamGoogle(ModelConfig config, String systemPrompt,
                                       List<Map<String, Object>> messages) throws Exception {
        List<String> keys = getGoogleKeys();
        if (keys.isEmpty()) {
            if (groqApiKey != null && !groqApiKey.isBlank()) {
                log.warn("No Google AI API key configured; falling back to Groq.");
                return streamGroq(ModelRegistry.getModel(ModelRegistry.DEFAULT_MODEL), systemPrompt, messages);
            }
            throw new IllegalStateException("Google AI API key is not configured in backend/.env");
        }

        // Build ordered model fallback list within Google (e.g. gemini-3.6-flash -> gemini-2.5-flash)
        List<String> candidateModels = new ArrayList<>();
        candidateModels.add(config.getApiModelId());
        if (!"gemini-2.5-flash".equals(config.getApiModelId())) {
            candidateModels.add("gemini-2.5-flash");
        }

        Exception lastException = null;
        for (int mIdx = 0; mIdx < candidateModels.size(); mIdx++) {
            String apiModelId = candidateModels.get(mIdx);
            try {
                if (mIdx > 0) {
                    log.warn("Primary Google model {} unavailable; automatically trying fallback Google model {}",
                            config.getApiModelId(), apiModelId);
                }
                return invokeGoogleModelWithKeyRotation(
                        apiModelId, config.getMaxOutputTokens(), systemPrompt, messages, keys);
            } catch (Exception ex) {
                lastException = ex;
                log.warn("Google model {} failed across {} key(s): {}", apiModelId, keys.size(), ex.getMessage());
            }
        }

        // Cross-provider automatic failover to Groq if configured
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            log.warn("All Google AI models/keys failed ({}); seamlessly falling back to Groq ({})",
                    lastException != null ? lastException.getMessage() : "unknown",
                    ModelRegistry.DEFAULT_MODEL);
            try {
                return streamGroq(ModelRegistry.getModel(ModelRegistry.DEFAULT_MODEL), systemPrompt, messages);
            } catch (Exception groqEx) {
                log.error("Groq fallback also failed: {}", groqEx.getMessage(), groqEx);
            }
        }

        throw new RuntimeException("All Google AI API keys (" + keys.size() + ") are exhausted, rate-limited, or unavailable. Last error: " +
                (lastException != null ? lastException.getMessage() : "Unknown error"), lastException);
    }

    private List<String> invokeGoogleModelWithKeyRotation(
            String apiModelId,
            int maxOutputTokens,
            String systemPrompt,
            List<Map<String, Object>> messages,
            List<String> keys) throws Exception {

        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode contents = body.putArray("contents");

        ObjectNode systemInstruction = body.putObject("systemInstruction");
        ArrayNode parts = systemInstruction.putArray("parts");
        parts.addObject().put("text", systemPrompt);

        for (Map<String, Object> msg : messages) {
            ObjectNode content = contents.addObject();
            content.put("role", "user".equals(msg.get("role")) ? "user" : "model");
            ArrayNode contentParts = content.putArray("parts");
            contentParts.addObject().put("text", (String) msg.get("content"));
        }

        ObjectNode generationConfig = body.putObject("generationConfig");
        generationConfig.put("maxOutputTokens", Math.min(maxOutputTokens, 16384));
        if (apiModelId != null && apiModelId.startsWith("gemini-3")) {
            ObjectNode thinkingConfig = generationConfig.putObject("thinkingConfig");
            thinkingConfig.put("thinkingLevel", "low");
        }

        String requestBody = objectMapper.writeValueAsString(body);
        int totalKeys = keys.size();
        Exception lastException = null;
        int startIndex = Math.abs(currentGoogleKeyIndex.get()) % totalKeys;

        for (int attempt = 0; attempt < totalKeys; attempt++) {
            int keyIndex = (startIndex + attempt) % totalKeys;
            String activeKey = keys.get(keyIndex);
            String maskedKey = activeKey.length() > 8
                    ? activeKey.substring(0, 4) + "..." + activeKey.substring(activeKey.length() - 4)
                    : "***";

            try {
                log.info("Attempting Google AI model {} with key [{}] (key {} of {})",
                        apiModelId, maskedKey, keyIndex + 1, totalKeys);

                String responseJson = webClient.post()
                        .uri("https://generativelanguage.googleapis.com/v1beta/models/" +
                             apiModelId + ":generateContent")
                        .header("x-goog-api-key", activeKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(AI_REQUEST_TIMEOUT)
                        .block();

                currentGoogleKeyIndex.set(keyIndex);
                return parseGoogleResponseChunks(responseJson);

            } catch (WebClientResponseException ex) {
                int status = ex.getStatusCode().value();
                lastException = ex;
                log.warn("Google AI model {} key [{}] hit HTTP {} ({}). Response: {}",
                        apiModelId, maskedKey, status, ex.getStatusText(), ex.getResponseBodyAsString());

                // 404/400 means model-level or payload issue — fail fast to try next fallback model
                if (status == 404 || status == 400) {
                    throw ex;
                }
                // 429/503/403 -> rotate to next key if available
                if (status == 429 || status == 503 || status == 403) {
                    if (attempt < totalKeys - 1) {
                        int nextKeyIndex = (keyIndex + 1) % totalKeys;
                        log.info("Rate limit/overload on key {}. Switching to key {}...",
                                keyIndex + 1, nextKeyIndex + 1);
                        continue;
                    }
                } else {
                    throw ex;
                }
            } catch (Exception ex) {
                lastException = ex;
                boolean isTimeout = ex instanceof TimeoutException
                        || (ex.getCause() instanceof TimeoutException)
                        || (ex.getMessage() != null && ex.getMessage().contains("TimeoutException"));
                log.error("Error communicating with Google AI model {} using key [{}]: {}",
                        apiModelId, maskedKey, ex.getMessage());
                if (isTimeout) {
                    throw new RuntimeException("Google AI (" + apiModelId + ") timed out after "
                            + AI_REQUEST_TIMEOUT.toSeconds() + "s", ex);
                }
                if (attempt < totalKeys - 1) {
                    continue;
                }
            }
        }

        throw lastException != null
                ? lastException
                : new RuntimeException("Google AI model " + apiModelId + " unavailable");
    }

    private List<String> parseGoogleResponseChunks(String responseJson) throws Exception {
        JsonNode response = objectMapper.readTree(responseJson);
        List<String> chunks = new ArrayList<>();
        JsonNode candidates = response.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode contentParts = candidates.path(0).path("content").path("parts");
            if (contentParts.isArray()) {
                for (JsonNode part : contentParts) {
                    if (part.path("thought").asBoolean(false)) {
                        continue;
                    }
                    if (part.has("text")) {
                        chunks.add(part.get("text").asText());
                    }
                }
            }
        }
        return chunks;
    }

    private List<String> streamGroq(ModelConfig config, String systemPrompt,
                                     List<Map<String, Object>> messages) throws Exception {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw new IllegalStateException("Groq API key is not configured in backend/.env (set GROQ_API_KEY)");
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", config.getApiModelId());
        body.put("max_completion_tokens", config.getMaxOutputTokens());

        ArrayNode messagesNode = body.putArray("messages");
        ObjectNode systemMsg = messagesNode.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);

        for (Map<String, Object> msg : messages) {
            ObjectNode msgNode = messagesNode.addObject();
            msgNode.put("role", (String) msg.get("role"));
            msgNode.put("content", (String) msg.get("content"));
        }

        String responseJson;
        try {
            responseJson = webClient.post()
                    .uri("https://api.groq.com/openai/v1/chat/completions")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(objectMapper.writeValueAsString(body))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (WebClientResponseException ex) {
            String responseBody = ex.getResponseBodyAsString();
            log.error("Groq API returned HTTP {} for model {}: {}",
                    ex.getStatusCode().value(), config.getApiModelId(),
                    responseBody.isBlank() ? ex.getStatusText() : responseBody);
            throw new IllegalStateException(
                    "Groq API returned HTTP " + ex.getStatusCode().value()
                            + " for model " + config.getApiModelId() + ": "
                            + (responseBody.isBlank() ? ex.getStatusText() : responseBody),
                    ex);
        }

        JsonNode response = objectMapper.readTree(responseJson);
        String content = response.path("choices").path(0)
                .path("message").path("content").asText("");
        return List.of(content);
    }

    private List<String> streamDeepSeek(ModelConfig config, String systemPrompt,
                                         List<Map<String, Object>> messages) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", config.getApiModelId());
        body.put("max_tokens", config.getMaxOutputTokens());

        ArrayNode messagesNode = body.putArray("messages");
        ObjectNode systemMsg = messagesNode.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);

        for (Map<String, Object> msg : messages) {
            ObjectNode msgNode = messagesNode.addObject();
            msgNode.put("role", (String) msg.get("role"));
            msgNode.put("content", (String) msg.get("content"));
        }

        String responseJson = webClient.post()
                .uri("https://api.deepseek.com/chat/completions")
                .header("Authorization", "Bearer " + deepseekApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(objectMapper.writeValueAsString(body))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode response = objectMapper.readTree(responseJson);
        String content = response.path("choices").path(0)
                .path("message").path("content").asText("");
        return List.of(content);
    }

    private List<String> streamGrok(ModelConfig config, String systemPrompt,
                                     List<Map<String, Object>> messages) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", config.getApiModelId());
        body.put("max_tokens", config.getMaxOutputTokens());

        ArrayNode messagesNode = body.putArray("messages");
        ObjectNode systemMsg = messagesNode.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);

        for (Map<String, Object> msg : messages) {
            ObjectNode msgNode = messagesNode.addObject();
            msgNode.put("role", (String) msg.get("role"));
            msgNode.put("content", (String) msg.get("content"));
        }

        String responseJson = webClient.post()
                .uri("https://api.x.ai/v1/chat/completions")
                .header("Authorization", "Bearer " + grokApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(objectMapper.writeValueAsString(body))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode response = objectMapper.readTree(responseJson);
        String content = response.path("choices").path(0)
                .path("message").path("content").asText("");
        return List.of(content);
    }
}
