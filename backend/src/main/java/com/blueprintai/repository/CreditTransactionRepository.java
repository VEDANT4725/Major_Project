package com.blueprintai.repository;

import com.blueprintai.model.entity.CreditTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, Long> {
    List<CreditTransaction> findTop25ByUserIdOrderByCreatedAtDesc(Long userId);
}
