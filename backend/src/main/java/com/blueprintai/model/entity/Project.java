package com.blueprintai.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @Column(length = 12)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String model = "groq-llama-3.3-70b";

    @Column(name = "current_version", nullable = false)
    @Builder.Default
    private int currentVersion = 0;

    @Column(name = "vercel_project_name", length = 100)
    private String vercelProjectName;

    @Column(name = "vercel_deployment_id", length = 100)
    private String vercelDeploymentId;

    @Column(name = "vercel_deployment_url", length = 500)
    private String vercelDeploymentUrl;

    @Column(name = "vercel_last_deployed_at")
    private Instant vercelLastDeployedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
