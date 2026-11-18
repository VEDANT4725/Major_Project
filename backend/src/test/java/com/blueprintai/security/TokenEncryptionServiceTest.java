package com.blueprintai.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class TokenEncryptionServiceTest {

    private TokenEncryptionService service;

    @BeforeEach
    void setUp() {
        service = new TokenEncryptionService();
        ReflectionTestUtils.setField(service, "configuredKey", "test-master-encryption-key-for-unit-tests-32bytes");
        ReflectionTestUtils.setField(service, "jwtSecretFallback", "fallback-secret");
        service.init();
    }

    @Test
    void encryptAndDecryptRoundTrip() {
        String raw = "vcp_live_sample_vercel_oauth_token_123456";
        String encrypted = service.encrypt(raw);

        assertNotEquals(raw, encrypted);
        assertTrue(encrypted.startsWith("enc:v1:"));
        assertEquals(raw, service.decrypt(encrypted));
        // Double encrypting should be idempotent
        assertEquals(encrypted, service.encrypt(encrypted));
    }

    @Test
    void decryptSupportsLegacyPlaintextTokens() {
        String legacyPlain = "legacy_plaintext_token";
        assertEquals(legacyPlain, service.decrypt(legacyPlain));
    }

    @Test
    void signAndVerifyOAuthStateRejectsTampering() {
        String payload = "{\"uid\":42,\"pid\":\"proj123\",\"ts\":1700000000000}";
        String signed = service.signState(payload);

        assertEquals(payload, service.verifyAndDecodeState(signed));
        assertThrows(IllegalArgumentException.class, () -> service.verifyAndDecodeState(signed + "tamper"));
        assertThrows(IllegalArgumentException.class, () -> service.verifyAndDecodeState("invalid-state"));
    }
}

