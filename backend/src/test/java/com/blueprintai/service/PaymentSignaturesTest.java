package com.blueprintai.service;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PaymentSignaturesTest {

    @Test
    void acceptsMatchingRazorpaySignatureAndRejectsTamperedPayload() throws Exception {
        String payload = "order_test_123|pay_test_456";
        String secret = "local-test-secret";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));

        assertTrue(PaymentSignatures.matches(payload, signature, secret));
        assertFalse(PaymentSignatures.matches(payload + "-tampered", signature, secret));
        assertFalse(PaymentSignatures.matches(payload, signature, ""));
    }
}
