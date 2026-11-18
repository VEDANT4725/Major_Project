package com.blueprintai.service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

public final class PaymentSignatures {

    private PaymentSignatures() {
    }

    public static boolean matches(String payload, String signature, String secret) {
        if (payload == null || signature == null || secret == null || secret.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)))
                    .getBytes(StandardCharsets.UTF_8);
            return MessageDigest.isEqual(expected, signature.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to verify Razorpay signature", exception);
        }
    }
}
