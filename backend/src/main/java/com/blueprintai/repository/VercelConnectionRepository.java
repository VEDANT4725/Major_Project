package com.blueprintai.repository;

import com.blueprintai.model.entity.VercelConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VercelConnectionRepository extends JpaRepository<VercelConnection, Long> {
    Optional<VercelConnection> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}

