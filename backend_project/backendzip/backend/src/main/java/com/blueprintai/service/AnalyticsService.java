package com.blueprintai.service;

import com.blueprintai.model.dto.response.AnalyticsResponse;
import com.blueprintai.model.dto.response.CreditsResponse;
import com.blueprintai.model.entity.Project;
import com.blueprintai.model.entity.ProjectVersion;
import com.blueprintai.repository.ProjectRepository;
import com.blueprintai.repository.ProjectVersionRepository;
import com.blueprintai.security.SecurityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ProjectRepository projectRepository;
    private final ProjectVersionRepository versionRepository;
    private final CreditsService creditsService;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;

    public AnalyticsResponse getAnalytics() {
        Long userId = securityUtils.getCurrentUserId();
        List<Project> projects = projectRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        CreditsResponse credits = creditsService.getCredits();

        int totalGenerations = 0;
        Map<String, Integer> modelUsage = new HashMap<>();
        List<AnalyticsResponse.RecentGeneration> recentGenerations = new ArrayList<>();
        Map<String, int[]> timelineMap = new LinkedHashMap<>();

        for (Project project : projects) {
            List<ProjectVersion> versions = versionRepository
                    .findByProjectIdOrderByVersionNumberAsc(project.getId());

            totalGenerations += versions.size();

            for (ProjectVersion version : versions) {
                if (version.getModel() != null) {
                    modelUsage.merge(version.getModel(), 1, Integer::sum);
                }

                String date = version.getCreatedAt()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate()
                        .format(DateTimeFormatter.ISO_LOCAL_DATE);

                timelineMap.computeIfAbsent(date, k -> new int[]{0, 0})[0]++;
                if ("ai".equals(version.getType().name().toLowerCase())) {
                    timelineMap.get(date)[1]++;
                }

                List<String> changedFiles = null;
                if (version.getChangedFiles() != null) {
                    try {
                        changedFiles = objectMapper.readValue(version.getChangedFiles(), List.class);
                    } catch (Exception ignored) {}
                }

                recentGenerations.add(AnalyticsResponse.RecentGeneration.builder()
                        .projectId(project.getId())
                        .projectName(project.getName())
                        .versionNumber(version.getVersionNumber())
                        .type(version.getType().name().toLowerCase())
                        .prompt(version.getPrompt())
                        .model(version.getModel())
                        .createdAt(version.getCreatedAt())
                        .fileCount(version.getFileCount())
                        .build());
            }
        }

        recentGenerations.sort((a, b) ->
                b.getCreatedAt().compareTo(a.getCreatedAt()));
        if (recentGenerations.size() > 10) {
            recentGenerations = recentGenerations.subList(0, 10);
        }

        List<AnalyticsResponse.TimelineEntry> timeline = timelineMap.entrySet().stream()
                .map(e -> AnalyticsResponse.TimelineEntry.builder()
                        .date(e.getKey())
                        .projects(e.getValue()[0])
                        .generations(e.getValue()[1])
                        .build())
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());

        List<AnalyticsResponse.ProjectSummary> projectSummaries = projects.stream()
                .map(p -> {
                    long vCount = versionRepository.countByProjectId(p.getId());
                    return AnalyticsResponse.ProjectSummary.builder()
                            .id(p.getId())
                            .name(p.getName())
                            .model(p.getModel())
                            .versionCount((int) vCount)
                            .createdAt(p.getCreatedAt())
                            .updatedAt(p.getUpdatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        return AnalyticsResponse.builder()
                .stats(AnalyticsResponse.Stats.builder()
                        .totalProjects(projects.size())
                        .totalGenerations(totalGenerations)
                        .creditsRemaining(credits.getRemaining())
                        .creditsTotal(credits.getTotal())
                        .creditsUsed(credits.getTotal() == -1 ? 0 :
                                credits.getTotal() - credits.getRemaining())
                        .plan(credits.getPlan())
                        .build())
                .modelUsage(modelUsage)
                .timeline(timeline)
                .recentGenerations(recentGenerations)
                .projects(projectSummaries)
                .build();
    }
}
