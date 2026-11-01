package com.blueprintai.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private String id;
    private String role;
    private String content;
    private Instant timestamp;
    private Integer versionNumber;
    private String model;
    private List<String> changedFiles;
}
