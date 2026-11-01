package com.blueprintai.model.dto.response;

import com.blueprintai.model.enums.PlanType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@Builder
public class AnalyticsResponse {

    private Stats stats;
    private Map<String, Integer> modelUsage;
    private List<TimelineEntry> timeline;
    private List<RecentGeneration> recentGenerations;
    private List<ProjectSummary> projects;

    @Data
    @AllArgsConstructor
    @Builder
    public static class Stats {
        private int totalProjects;
        private int totalGenerations;
        private int creditsRemaining;
        private int creditsTotal;
        private int creditsUsed;
        private PlanType plan;
    }

    @Data
    @AllArgsConstructor
    @Builder
    public static class TimelineEntry {
        private String date;
        private int projects;
        private int generations;
    }

    @Data
    @AllArgsConstructor
    @Builder
    public static class RecentGeneration {
        private String projectId;
        private String projectName;
        private int versionNumber;
        private String type;
        private String prompt;
        private String model;
        private Instant createdAt;
        private int fileCount;
    }

    @Data
    @AllArgsConstructor
    @Builder
    public static class ProjectSummary {
        private String id;
        private String name;
        private String model;
        private int versionCount;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
