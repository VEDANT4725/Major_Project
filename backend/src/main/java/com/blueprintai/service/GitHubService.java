package com.blueprintai.service;

import com.blueprintai.exception.ResourceNotFoundException;
import com.blueprintai.model.dto.response.GitHubSettingsResponse;
import com.blueprintai.model.entity.GithubConnection;
import com.blueprintai.model.entity.User;
import com.blueprintai.repository.GithubConnectionRepository;
import com.blueprintai.security.SecurityUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitHubService {

    private final GithubConnectionRepository githubConnectionRepository;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;

    @Value("${blueprintai.github.client-id:}")
    private String githubClientId;

    @Value("${blueprintai.github.client-secret:}")
    private String githubClientSecret;

    private final WebClient webClient = WebClient.builder().build();

    public GitHubSettingsResponse getConnectionStatus() {
        Long userId = securityUtils.getCurrentUserId();
        return githubConnectionRepository.findByUserId(userId)
                .map(conn -> GitHubSettingsResponse.builder()
                        .connected(true)
                        .username(conn.getGithubUsername())
                        .avatarUrl(conn.getAvatarUrl())
                        .name(conn.getName())
                        .build())
                .orElse(GitHubSettingsResponse.builder().connected(false).build());
    }

    @Transactional
    public GitHubSettingsResponse connectWithToken(String token) {
        Long userId = securityUtils.getCurrentUserId();
        User user = securityUtils.getCurrentUser();

        try {
            String userInfoJson = webClient.get()
                    .uri("https://api.github.com/user")
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/vnd.github+json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode userInfo = objectMapper.readTree(userInfoJson);
            String username = userInfo.path("login").asText();
            String avatarUrl = userInfo.path("avatar_url").asText();
            String name = userInfo.path("name").asText(username);

            GithubConnection connection = githubConnectionRepository.findByUserId(userId)
                    .orElse(GithubConnection.builder().user(user).build());
            connection.setGithubUsername(username);
            connection.setAccessToken(token);
            connection.setAvatarUrl(avatarUrl);
            connection.setName(name);
            githubConnectionRepository.save(connection);

            return GitHubSettingsResponse.builder()
                    .connected(true)
                    .username(username)
                    .avatarUrl(avatarUrl)
                    .name(name)
                    .build();
        } catch (Exception e) {
            log.error("Failed to validate GitHub token", e);
            throw new IllegalArgumentException("Invalid GitHub token");
        }
    }

    @Transactional
    public GitHubSettingsResponse connectWithOAuth(String code) {
        Long userId = securityUtils.getCurrentUserId();
        User user = securityUtils.getCurrentUser();

        if (githubClientId.isEmpty() || githubClientSecret.isEmpty()) {
            throw new IllegalStateException("GitHub OAuth not configured");
        }

        try {
            String tokenResponseJson = webClient.post()
                    .uri("https://github.com/login/oauth/access_token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "client_id", githubClientId,
                            "client_secret", githubClientSecret,
                            "code", code))
                    .header("Accept", "application/json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode tokenResponse = objectMapper.readTree(tokenResponseJson);
            if (tokenResponse.has("error")) {
                throw new IllegalArgumentException(
                        "OAuth error: " + tokenResponse.path("error_description").asText());
            }

            String accessToken = tokenResponse.get("access_token").asText();

            String userInfoJson = webClient.get()
                    .uri("https://api.github.com/user")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Accept", "application/vnd.github+json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode userInfo = objectMapper.readTree(userInfoJson);
            String username = userInfo.path("login").asText();
            String avatarUrl = userInfo.path("avatar_url").asText();
            String name = userInfo.path("name").asText(username);

            GithubConnection connection = githubConnectionRepository.findByUserId(userId)
                    .orElse(GithubConnection.builder().user(user).build());
            connection.setGithubUsername(username);
            connection.setAccessToken(accessToken);
            connection.setAvatarUrl(avatarUrl);
            connection.setName(name);
            githubConnectionRepository.save(connection);

            return GitHubSettingsResponse.builder()
                    .connected(true)
                    .username(username)
                    .avatarUrl(avatarUrl)
                    .name(name)
                    .build();
        } catch (Exception e) {
            log.error("Failed to exchange OAuth code", e);
            throw new RuntimeException("GitHub OAuth exchange failed", e);
        }
    }

    @Transactional
    public void disconnect() {
        Long userId = securityUtils.getCurrentUserId();
        githubConnectionRepository.deleteByUserId(userId);
    }

    public String getGitHubToken() {
        Long userId = securityUtils.getCurrentUserId();
        return githubConnectionRepository.findByUserId(userId)
                .map(GithubConnection::getAccessToken)
                .orElseThrow(() -> new IllegalArgumentException("GitHub not connected"));
    }
}
