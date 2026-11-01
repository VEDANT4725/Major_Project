package com.blueprintai.service;

import com.blueprintai.ai.FileParser;
import com.blueprintai.ai.ModelRegistry;
import com.blueprintai.ai.ModelRegistry.ModelConfig;
import com.blueprintai.ai.SystemPromptBuilder;
import com.blueprintai.exception.CreditExhaustedException;
import com.blueprintai.exception.PremiumModelLockedException;
import com.blueprintai.exception.ResourceNotFoundException;
import com.blueprintai.model.dto.request.SendMessageRequest;
import com.blueprintai.model.dto.response.CreditsResponse;
import com.blueprintai.model.dto.response.ProjectFilesResponse.ProjectFile;
import com.blueprintai.model.entity.ChatMessage;
import com.blueprintai.model.entity.Project;
import com.blueprintai.model.enums.ChatRole;
import com.blueprintai.model.enums.PlanType;
import com.blueprintai.repository.ChatMessageRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProjectService projectService;
    private final VersionService versionService;
    private final CreditsService creditsService;
    private final SystemPromptBuilder systemPromptBuilder;
    private final FileParser fileParser;
    private final AiProviderService aiProviderService;
    private final ObjectMapper objectMapper;

    private static final int MAX_CONTEXT_MESSAGES = 10;
    private static final int MAX_MESSAGE_LENGTH = 4000;

    public List<Map<String, Object>> getChatHistory(String projectId) {
        projectService.findProjectOrThrow(projectId);
        List<ChatMessage> messages = chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        return messages.stream().map(this::toMap).collect(Collectors.toList());
    }

    @Transactional
    public void sendMessage(String projectId, SendMessageRequest request, SseEmitter emitter) {
        try {
            processMessage(projectId, request, emitter);
        } catch (CreditExhaustedException e) {
            completeWithError(emitter, e.getMessage(), "CREDITS_EXHAUSTED");
        } catch (PremiumModelLockedException e) {
            completeWithError(emitter, e.getMessage(), "PREMIUM_MODEL_LOCKED");
        } catch (Exception e) {
            log.error("Error processing chat message for project {}", projectId, e);
            completeWithError(emitter, "Internal error: " + e.getMessage(), "GENERATION_FAILED");
        }
    }

    private void completeWithError(SseEmitter emitter, String message, String code) {
        try {
            sendSseEvent(emitter, "error", Map.of("message", message, "code", code));
            emitter.complete();
        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }

    private void processMessage(String projectId, SendMessageRequest request, SseEmitter emitter)
            throws IOException, InterruptedException {

        String prompt = sanitizeChatMessage(request.getPrompt());
        if (prompt.isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        String modelId = request.getModel() != null ? request.getModel() : ModelRegistry.DEFAULT_MODEL;
        ModelConfig modelConfig = ModelRegistry.getModel(modelId);
        int creditCost = modelConfig.getCreditCost();

        if ("premium".equalsIgnoreCase(modelConfig.getTier())
                && creditsService.getCredits().getPlan() != PlanType.PRO) {
            throw new PremiumModelLockedException(
                    "The " + modelConfig.getDisplayName() + " model requires a Pro plan");
        }

        creditsService.checkCredits(creditCost);

        Project project = projectService.findProjectOrThrow(projectId);
        List<Map<String, String>> existingFiles = versionService.getVersionFiles(
                projectId, project.getCurrentVersion());

        List<ProjectFile> projectFiles = existingFiles.stream()
                .map(f -> new ProjectFile(f.get("path"), f.get("content")))
                .toList();

        String systemPrompt = systemPromptBuilder.buildSystemPrompt(projectFiles, request.getSelectedFiles());

        List<ChatMessage> history = chatMessageRepository
                .findByProjectIdOrderByCreatedAtAsc(projectId);
        List<Map<String, String>> chatHistory = trimHistory(history);

        List<Map<String, Object>> aiMessages = new ArrayList<>();
        for (Map<String, String> msg : chatHistory) {
            aiMessages.add(Map.of("role", msg.get("role"), "content", msg.get("content")));
        }

        Map<String, Object> userMessage = Map.of("role", "user", "content", prompt);
        aiMessages.add(userMessage);

        saveUserMessage(projectId, prompt, request);

        sendSseEvent(emitter, "connected", Map.of("message", "Stream started"));

        StringBuilder fullResponse = new StringBuilder();
        try {
            List<String> chunks = aiProviderService.streamChat(modelId, systemPrompt, aiMessages);

            int chunkCount = 0;
            List<String> lastTasks = List.of();
            for (String chunk : chunks) {
                fullResponse.append(chunk);
                sendSseEvent(emitter, "chunk", Map.of("text", chunk));
                chunkCount++;

                if (chunkCount % 5 == 0) {
                    List<Map<String, String>> tasks = fileParser.extractTasks(fullResponse.toString());
                    if (!tasks.isEmpty()) {
                        String tasksJson = objectMapper.writeValueAsString(tasks);
                        String currentTaskKey = tasksJson;
                        sendSseEvent(emitter, "task", Map.of("tasks", tasks));
                    }
                }

                if (chunkCount % 20 == 0) {
                    sendSseEvent(emitter, "ping", Map.of("time", System.currentTimeMillis()));
                }
            }
        } catch (Exception e) {
            log.error("AI provider error", e);
            String errorCode = classifyAiError(e);
            sendSseEvent(emitter, "error", Map.of(
                    "message", "AI generation failed: " + e.getMessage(),
                    "code", errorCode));
            saveAssistantMessage(projectId, "Error: " + e.getMessage(), null, modelId, null);
            emitter.complete();
            return;
        }

        List<Map<String, String>> parsedFiles = fileParser.parseFilesFromResponse(fullResponse.toString());

        if (parsedFiles.isEmpty()) {
            sendSseEvent(emitter, "error", Map.of(
                    "message", "AI did not generate any valid files",
                    "code", "INVALID_AI_FORMAT"));
            saveAssistantMessage(projectId, "No valid files generated", null, modelId, null);
            emitter.complete();
            return;
        }

        List<Map<String, String>> mergedFiles = fileParser.mergeFiles(existingFiles, parsedFiles);
        int newVersion = project.getCurrentVersion() + 1;

        List<String> changedFilePaths = parsedFiles.stream()
                .map(f -> f.get("path"))
                .toList();

        versionService.saveVersion(projectId, newVersion, mergedFiles,
                prompt, modelId, "ai", changedFilePaths, null, mergedFiles.size());

        projectService.incrementVersion(project);

        creditsService.deductCredits(creditCost);

        String explanation = fileParser.extractExplanation(fullResponse.toString());

        saveAssistantMessage(projectId, explanation, newVersion, modelId, changedFilePaths);

        List<ProjectFile> responseFiles = mergedFiles.stream()
                .map(f -> new ProjectFile(f.get("path"), f.get("content")))
                .toList();

        sendSseEvent(emitter, "files", Map.of("files", responseFiles));

        CreditsResponse credits = creditsService.getCredits();
        sendSseEvent(emitter, "done", Map.of(
                "versionId", projectId + "-v" + newVersion,
                "version", newVersion,
                "model", modelId,
                "changedFiles", changedFilePaths,
                "creditsRemaining", credits.getRemaining(),
                "explanation", explanation));

        emitter.complete();
    }

    @Transactional
    public void saveUserMessage(String projectId, String prompt, SendMessageRequest request) {
        Project project = projectService.findProjectOrThrow(projectId);
        ChatMessage message = ChatMessage.builder()
                .externalId("msg-" + System.currentTimeMillis() + "-user")
                .project(project)
                .role(ChatRole.USER)
                .content(prompt)
                .images(serializeImages(request.getImages()))
                .selectedFiles(request.getSelectedFiles() != null ?
                        serializeList(request.getSelectedFiles()) : null)
                .build();
        chatMessageRepository.save(message);
    }

    @Transactional
    public void saveAssistantMessage(String projectId, String content, Integer versionNumber,
                                      String model, List<String> changedFiles) {
        Project project = projectService.findProjectOrThrow(projectId);
        String changedFilesJson = null;
        if (changedFiles != null) {
            try {
                changedFilesJson = objectMapper.writeValueAsString(changedFiles);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize changed files", e);
            }
        }

        ChatMessage message = ChatMessage.builder()
                .externalId("msg-" + System.currentTimeMillis() + "-assistant")
                .project(project)
                .role(ChatRole.ASSISTANT)
                .content(content)
                .versionNumber(versionNumber)
                .model(model)
                .changedFiles(changedFilesJson)
                .build();
        chatMessageRepository.save(message);
    }

    private List<Map<String, String>> trimHistory(List<ChatMessage> messages) {
        int start = Math.max(0, messages.size() - MAX_CONTEXT_MESSAGES);
        return messages.subList(start, messages.size()).stream()
                .map(m -> {
                    String content = m.getContent();
                    if (content != null && content.length() > MAX_MESSAGE_LENGTH) {
                        content = content.substring(0, MAX_MESSAGE_LENGTH) + "...";
                    }
                    return Map.<String, String>of(
                            "role", m.getRole().name().toLowerCase(),
                            "content", content != null ? content : "");
                })
                .toList();
    }

    private void sendSseEvent(SseEmitter emitter, String eventName, Object data) throws IOException {
        emitter.send(SseEmitter.event()
                .name(eventName)
                .data(objectMapper.writeValueAsString(data)));
    }

    private String classifyAiError(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        if (msg.contains("429") || msg.contains("rate limit")) return "RATE_LIMITED";
        if (msg.contains("401") || msg.contains("unauthorized")) return "AUTH_FAILED";
        if (msg.contains("500") || msg.contains("503")) return "SERVICE_UNAVAILABLE";
        if (msg.contains("timeout")) return "TIMEOUT";
        return "GENERATION_FAILED";
    }

    private String sanitizeChatMessage(String message) {
        if (message == null) return "";
        message = message.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "").trim();
        return message.length() > 10000 ? message.substring(0, 10000) : message;
    }

    private String serializeImages(List<SendMessageRequest.ImageAttachmentDto> images) {
        if (images == null) return null;
        try {
            return objectMapper.writeValueAsString(images);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private String serializeList(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private Map<String, Object> toMap(ChatMessage msg) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", msg.getExternalId());
        map.put("role", msg.getRole().name().toLowerCase());
        map.put("content", msg.getContent());
        map.put("timestamp", msg.getCreatedAt());
        if (msg.getVersionNumber() != null) map.put("versionNumber", msg.getVersionNumber());
        if (msg.getModel() != null) map.put("model", msg.getModel());
        if (msg.getChangedFiles() != null) {
            try {
                map.put("changedFiles", objectMapper.readValue(msg.getChangedFiles(), List.class));
            } catch (JsonProcessingException e) {
                map.put("changedFiles", List.of());
            }
        }
        return map;
    }
}
