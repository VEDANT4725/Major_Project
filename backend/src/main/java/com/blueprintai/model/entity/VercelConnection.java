package com.blueprintai.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "vercel_connections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VercelConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "vercel_user_id", length = 100)
    private String vercelUserId;

    @Column(name = "vercel_username", length = 100)
    private String vercelUsername;

    @Column(length = 255)
    private String email;

    @Column(length = 100)
    private String name;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "access_token", length = 1000, nullable = false)
    private String accessToken;

    @Column(name = "team_id", length = 100)
    private String teamId;

    @Column(name = "installation_id", length = 100)
    private String installationId;

    @Column(name = "auth_type", length = 20)
    private String authType; // "OAUTH" or "TOKEN"

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
