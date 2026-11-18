package com.blueprintai.service;

import com.blueprintai.model.dto.request.VercelDeployRequest;
import com.blueprintai.model.dto.response.VercelDeploymentResponse;
import com.blueprintai.model.dto.response.VercelSettingsResponse;
import com.blueprintai.model.entity.Project;
import com.blueprintai.model.entity.User;
import com.blueprintai.model.entity.VercelConnection;
import com.blueprintai.repository.ProjectRepository;
import com.blueprintai.repository.VercelConnectionRepository;
import com.blueprintai.security.SecurityUtils;
import com.blueprintai.security.TokenEncryptionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VercelService {

    private static final String VERCEL_API_BASE = "https://api.vercel.com";
    private static final long OAUTH_STATE_TTL_MS = 10 * 60 * 1000L; // 10 minutes

    private final VercelConnectionRepository vercelConnectionRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final VersionService versionService;
    private final SecurityUtils securityUtils;
    private final TokenEncryptionService tokenEncryptionService;
    private final ObjectMapper objectMapper;

    @Value("${blueprintai.vercel.client-id:}")
    private String vercelClientId;

    @Value("${blueprintai.vercel.client-secret:}")
    private String vercelClientSecret;

    @Value("${blueprintai.vercel.integration-slug:}")
    private String vercelIntegrationSlug;

    @Value("${blueprintai.vercel.redirect-uri:http://localhost:3000/auth/vercel/callback}")
    private String vercelRedirectUri;

    private final WebClient webClient = WebClient.builder()
            .baseUrl(VERCEL_API_BASE)
            .exchangeStrategies(ExchangeStrategies.builder()
                    .codecs(config -> config.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                    .build())
            .build();

    public boolean isOAuthConfigured() {
        return vercelClientId != null && !vercelClientId.isBlank()
                && vercelClientSecret != null && !vercelClientSecret.isBlank();
    }

    public VercelSettingsResponse getConnectionStatus() {
        Long userId = securityUtils.getCurrentUserId();
        boolean oauthReady = isOAuthConfigured();
        return vercelConnectionRepository.findByUserId(userId)
                .map(conn -> VercelSettingsResponse.builder()
                        .connected(true)
                        .oauthConfigured(oauthReady)
                        .authType(conn.getAuthType() != null ? conn.getAuthType() : "TOKEN")
                        .username(conn.getVercelUsername())
                        .name(conn.getName())
                        .email(conn.getEmail())
                        .avatarUrl(conn.getAvatarUrl())
                        .teamId(conn.getTeamId())
                        .installationId(conn.getInstallationId())
                        .build())
                .orElse(VercelSettingsResponse.builder()
                        .connected(false)
                        .oauthConfigured(oauthReady)
                        .build());
    }

    public Map<String, Object> getOAuthAuthorizeUrl(String projectId) {
        if (!isOAuthConfigured()) {
            throw new IllegalArgumentException(
                    "Vercel OAuth is not configured on the server. Set VERCEL_CLIENT_ID and VERCEL_CLIENT_SECRET in backend .env.");
        }

        Long userId = securityUtils.getCurrentUserId();
        Map<String, Object> statePayload = new LinkedHashMap<>();
        statePayload.put("uid", userId);
        statePayload.put("ts", System.currentTimeMillis());
        statePayload.put("n", UUID.randomUUID().toString().substring(0, 8));
        if (projectId != null && !projectId.isBlank()) {
            statePayload.put("pid", projectId.trim());
        }

        String signedState;
        try {
            signedState = tokenEncryptionService.signState(objectMapper.writeValueAsString(statePayload));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate OAuth state");
        }

        String encodedState = URLEncoder.encode(signedState, StandardCharsets.UTF_8);
        String authorizeUrl;
        String mode;

        if (vercelIntegrationSlug != null && !vercelIntegrationSlug.isBlank()) {
            String cleanSlug = URLEncoder.encode(vercelIntegrationSlug.trim(), StandardCharsets.UTF_8);
            authorizeUrl = "https://vercel.com/integrations/" + cleanSlug + "/new?state=" + encodedState;
            mode = "integration";
        } else {
            String encodedClientId = URLEncoder.encode(vercelClientId.trim(), StandardCharsets.UTF_8);
            String encodedRedirect = URLEncoder.encode(vercelRedirectUri.trim(), StandardCharsets.UTF_8);
            authorizeUrl = "https://vercel.com/oauth/authorize"
                    + "?client_id=" + encodedClientId
                    + "&redirect_uri=" + encodedRedirect
                    + "&response_type=code"
                    + "&state=" + encodedState;
            mode = "oauth";
        }

        return Map.of(
                "url", authorizeUrl,
                "mode", mode,
                "redirectUri", vercelRedirectUri
        );
    }

    @Transactional
    public VercelSettingsResponse connectWithOAuth(String code, String state, String teamIdFromQuery) {
        if (!isOAuthConfigured()) {
            throw new IllegalArgumentException("Vercel OAuth is not configured on the server.");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Authorization code is missing.");
        }

        Long currentUserId = securityUtils.getCurrentUserId();
        User user = securityUtils.getCurrentUser();

        // Verify signed CSRF state if present (mandatory when flow started via our backend)
        String returnProjectId = null;
        if (state != null && !state.isBlank()) {
            String decodedJson = tokenEncryptionService.verifyAndDecodeState(state);
            try {
                JsonNode stateNode = objectMapper.readTree(decodedJson);
                long stateUid = stateNode.path("uid").asLong(-1L);
                long stateTs = stateNode.path("ts").asLong(0L);
                if (stateUid != currentUserId) {
                    throw new IllegalArgumentException("OAuth state user mismatch. Please retry connecting Vercel.");
                }
                if (System.currentTimeMillis() - stateTs > OAUTH_STATE_TTL_MS) {
                    throw new IllegalArgumentException("OAuth session expired. Please try connecting Vercel again.");
                }
                String pid = stateNode.path("pid").asText(null);
                if (pid != null && !pid.isBlank()) {
                    returnProjectId = pid;
                }
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid OAuth state payload.");
            }
        }

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", vercelClientId.trim());
        formData.add("client_secret", vercelClientSecret.trim());
        formData.add("code", code.trim());
        formData.add("redirect_uri", vercelRedirectUri.trim());

        try {
            String tokenResponseJson = webClient.post()
                    .uri("/v2/oauth/access_token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode tokenNode = objectMapper.readTree(tokenResponseJson);
            String accessToken = tokenNode.path("access_token").asText(null);
            if (accessToken == null || accessToken.isBlank()) {
                throw new IllegalArgumentException("Vercel OAuth did not return an access token.");
            }

            String oauthTeamId = firstNonBlank(
                    tokenNode.path("team_id").asText(null),
                    teamIdFromQuery);
            String installationId = tokenNode.path("installation_id").asText(null);
            String oauthUserId = tokenNode.path("user_id").asText(null);

            VercelUserProfile profile = fetchVercelUserProfile(accessToken, oauthUserId);

            VercelConnection connection = vercelConnectionRepository.findByUserId(currentUserId)
                    .orElse(VercelConnection.builder().user(user).build());
            connection.setVercelUserId(profile.userId);
            connection.setVercelUsername(profile.username);
            connection.setEmail(profile.email);
            connection.setName(profile.name);
            connection.setAvatarUrl(profile.avatarUrl);
            connection.setAccessToken(tokenEncryptionService.encrypt(accessToken));
            connection.setTeamId(oauthTeamId);
            connection.setInstallationId(installationId);
            connection.setAuthType("OAUTH");
            vercelConnectionRepository.save(connection);

            log.info("Connected Vercel via OAuth for userId={} vercelUser={} teamId={}",
                    currentUserId, profile.username, oauthTeamId);

            return VercelSettingsResponse.builder()
                    .connected(true)
                    .oauthConfigured(true)
                    .authType("OAUTH")
                    .username(profile.username)
                    .name(profile.name)
                    .email(profile.email)
                    .avatarUrl(profile.avatarUrl)
                    .teamId(oauthTeamId)
                    .installationId(installationId)
                    .projectId(returnProjectId)
                    .build();
        } catch (WebClientResponseException e) {
            log.error("Vercel OAuth token exchange failed: status={} body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new IllegalArgumentException("Vercel OAuth exchange failed: " + extractVercelErrorMessage(e));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during Vercel OAuth exchange", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Vercel OAuth handshake failed: " + e.getMessage());
        }
    }

    @Transactional
    public VercelSettingsResponse connectWithToken(String rawToken, String rawTeamId) {
        String token = rawToken != null ? rawToken.trim() : "";
        String teamId = rawTeamId != null && !rawTeamId.trim().isEmpty() ? rawTeamId.trim() : null;

        if (token.isEmpty()) {
            throw new IllegalArgumentException("Vercel access token is required");
        }

        Long userId = securityUtils.getCurrentUserId();
        User user = securityUtils.getCurrentUser();

        try {
            VercelUserProfile profile = fetchVercelUserProfile(token, null);

            VercelConnection connection = vercelConnectionRepository.findByUserId(userId)
                    .orElse(VercelConnection.builder().user(user).build());
            connection.setVercelUserId(profile.userId);
            connection.setVercelUsername(profile.username);
            connection.setEmail(profile.email);
            connection.setName(profile.name);
            connection.setAvatarUrl(profile.avatarUrl);
            connection.setAccessToken(tokenEncryptionService.encrypt(token));
            connection.setTeamId(teamId);
            connection.setInstallationId(null);
            connection.setAuthType("TOKEN");
            vercelConnectionRepository.save(connection);

            return VercelSettingsResponse.builder()
                    .connected(true)
                    .oauthConfigured(isOAuthConfigured())
                    .authType("TOKEN")
                    .username(profile.username)
                    .name(profile.name)
                    .email(profile.email)
                    .avatarUrl(profile.avatarUrl)
                    .teamId(teamId)
                    .build();
        } catch (WebClientResponseException e) {
            log.warn("Vercel token validation failed: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
                throw new IllegalArgumentException("Invalid or expired Vercel access token. Please generate a new token from Vercel Account Settings.");
            }
            throw new IllegalArgumentException("Failed to verify Vercel token: " + extractVercelErrorMessage(e));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to connect Vercel account", e);
            throw new IllegalArgumentException("Unable to connect to Vercel API. Please check your token and try again.");
        }
    }

    @Transactional
    public void disconnect() {
        Long userId = securityUtils.getCurrentUserId();
        vercelConnectionRepository.deleteByUserId(userId);
    }

    @Transactional
    public VercelDeploymentResponse deployProject(String projectId, VercelDeployRequest request) {
        Project project = projectService.findProjectOrThrow(projectId);
        Long userId = securityUtils.getCurrentUserId();

        VercelConnection connection = vercelConnectionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Vercel account is not connected. Please connect your Vercel account in Settings first."));

        String decryptedToken = tokenEncryptionService.decrypt(connection.getAccessToken());

        String requestedName = request != null && request.getProjectName() != null && !request.getProjectName().isBlank()
                ? request.getProjectName()
                : (project.getVercelProjectName() != null && !project.getVercelProjectName().isBlank()
                        ? project.getVercelProjectName()
                        : project.getName());
        String vercelProjectName = sanitizeVercelProjectName(requestedName);

        String target = request != null && "preview".equalsIgnoreCase(request.getTarget())
                ? "preview"
                : "production";

        String effectiveTeamId = request != null && request.getTeamId() != null && !request.getTeamId().isBlank()
                ? request.getTeamId().trim()
                : connection.getTeamId();

        // Collect files: prefer current editor files if passed, otherwise load latest saved version from storage
        Map<String, String> sourceFiles = new LinkedHashMap<>();
        if (request != null && request.getFiles() != null && !request.getFiles().isEmpty()) {
            sourceFiles.putAll(request.getFiles());
        } else {
            try {
                List<Map<String, String>> storedFiles = versionService.getVersionFiles(
                        projectId, project.getCurrentVersion());
                for (Map<String, String> f : storedFiles) {
                    String path = f.get("path");
                    String content = f.get("content");
                    if (path != null && content != null) {
                        sourceFiles.put(path, content);
                    }
                }
            } catch (IOException e) {
                log.error("Failed to read project files for Vercel deployment: project={}", projectId, e);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Could not read project files for deployment");
            }
        }

        if (sourceFiles.isEmpty()) {
            throw new IllegalArgumentException("Project has no files to deploy");
        }

        PreparedDeployment prepared = prepareFilesForVercel(sourceFiles, project.getName());

        List<Map<String, Object>> vercelFiles = new ArrayList<>();
        for (Map.Entry<String, String> entry : prepared.files.entrySet()) {
            Map<String, Object> fileObj = new LinkedHashMap<>();
            fileObj.put("file", entry.getKey());
            fileObj.put("data", entry.getValue());
            fileObj.put("encoding", "utf-8");
            vercelFiles.add(fileObj);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", vercelProjectName);
        payload.put("files", vercelFiles);
        if ("production".equals(target)) {
            payload.put("target", "production");
        }
        payload.put("projectSettings", prepared.projectSettings);

        String uri = "/v13/deployments?skipAutoDetectionConfirmation=1"
                + (effectiveTeamId != null && !effectiveTeamId.isBlank()
                        ? "&teamId=" + URLEncoder.encode(effectiveTeamId, StandardCharsets.UTF_8)
                        : "");

        try {
            String responseJson = webClient.post()
                    .uri(uri)
                    .header("Authorization", "Bearer " + decryptedToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode res = objectMapper.readTree(responseJson);
            VercelDeploymentResponse deployment = parseDeploymentResponse(res, vercelProjectName, target);

            // Persist latest Vercel deployment metadata on the Project
            project.setVercelProjectName(vercelProjectName);
            project.setVercelDeploymentId(deployment.getDeploymentId());
            project.setVercelDeploymentUrl(
                    deployment.getAliasUrl() != null ? deployment.getAliasUrl() : deployment.getUrl());
            project.setVercelLastDeployedAt(Instant.now());
            projectRepository.save(project);

            log.info("Triggered Vercel deployment: project={} vercelProject={} deploymentId={} state={}",
                    projectId, vercelProjectName, deployment.getDeploymentId(), deployment.getReadyState());

            return deployment;
        } catch (WebClientResponseException e) {
            log.error("Vercel deployment API error: status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            String msg = extractVercelErrorMessage(e);
            if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Vercel authentication failed: " + msg + ". Please reconnect your Vercel account in Settings.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Vercel deployment failed: " + msg);
        } catch (Exception e) {
            log.error("Unexpected error deploying project {} to Vercel", projectId, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to deploy to Vercel: " + e.getMessage());
        }
    }

    public VercelDeploymentResponse getDeploymentStatus(String deploymentId, String teamIdOverride) {
        if (deploymentId == null || deploymentId.isBlank()) {
            throw new IllegalArgumentException("Deployment ID is required");
        }
        Long userId = securityUtils.getCurrentUserId();
        VercelConnection connection = vercelConnectionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vercel account is not connected"));

        String decryptedToken = tokenEncryptionService.decrypt(connection.getAccessToken());
        String effectiveTeamId = teamIdOverride != null && !teamIdOverride.isBlank()
                ? teamIdOverride.trim()
                : connection.getTeamId();

        String uri = "/v13/deployments/" + URLEncoder.encode(deploymentId, StandardCharsets.UTF_8)
                + (effectiveTeamId != null && !effectiveTeamId.isBlank()
                        ? "?teamId=" + URLEncoder.encode(effectiveTeamId, StandardCharsets.UTF_8)
                        : "");

        try {
            String responseJson = webClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + decryptedToken)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode res = objectMapper.readTree(responseJson);
            String projectName = res.path("name").asText(null);
            String target = res.path("target").asText("preview");
            return parseDeploymentResponse(res, projectName, target);
        } catch (WebClientResponseException e) {
            log.warn("Failed to poll Vercel deployment {}: status={} body={}",
                    deploymentId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to check deployment status: " + extractVercelErrorMessage(e));
        } catch (Exception e) {
            log.error("Unexpected error checking Vercel deployment status {}", deploymentId, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to check deployment status");
        }
    }

    private VercelUserProfile fetchVercelUserProfile(String accessToken, String fallbackUserId) throws Exception {
        String userInfoJson = webClient.get()
                .uri("/v2/user")
                .header("Authorization", "Bearer " + accessToken)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode root = objectMapper.readTree(userInfoJson);
        JsonNode userNode = root.has("user") ? root.get("user") : root;

        String vercelUserId = firstNonBlank(
                userNode.path("id").asText(null),
                userNode.path("uid").asText(null),
                fallbackUserId);
        String username = userNode.path("username").asText(null);
        String email = userNode.path("email").asText(null);
        String name = firstNonBlank(userNode.path("name").asText(null), username);
        String rawAvatar = userNode.path("avatar").asText(null);
        String avatarUrl = resolveAvatarUrl(rawAvatar);

        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Could not verify Vercel account from the provided credentials");
        }
        return new VercelUserProfile(vercelUserId, username, email, name, avatarUrl);
    }

    private VercelDeploymentResponse parseDeploymentResponse(JsonNode res, String fallbackProjectName, String target) {
        String id = firstNonBlank(res.path("id").asText(null), res.path("uid").asText(null));
        String rawUrl = res.path("url").asText(null);
        String url = normalizeHttpsUrl(rawUrl);

        String aliasUrl = null;
        JsonNode aliasNode = res.path("alias");
        if (aliasNode.isArray() && !aliasNode.isEmpty()) {
            aliasUrl = normalizeHttpsUrl(aliasNode.get(0).asText(null));
        }
        if (aliasUrl == null) {
            aliasUrl = url;
        }

        String inspectorUrl = res.path("inspectorUrl").asText(null);
        String readyState = firstNonBlank(
                res.path("readyState").asText(null),
                res.path("status").asText(null),
                "QUEUED");

        String errorMessage = null;
        if (res.has("errorMessage") && !res.path("errorMessage").isNull()) {
            errorMessage = res.path("errorMessage").asText(null);
        } else if (res.has("error") && res.path("error").has("message")) {
            errorMessage = res.path("error").path("message").asText(null);
        }

        Instant createdAt = Instant.now();
        if (res.has("createdAt") && res.path("createdAt").isNumber()) {
            createdAt = Instant.ofEpochMilli(res.path("createdAt").asLong());
        }

        return VercelDeploymentResponse.builder()
                .deploymentId(id)
                .projectName(firstNonBlank(res.path("name").asText(null), fallbackProjectName))
                .url(url)
                .aliasUrl(aliasUrl)
                .inspectorUrl(inspectorUrl)
                .readyState(readyState)
                .target(target)
                .errorMessage(errorMessage)
                .createdAt(createdAt)
                .build();
    }

    private PreparedDeployment prepareFilesForVercel(Map<String, String> sourceFiles, String projectTitle) {
        Map<String, String> cleaned = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : sourceFiles.entrySet()) {
            String path = entry.getKey();
            if (path == null) continue;
            String cleanPath = path.startsWith("/") ? path.substring(1) : path;
            if (cleanPath.isBlank()) continue;
            cleaned.put(cleanPath, entry.getValue() != null ? entry.getValue() : "");
        }

        String pkgJsonRaw = cleaned.get("package.json");
        boolean isVite = detectViteProject(cleaned, pkgJsonRaw);

        if (pkgJsonRaw != null) {
            cleaned.put("package.json", normalizePackageJson(pkgJsonRaw, isVite));
        }

        if (isVite) {
            if (!cleaned.containsKey("index.html") && cleaned.containsKey("public/index.html")) {
                cleaned.put("index.html", cleaned.remove("public/index.html"));
            }
            if (!cleaned.containsKey("index.html")) {
                String entryFile = cleaned.containsKey("src/main.tsx") ? "/src/main.tsx"
                        : cleaned.containsKey("src/main.jsx") ? "/src/main.jsx"
                        : cleaned.containsKey("src/index.tsx") ? "/src/index.tsx"
                        : "/src/index.jsx";
                cleaned.put("index.html", buildDefaultIndexHtml(projectTitle, entryFile));
            }
        } else {
            if (cleaned.containsKey("index.html") && !cleaned.containsKey("public/index.html")) {
                cleaned.put("public/index.html", cleaned.remove("index.html"));
            }
            if (!cleaned.containsKey("public/index.html")) {
                cleaned.put("public/index.html", buildDefaultIndexHtml(projectTitle, null));
            }
        }

        if (!cleaned.containsKey("tsconfig.json")) {
            cleaned.put("tsconfig.json", defaultTsConfig());
        }

        if (!cleaned.containsKey("vercel.json")) {
            cleaned.put("vercel.json", "{\n  \"rewrites\": [\n    { \"source\": \"/(.*)\", \"destination\": \"/index.html\" }\n  ]\n}\n");
        }

        Map<String, Object> projectSettings = new LinkedHashMap<>();
        if (isVite) {
            projectSettings.put("framework", "vite");
            projectSettings.put("buildCommand", "npm run build");
            projectSettings.put("installCommand", "npm install --legacy-peer-deps");
            projectSettings.put("outputDirectory", "dist");
        } else {
            projectSettings.put("framework", "create-react-app");
            projectSettings.put("buildCommand", "CI=false npm run build");
            projectSettings.put("installCommand", "npm install --legacy-peer-deps");
            projectSettings.put("outputDirectory", "build");
        }

        return new PreparedDeployment(cleaned, projectSettings);
    }

    private boolean detectViteProject(Map<String, String> files, String pkgJsonRaw) {
        if (files.containsKey("vite.config.ts") || files.containsKey("vite.config.js") || files.containsKey("vite.config.mjs")) {
            return true;
        }
        if (pkgJsonRaw != null) {
            try {
                JsonNode pkg = objectMapper.readTree(pkgJsonRaw);
                if (pkg.path("dependencies").has("vite") || pkg.path("devDependencies").has("vite")) {
                    return true;
                }
                String buildScript = pkg.path("scripts").path("build").asText("");
                if (buildScript.contains("vite")) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }
        return false;
    }

    private String normalizePackageJson(String pkgJsonRaw, boolean isVite) {
        try {
            JsonNode root = objectMapper.readTree(pkgJsonRaw);
            if (!(root instanceof ObjectNode pkg)) {
                return pkgJsonRaw;
            }
            ObjectNode scripts = pkg.has("scripts") && pkg.get("scripts").isObject()
                    ? (ObjectNode) pkg.get("scripts")
                    : pkg.putObject("scripts");

            if (!scripts.has("build")) {
                scripts.put("build", isVite ? "vite build" : "react-scripts build");
            }
            if (!scripts.has("dev") && scripts.has("start")) {
                scripts.put("dev", scripts.get("start").asText());
            }
            if (!isVite) {
                ObjectNode deps = pkg.has("dependencies") && pkg.get("dependencies").isObject()
                        ? (ObjectNode) pkg.get("dependencies")
                        : pkg.putObject("dependencies");
                if (!deps.has("react-scripts") && !pkg.path("devDependencies").has("react-scripts")) {
                    deps.put("react-scripts", "5.0.1");
                }
            }
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(pkg);
        } catch (Exception e) {
            return pkgJsonRaw;
        }
    }

    private String buildDefaultIndexHtml(String title, String viteModuleEntry) {
        String safeTitle = (title != null && !title.isBlank())
                ? title.replace("<", "&lt;").replace(">", "&gt;")
                : "WebCraft App";
        String moduleTag = viteModuleEntry != null
                ? "\n    <script type=\"module\" src=\"" + viteModuleEntry + "\"></script>"
                : "";
        return "<!DOCTYPE html>\n"
                + "<html lang=\"en\">\n"
                + "  <head>\n"
                + "    <meta charset=\"UTF-8\" />\n"
                + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n"
                + "    <title>" + safeTitle + "</title>\n"
                + "    <script src=\"https://cdn.tailwindcss.com\"></script>\n"
                + "    <style>\n"
                + "      html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; }\n"
                + "    </style>\n"
                + "  </head>\n"
                + "  <body>\n"
                + "    <div id=\"root\"></div>"
                + moduleTag + "\n"
                + "  </body>\n"
                + "</html>\n";
    }

    private String defaultTsConfig() {
        return "{\n"
                + "  \"compilerOptions\": {\n"
                + "    \"target\": \"es5\",\n"
                + "    \"lib\": [\"dom\", \"dom.iterable\", \"esnext\"],\n"
                + "    \"allowJs\": true,\n"
                + "    \"skipLibCheck\": true,\n"
                + "    \"esModuleInterop\": true,\n"
                + "    \"allowSyntheticDefaultImports\": true,\n"
                + "    \"strict\": false,\n"
                + "    \"forceConsistentCasingInFileNames\": true,\n"
                + "    \"noFallthroughCasesInSwitch\": true,\n"
                + "    \"module\": \"esnext\",\n"
                + "    \"moduleResolution\": \"node\",\n"
                + "    \"resolveJsonModule\": true,\n"
                + "    \"isolatedModules\": true,\n"
                + "    \"noEmit\": true,\n"
                + "    \"jsx\": \"react-jsx\"\n"
                + "  },\n"
                + "  \"include\": [\"src\"]\n"
                + "}\n";
    }

    private String sanitizeVercelProjectName(String rawName) {
        String name = (rawName == null ? "" : rawName).toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^[.-]+|[.-]+$", "");
        if (name.isEmpty()) {
            name = "webcraft-app";
        }
        if (name.length() > 100) {
            name = name.substring(0, 100).replaceAll("[.-]+$", "");
        }
        return name.isEmpty() ? "webcraft-app" : name;
    }

    private String resolveAvatarUrl(String rawAvatar) {
        if (rawAvatar == null || rawAvatar.isBlank()) {
            return null;
        }
        if (rawAvatar.startsWith("http://") || rawAvatar.startsWith("https://")) {
            return rawAvatar;
        }
        return "https://vercel.com/api/www/avatar/" + rawAvatar + "?s=128";
    }

    private String normalizeHttpsUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }
        if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
            return rawUrl;
        }
        return "https://" + rawUrl;
    }

    private String extractVercelErrorMessage(WebClientResponseException e) {
        try {
            JsonNode body = objectMapper.readTree(e.getResponseBodyAsString());
            if (body.has("error") && body.path("error").has("message")) {
                return body.path("error").path("message").asText();
            }
            if (body.has("error_description")) {
                return body.path("error_description").asText();
            }
            if (body.has("message")) {
                return body.path("message").asText();
            }
        } catch (Exception ignored) {
        }
        return e.getStatusText() != null && !e.getStatusText().isBlank()
                ? e.getStatusText()
                : "HTTP " + e.getStatusCode().value();
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    private record VercelUserProfile(String userId, String username, String email, String name, String avatarUrl) {
    }

    private record PreparedDeployment(Map<String, String> files, Map<String, Object> projectSettings) {
    }
}
