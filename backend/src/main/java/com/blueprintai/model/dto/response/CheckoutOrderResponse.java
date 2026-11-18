package com.blueprintai.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutOrderResponse {
    private String keyId;
    private String orderId;
    private int amount;
    private String currency;
    private String productName;
    private String productType;
}
