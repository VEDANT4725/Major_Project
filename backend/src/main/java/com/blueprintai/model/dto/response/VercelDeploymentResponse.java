package com.blueprintai.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
@Builder
public class VercelDeploymentResponse {
    private String deploymentId;
    private String projectName;
    private String url;
    private String aliasUrl;
    private String inspectorUrl;
    private String readyState;
    private String target;
    private String errorMessage;
    private Instant createdAt;
}

