package com.blueprintai.model.entity;

import com.blueprintai.model.enums.VersionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "project_versions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "version_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Column(length = 50)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private VersionType type;

    @Column(name = "changed_files", columnDefinition = "JSON")
    private String changedFiles;

    @Column(name = "file_count", nullable = false)
    @Builder.Default
    private int fileCount = 0;

    @Column(name = "restored_from")
    private Integer restoredFrom;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
