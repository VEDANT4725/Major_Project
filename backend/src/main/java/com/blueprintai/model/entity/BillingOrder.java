package com.blueprintai.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "billing_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "razorpay_order_id", nullable = false, unique = true, length = 80)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", unique = true, length = 80)
    private String razorpayPaymentId;

    @Column(name = "purchase_type", nullable = false, length = 24)
    private String purchaseType;

    @Column(name = "product_id", nullable = false, length = 40)
    private String productId;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(name = "credit_amount", nullable = false)
    private int creditAmount;

    @Column(name = "amount_paise", nullable = false)
    private int amountPaise;

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String status = "CREATED";

    @Column(name = "paid_at")
    private Instant paidAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
