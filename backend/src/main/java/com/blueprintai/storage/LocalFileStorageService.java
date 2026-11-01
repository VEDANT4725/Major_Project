package com.blueprintai.storage;

import com.blueprintai.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Slf4j
@Service
public class LocalFileStorageService {

    private final Path basePath;
    private final ObjectMapper objectMapper;

    public LocalFileStorageService(
            @Value("${blueprintai.storage.base-path:./data/blueprint-ai}") String basePath,
            ObjectMapper objectMapper) {
        this.basePath = Path.of(basePath);
        this.objectMapper = objectMapper;
        try {
            Files.createDirectories(this.basePath);
        } catch (IOException e) {
            log.error("Failed to create storage base path", e);
        }
    }

    public void saveVersion(String projectId, int versionNumber,
                            List<Map<String, String>> files) throws IOException {
        Path versionDir = basePath.resolve(projectId).resolve("v" + versionNumber);
        Files.createDirectories(versionDir);
        Path filePath = versionDir.resolve("files.json");
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(filePath.toFile(), files);
    }

    public List<Map<String, String>> getVersion(String projectId, int versionNumber)
            throws IOException {
        Path filePath = basePath.resolve(projectId)
                .resolve("v" + versionNumber)
                .resolve("files.json");

        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException(
                    "Version " + versionNumber + " not found for project " + projectId);
        }

        return objectMapper.readValue(filePath.toFile(),
                new TypeReference<List<Map<String, String>>>() {});
    }

    public void deleteProjectFiles(String projectId) {
        Path projectDir = basePath.resolve(projectId);
        try {
            if (Files.exists(projectDir)) {
                deleteRecursively(projectDir);
            }
        } catch (IOException e) {
            log.error("Failed to delete files for project {}", projectId, e);
        }
    }

    public List<Integer> listVersions(String projectId) throws IOException {
        Path projectDir = basePath.resolve(projectId);
        if (!Files.exists(projectDir)) {
            return List.of();
        }

        List<Integer> versions = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(projectDir, "v*")) {
            for (Path dir : stream) {
                String name = dir.getFileName().toString();
                try {
                    versions.add(Integer.parseInt(name.substring(1)));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        Collections.sort(versions);
        return versions;
    }

    private void deleteRecursively(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (DirectoryStream<Path> entries = Files.newDirectoryStream(path)) {
                for (Path entry : entries) {
                    deleteRecursively(entry);
                }
            }
        }
        Files.deleteIfExists(path);
    }
}
