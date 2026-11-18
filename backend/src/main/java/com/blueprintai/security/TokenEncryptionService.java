package com.blueprintai.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class TokenEncryptionService {

    private static final String PREFIX = "enc:v1:";
    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;

    @Value("${blueprintai.security.token-encryption-key:}")
    private String configuredKey;

    @Value("${blueprintai.jwt.secret:your-256-bit-secret-key-change-in-production-minimum-32-bytes}")
    private String jwtSecretFallback;

    private final SecureRandom secureRandom = new SecureRandom();
    private SecretKeySpec aesKeySpec;
    private SecretKeySpec hmacKeySpec;

    @PostConstruct
    public void init() {
        try {
            String masterSecret = (configuredKey != null && !configuredKey.isBlank())
                    ? configuredKey
                    : jwtSecretFallback;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] aesKey = digest.digest(("aes:" + masterSecret).getBytes(StandardCharsets.UTF_8));
            byte[] hmacKey = digest.digest(("hmac:" + masterSecret).getBytes(StandardCharsets.UTF_8));
            this.aesKeySpec = new SecretKeySpec(aesKey, "AES");
            this.hmacKeySpec = new SecretKeySpec(hmacKey, "HmacSHA256");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize token encryption keys", e);
        }
    }

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        if (plaintext.startsWith(PREFIX)) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKeySpec, new GCMParameterSpec(TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return PREFIX + Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt token", e);
        }
    }

    public String decrypt(String storedValue) {
        if (storedValue == null || storedValue.isEmpty()) {
            return storedValue;
        }
        if (!storedValue.startsWith(PREFIX)) {
            // Backward compatibility for any legacy plaintext tokens
            return storedValue;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(storedValue.substring(PREFIX.length()));
            ByteBuffer buffer = ByteBuffer.wrap(combined);
            byte[] iv = new byte[IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKeySpec, new GCMParameterSpec(TAG_BITS, iv));
            byte[] plainBytes = cipher.doFinal(ciphertext);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt stored token. Please reconnect your account.", e);
        }
    }

    public String signState(String payload) {
        try {
            String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(hmacKeySpec);
            byte[] sig = mac.doFinal(encodedPayload.getBytes(StandardCharsets.UTF_8));
            String encodedSig = Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
            return encodedPayload + "." + encodedSig;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign OAuth state", e);
        }
    }

    public String verifyAndDecodeState(String signedState) {
        if (signedState == null || !signedState.contains(".")) {
            throw new IllegalArgumentException("Invalid OAuth state parameter");
        }
        String[] parts = signedState.split("\\.", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Malformed OAuth state parameter");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(hmacKeySpec);
            byte[] expectedSig = mac.doFinal(parts[0].getBytes(StandardCharsets.UTF_8));
            byte[] actualSig = Base64.getUrlDecoder().decode(parts[1]);
            if (!MessageDigest.isEqual(expectedSig, actualSig)) {
                throw new IllegalArgumentException("OAuth state signature verification failed");
            }
            return new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid OAuth state parameter");
        }
    }
}

