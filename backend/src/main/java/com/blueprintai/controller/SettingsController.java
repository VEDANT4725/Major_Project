package com.blueprintai.controller;

import com.blueprintai.model.dto.response.GitHubSettingsResponse;
import com.blueprintai.service.GitHubService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings/github")
@RequiredArgsConstructor
public class SettingsController {

    private final GitHubService gitHubService;

    @GetMapping
    public ResponseEntity<GitHubSettingsResponse> getGithubStatus() {
        return ResponseEntity.ok(gitHubService.getConnectionStatus());
    }

    @PostMapping
    public ResponseEntity<GitHubSettingsResponse> connectGithub(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(gitHubService.connectWithToken(body.get("token")));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> disconnectGithub() {
        gitHubService.disconnect();
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/token")
    public ResponseEntity<Map<String, String>> getGithubToken() {
        return ResponseEntity.ok(Map.of("token", gitHubService.getGitHubToken()));
    }

    @PostMapping("/oauth")
    public ResponseEntity<GitHubSettingsResponse> connectGithubOauth(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(gitHubService.connectWithOAuth(body.get("code")));
    }
}
