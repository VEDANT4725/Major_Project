package com.blueprintai.repository;

import com.blueprintai.model.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findByUserIdOrderByUpdatedAtDesc(Long userId);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
}
