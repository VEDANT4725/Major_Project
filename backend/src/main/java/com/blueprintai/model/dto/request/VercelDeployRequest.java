package com.blueprintai.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VercelDeployRequest {
    private String projectName;
    private String target; // "production" (default) or "preview"
    private String teamId; // optional override
    private Map<String, String> files; // optional current editor files
}

