package com.blueprintai.controller;

import com.blueprintai.model.dto.request.CreateVersionRequest;
import com.blueprintai.model.dto.response.VersionResponse;
import com.blueprintai.service.VersionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/versions")
@RequiredArgsConstructor
public class VersionController {

    private final VersionService versionService;

    @GetMapping
    public ResponseEntity<Map<String, List<VersionResponse>>> listVersions(
            @PathVariable String projectId) {
        return ResponseEntity.ok(Map.of("versions", versionService.listVersions(projectId)));
    }

    @GetMapping("/{version}")
    public ResponseEntity<Map<String, Object>> getVersionFiles(
            @PathVariable String projectId,
            @PathVariable int version) throws Exception {
        var files = versionService.getVersionFiles(projectId, version);
        return ResponseEntity.ok(Map.of("files", files, "version", version));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createVersion(
            @PathVariable String projectId,
            @Valid @RequestBody CreateVersionRequest request) {
        var version = versionService.createManualVersion(
                projectId,
                request.getFiles().stream()
                        .map(f -> Map.of("path", f.getPath(), "content", f.getContent()))
                        .toList(),
                request.getPrompt(),
                request.getModel(),
                request.getType(),
                request.getChangedFiles(),
                request.getRestoredFrom());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("version", version.getVersionNumber()));
    }
}
