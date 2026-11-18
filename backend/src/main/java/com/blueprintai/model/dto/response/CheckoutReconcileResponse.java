package com.blueprintai.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutReconcileResponse {
    private boolean recovered;
    private CreditsResponse credits;
}
