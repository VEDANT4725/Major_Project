package com.blueprintai.model.dto.response;

import com.blueprintai.model.enums.VersionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class VersionResponse {
    private int versionNumber;
    private String prompt;
    private String model;
    private VersionType type;
    private List<String> changedFiles;
    private int fileCount;
    private Integer restoredFrom;
    private Instant createdAt;
}
