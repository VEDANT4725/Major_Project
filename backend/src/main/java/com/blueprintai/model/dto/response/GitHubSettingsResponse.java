package com.blueprintai.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class GitHubSettingsResponse {
    private boolean connected;
    private String username;
    private String avatarUrl;
    private String name;
}
