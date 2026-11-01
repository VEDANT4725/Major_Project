package com.blueprintai.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class ProjectFilesResponse {
    private List<ProjectFile> files;
    private int version;

    @Data
    @AllArgsConstructor
    @Builder
    public static class ProjectFile {
        private String path;
        private String content;
    }
}
