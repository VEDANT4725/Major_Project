package com.blueprintai.controller;

import com.blueprintai.model.dto.request.CreateProjectRequest;
import com.blueprintai.model.dto.response.ProjectFilesResponse;
import com.blueprintai.model.dto.response.ProjectResponse;
import com.blueprintai.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<Map<String, List<ProjectResponse>>> listProjects() {
        return ResponseEntity.ok(Map.of("projects", projectService.listProjects()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, ProjectResponse>> getProject(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("project", projectService.getProject(id)));
    }

    @GetMapping("/{id}/files")
    public ResponseEntity<ProjectFilesResponse> getProjectFiles(@PathVariable String id) {
        return ResponseEntity.ok(projectService.getProjectFiles(id));
    }

    @PostMapping
    public ResponseEntity<Map<String, ProjectResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("project", projectService.createProject(request)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, ProjectResponse>> updateProject(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("project",
                projectService.updateProject(id, body.get("name"), body.get("model"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProject(@PathVariable String id) {
        return ResponseEntity.ok(projectService.deleteProject(id));
    }
}
