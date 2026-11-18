package com.blueprintai.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class VerifyCheckoutRequest {
    @NotBlank
    @JsonAlias("razorpay_order_id")
    private String razorpayOrderId;

    @NotBlank
    @JsonAlias("razorpay_payment_id")
    private String razorpayPaymentId;

    @NotBlank
    @JsonAlias("razorpay_signature")
    private String razorpaySignature;
}
