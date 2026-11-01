package com.blueprintai.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
@Builder
public class ProjectResponse {
    private String id;
    private String name;
    private String model;
    private int currentVersion;
    private Instant createdAt;
    private Instant updatedAt;
}
