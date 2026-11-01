package com.blueprintai.model.dto.response;

import com.blueprintai.model.enums.PlanType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
@Builder
public class CreditsResponse {
    private int remaining;
    private int total;
    private PlanType plan;
    private Instant periodStart;
    private Instant periodEnd;
    private boolean isUnlimited;
}
