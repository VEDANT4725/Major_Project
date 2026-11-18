package com.blueprintai.controller;

import com.blueprintai.model.dto.request.SendMessageRequest;
import com.blueprintai.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/{projectId}")
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getChatHistory(
            @PathVariable String projectId) {
        return ResponseEntity.ok(Map.of("messages", chatService.getChatHistory(projectId)));
    }

    @PostMapping(value = "/{projectId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendMessage(
            @PathVariable String projectId,
            @Valid @RequestBody SendMessageRequest request) {
        SseEmitter emitter = new SseEmitter(600000L);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Received AI generation request for project {} with model {}",
                projectId, request.getModel());

        Thread.startVirtualThread(() -> {
            try {
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);

                chatService.sendMessage(projectId, request, emitter);
            } catch (Exception e) {
                log.error("Error in SSE stream for project {}", projectId, e);
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data(Map.of(
                                    "code", "GENERATION_FAILED",
                                    "message", "The server could not complete generation. Check backend logs.")));
                    emitter.complete();
                } catch (IOException sendException) {
                    log.warn("Could not send generation error to client for project {}",
                            projectId, sendException);
                }
            } finally {
                SecurityContextHolder.clearContext();
            }
        });

        emitter.onTimeout(() -> {
            log.warn("AI generation stream timed out for project {}", projectId);
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data(Map.of(
                                "code", "TIMEOUT",
                                "message", "AI generation timed out. Check backend logs and try again.")));
            } catch (IOException e) {
                log.warn("Could not send timeout error to client for project {}", projectId, e);
            } finally {
                emitter.complete();
            }
        });
        emitter.onError(error ->
                log.error("AI generation stream failed for project {}", projectId, error));

        return emitter;
    }
}
