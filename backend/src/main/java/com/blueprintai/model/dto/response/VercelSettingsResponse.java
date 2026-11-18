package com.blueprintai.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class VercelSettingsResponse {
    private boolean connected;
    private boolean oauthConfigured;
    private String authType;
    private String username;
    private String name;
    private String email;
    private String avatarUrl;
    private String teamId;
    private String installationId;
    private String projectId;
}
