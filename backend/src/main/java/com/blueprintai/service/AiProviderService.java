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
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class AiProviderService {

    @Value("${blueprintai.ai.anthropic-api-key:}")
    private String anthropicApiKey;

    @Value("${blueprintai.ai.openai-api-key:}")
    private String openaiApiKey;

    @Value("${blueprintai.ai.google-ai-api-key:}")
    private String googleAiApiKey;

    @Value("${blueprintai.ai.deepseek-api-key:}")
    private String deepseekApiKey;

    @Value("${blueprintai.ai.grok-api-key:}")
    private String grokApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WebClient webClient = WebClient.builder().build();

    public List<String> streamChat(String modelId, String systemPrompt,
                                    List<Map<String, Object>> messages) throws Exception {
        ModelConfig config = ModelRegistry.getModel(modelId);
        String provider = config.getProvider();

        return switch (provider) {
            case "anthropic" -> streamAnthropic(config, systemPrompt, messages);
            case "openai" -> streamOpenAi(config, systemPrompt, messages);
            case "google" -> streamGoogle(config, systemPrompt, messages);
            case "deepseek" -> streamDeepSeek(config, systemPrompt, messages);
            case "grok" -> streamGrok(config, systemPrompt, messages);
            default -> throw new IllegalArgumentException("Unknown provider: " + provider);
        };
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
        generationConfig.put("maxOutputTokens", config.getMaxOutputTokens());

        String responseJson = webClient.post()
                .uri("https://generativelanguage.googleapis.com/v1beta/models/" +
                     config.getApiModelId() + ":generateContent?key=" + googleAiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(objectMapper.writeValueAsString(body))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode response = objectMapper.readTree(responseJson);
        List<String> chunks = new ArrayList<>();
        JsonNode candidates = response.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode contentParts = candidates.path(0).path("content").path("parts");
            if (contentParts.isArray()) {
                for (JsonNode part : contentParts) {
                    if (part.has("text")) {
                        chunks.add(part.get("text").asText());
                    }
                }
            }
        }
        return chunks;
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
