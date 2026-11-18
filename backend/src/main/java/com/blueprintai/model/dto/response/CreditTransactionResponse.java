package com.blueprintai.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class CreditTransactionResponse {
    private Long id;
    private String type;
    private String description;
    private int creditChange;
    private int balanceAfter;
    private int amountPaidPaise;
    private String reference;
    private Instant createdAt;
}
