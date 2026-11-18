package com.blueprintai.model.dto.request;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VerifyCheckoutRequestTest {

    @Test
    void acceptsRazorpayCheckoutSnakeCaseResponse() throws Exception {
        String payload = """
                {
                  "razorpay_order_id": "order_test_123",
                  "razorpay_payment_id": "pay_test_456",
                  "razorpay_signature": "signature"
                }
                """;

        VerifyCheckoutRequest request = new ObjectMapper().readValue(payload, VerifyCheckoutRequest.class);

        assertEquals("order_test_123", request.getRazorpayOrderId());
        assertEquals("pay_test_456", request.getRazorpayPaymentId());
        assertEquals("signature", request.getRazorpaySignature());
    }
}
