package com.blueprintai.service;

import com.blueprintai.exception.ResourceNotFoundException;
import com.blueprintai.model.dto.response.VersionResponse;
import com.blueprintai.model.entity.Project;
import com.blueprintai.model.entity.ProjectVersion;
import com.blueprintai.model.enums.VersionType;
import com.blueprintai.repository.ProjectRepository;
import com.blueprintai.repository.ProjectVersionRepository;
import com.blueprintai.storage.LocalFileStorageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VersionService {

    private final ProjectVersionRepository versionRepository;
    private final ProjectRepository projectRepository;
    private final LocalFileStorageService fileStorage;
    private final ObjectMapper objectMapper;

    public List<VersionResponse> listVersions(String projectId) {
        return versionRepository.findByProjectIdOrderByVersionNumberAsc(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<Map<String, String>> getVersionFiles(String projectId, int versionNumber)
            throws IOException {
        return fileStorage.getVersion(projectId, versionNumber);
    }

    @Transactional
    public ProjectVersion saveVersion(String projectId, int versionNumber,
                                       List<Map<String, String>> files,
                                       String prompt, String model,
                                       String type, List<String> changedFiles,
                                       Integer restoredFrom, int fileCount) {
        try {
            fileStorage.saveVersion(projectId, versionNumber, files);
        } catch (IOException e) {
            log.error("Failed to save version files for project {} v{}", projectId, versionNumber, e);
            throw new RuntimeException("Failed to save version files", e);
        }

        String changedFilesJson = null;
        if (changedFiles != null) {
            try {
                changedFilesJson = objectMapper.writeValueAsString(changedFiles);
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize changed files", e);
            }
        }

        ProjectVersion version = ProjectVersion.builder()
                .project(Project.builder().id(projectId).build())
                .versionNumber(versionNumber)
                .prompt(prompt)
                .model(model)
                .type(VersionType.valueOf(type.toUpperCase()))
                .changedFiles(changedFilesJson)
                .fileCount(fileCount > 0 ? fileCount : files.size())
                .restoredFrom(restoredFrom)
                .build();

        return versionRepository.save(version);
    }

    @Transactional
    public ProjectVersion createManualVersion(String projectId,
                                               List<Map<String, String>> files,
                                               String prompt, String model,
                                               VersionType type,
                                               List<String> changedFiles,
                                               Integer restoredFrom) {
        Optional<ProjectVersion> latest = versionRepository
                .findByProjectIdOrderByVersionNumberAsc(projectId).stream()
                .reduce((a, b) -> b);

        int nextVersion = latest.map(v -> v.getVersionNumber() + 1).orElse(0);

        ProjectVersion saved = saveVersion(projectId, nextVersion, files, prompt, model,
                type.name(), changedFiles, restoredFrom, files.size());

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        project.setCurrentVersion(nextVersion);
        projectRepository.save(project);

        return saved;
    }

    public void deleteProjectFiles(String projectId) {
        fileStorage.deleteProjectFiles(projectId);
        versionRepository.deleteByProjectId(projectId);
    }

    private VersionResponse toResponse(ProjectVersion version) {
        List<String> changedFiles = null;
        if (version.getChangedFiles() != null) {
            try {
                changedFiles = objectMapper.readValue(
                        version.getChangedFiles(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse changed files for version", e);
            }
        }

        return VersionResponse.builder()
                .versionNumber(version.getVersionNumber())
                .prompt(version.getPrompt())
                .model(version.getModel())
                .type(version.getType())
                .changedFiles(changedFiles)
                .fileCount(version.getFileCount())
                .restoredFrom(version.getRestoredFrom())
                .createdAt(version.getCreatedAt())
                .build();
    }
}
