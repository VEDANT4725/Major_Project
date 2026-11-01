package com.blueprintai.service;

import com.blueprintai.exception.ForbiddenException;
import com.blueprintai.ai.ModelRegistry;
import com.blueprintai.exception.ResourceNotFoundException;
import com.blueprintai.model.dto.request.CreateProjectRequest;
import com.blueprintai.model.dto.response.ProjectFilesResponse;
import com.blueprintai.model.dto.response.ProjectFilesResponse.ProjectFile;
import com.blueprintai.model.dto.response.ProjectResponse;
import com.blueprintai.model.entity.Project;
import com.blueprintai.model.entity.User;
import com.blueprintai.repository.ProjectRepository;
import com.blueprintai.repository.ChatMessageRepository;
import com.blueprintai.security.SecurityUtils;
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
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final VersionService versionService;
    private final ChatMessageRepository chatMessageRepository;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;

    private static final int FREE_PROJECT_LIMIT = 3;

    public List<ProjectResponse> listProjects() {
        Long userId = securityUtils.getCurrentUserId();
        return projectRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProject(String id) {
        Project project = findProjectOrThrow(id);
        return toResponse(project);
    }

    public ProjectFilesResponse getProjectFiles(String id) {
        Project project = findProjectOrThrow(id);
        List<Map<String, String>> files;
        try {
            files = versionService.getVersionFiles(id, project.getCurrentVersion());
        } catch (IOException e) {
            throw new ResourceNotFoundException("No files found for project");
        }
        List<ProjectFile> projectFiles = files.stream()
                .map(f -> new ProjectFile(f.get("path"), f.get("content")))
                .collect(Collectors.toList());
        return new ProjectFilesResponse(projectFiles, project.getCurrentVersion());
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        User user = securityUtils.getCurrentUser();

        String name = sanitizeProjectName(request.getName());
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Invalid project name");
        }

        long projectCount = projectRepository.countByUserId(userId);
        if (projectCount >= FREE_PROJECT_LIMIT) {
            throw new com.blueprintai.exception.ProjectLimitReachedException(
                    "Free plan limited to " + FREE_PROJECT_LIMIT + " projects");
        }

        String projectId = generateId(12);
        Project project = Project.builder()
                .id(projectId)
                .user(user)
                .name(name)
                .model(request.getModel() != null ? request.getModel() : ModelRegistry.DEFAULT_MODEL)
                .currentVersion(0)
                .build();

        project = projectRepository.save(project);

        List<Map<String, String>> initialFiles = createInitialFiles(name);
        versionService.saveVersion(projectId, 0, initialFiles, "Initial project setup",
                request.getModel(), "ai", null, null, 0);

        return toResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(String id, String name, String model) {
        Project project = findProjectOrThrow(id);
        if (name != null) {
            project.setName(sanitizeProjectName(name));
        }
        if (model != null) {
            project.setModel(model);
        }
        project = projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public Map<String, Object> deleteProject(String id) {
        Project project = findProjectOrThrow(id);
        chatMessageRepository.deleteByProjectId(id);
        versionService.deleteProjectFiles(id);
        projectRepository.delete(project);
        return Map.of("message", "Project deleted successfully", "success", true);
    }

    public Project findProjectOrThrow(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
        Long userId = securityUtils.getCurrentUserId();
        if (!project.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied");
        }
        return project;
    }

    public void incrementVersion(Project project) {
        project.setCurrentVersion(project.getCurrentVersion() + 1);
        projectRepository.save(project);
    }

    private String sanitizeProjectName(String name) {
        if (name == null) return "";
        name = name.replaceAll("<[^>]*>", "")
                   .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "")
                   .trim();
        return name.length() > 100 ? name.substring(0, 100) : name;
    }

    private String generateId(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private List<Map<String, String>> createInitialFiles(String projectName) {
        return List.of(
            Map.of("path", "src/App.tsx", "content", String.format(
                "import React from 'react';\n\nexport default function App() {\n  return (\n    <div className=\"min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600\">\n      <div className=\"text-center\">\n        <h1 className=\"text-4xl font-bold text-white mb-4\">%s</h1>\n        <p className=\"text-white/80\">Your project is ready to go!</p>\n      </div>\n    </div>\n  );\n}", projectName)),
            Map.of("path", "src/index.tsx", "content",
                "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);"),
            Map.of("path", "src/index.css", "content",
                "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}"),
            Map.of("path", "package.json", "content", String.format(
                "{\n  \"name\": \"%s\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"dependencies\": {\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\",\n    \"react-scripts\": \"5.0.1\",\n    \"typescript\": \"^5.0.0\",\n    \"tailwindcss\": \"^3.4.0\"\n  },\n  \"scripts\": {\n    \"dev\": \"react-scripts start\",\n    \"build\": \"react-scripts build\"\n  }\n}", projectName))
        );
    }

    private ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .model(project.getModel())
                .currentVersion(project.getCurrentVersion())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
