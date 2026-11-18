package com.blueprintai.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "credit_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "transaction_type", nullable = false, length = 24)
    private String type;

    @Column(nullable = false, length = 180)
    private String description;

    @Column(name = "credit_change", nullable = false)
    private int creditChange;

    @Column(name = "balance_after", nullable = false)
    private int balanceAfter;

    @Column(name = "amount_paid_paise", nullable = false)
    @Builder.Default
    private int amountPaidPaise = 0;

    @Column(name = "reference_id", nullable = false, length = 100)
    private String reference;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
