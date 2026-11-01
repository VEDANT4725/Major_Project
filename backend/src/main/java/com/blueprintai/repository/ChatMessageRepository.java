package com.blueprintai.repository;

import com.blueprintai.model.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByProjectIdOrderByCreatedAtAsc(String projectId);
    List<ChatMessage> findTop10ByProjectIdOrderByCreatedAtDesc(String projectId);
    void deleteByProjectId(String projectId);
}
