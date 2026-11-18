package com.blueprintai.controller;

import com.blueprintai.model.dto.request.VercelDeployRequest;
import com.blueprintai.model.dto.response.VercelDeploymentResponse;
import com.blueprintai.model.dto.response.VercelSettingsResponse;
import com.blueprintai.service.VercelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class VercelController {

    private final VercelService vercelService;

    @GetMapping("/api/settings/vercel")
    public ResponseEntity<VercelSettingsResponse> getVercelStatus() {
        return ResponseEntity.ok(vercelService.getConnectionStatus());
    }

    @GetMapping("/api/settings/vercel/oauth/url")
    public ResponseEntity<Map<String, Object>> getVercelOAuthUrl(
            @RequestParam(required = false) String projectId) {
        return ResponseEntity.ok(vercelService.getOAuthAuthorizeUrl(projectId));
    }

    @PostMapping("/api/settings/vercel/oauth")
    public ResponseEntity<VercelSettingsResponse> connectVercelOAuth(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                vercelService.connectWithOAuth(
                        body.get("code"),
                        body.get("state"),
                        body.get("teamId")));
    }

    @PostMapping("/api/settings/vercel")
    public ResponseEntity<VercelSettingsResponse> connectVercel(
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                vercelService.connectWithToken(body.get("token"), body.get("teamId")));
    }

    @DeleteMapping("/api/settings/vercel")
    public ResponseEntity<Map<String, Object>> disconnectVercel() {
        vercelService.disconnect();
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/api/deploy/vercel/{projectId}")
    public ResponseEntity<VercelDeploymentResponse> deployProject(
            @PathVariable String projectId,
            @RequestBody(required = false) VercelDeployRequest request) {
        return ResponseEntity.ok(vercelService.deployProject(projectId, request));
    }

    @GetMapping("/api/deploy/vercel/status/{deploymentId}")
    public ResponseEntity<VercelDeploymentResponse> getDeploymentStatus(
            @PathVariable String deploymentId,
            @RequestParam(required = false) String teamId) {
        return ResponseEntity.ok(vercelService.getDeploymentStatus(deploymentId, teamId));
    }
}
