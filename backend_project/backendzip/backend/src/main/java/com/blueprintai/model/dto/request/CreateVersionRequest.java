package com.blueprintai.model.dto.request;

import com.blueprintai.model.enums.VersionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateVersionRequest {

    private List<ProjectFileDto> files;

    private String prompt;

    private String model;

    @NotNull(message = "Type is required")
    private VersionType type;

    private List<String> changedFiles;

    private Integer restoredFrom;

    @Data
    public static class ProjectFileDto {
        private String path;
        private String content;
    }
}
