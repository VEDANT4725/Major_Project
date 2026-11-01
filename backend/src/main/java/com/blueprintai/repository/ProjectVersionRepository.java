package com.blueprintai.repository;

import com.blueprintai.model.entity.ProjectVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectVersionRepository extends JpaRepository<ProjectVersion, Long> {
    List<ProjectVersion> findByProjectIdOrderByVersionNumberAsc(String projectId);
    Optional<ProjectVersion> findByProjectIdAndVersionNumber(String projectId, int versionNumber);
    long countByProjectId(String projectId);
    void deleteByProjectId(String projectId);
}
