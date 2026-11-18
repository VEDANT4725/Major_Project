package com.blueprintai.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class RazorpayGateway {

    private static final String API_BASE_URL = "https://api.razorpay.com/v1";
    @Value("${blueprintai.billing.razorpay.key-id:}")
    private String keyId;

    @Value("${blueprintai.billing.razorpay.key-secret:}")
    private String keySecret;

    public boolean isConfigured() {
        return keyId != null && !keyId.isBlank()
                && keySecret != null && !keySecret.isBlank()
                && (!keyId.startsWith("rzp_live_") || livePaymentsEnabled);
    }

    public String getKeyId() {
        requireConfiguration();
        return keyId;
    }

    public String getKeySecretForVerification() {
        requireConfiguration();
        return keySecret;
    }

    public JsonNode createOrder(int amountPaise, String receipt, Map<String, String> notes) {
        requireConfiguration();
        try {
            return authenticatedClient()
                    .post()
                    .uri("/orders")
                    .body(Map.of(
                            "amount", amountPaise,
                            "currency", "INR",
                            "receipt", receipt,
                            "notes", notes))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw gatewayError(exception);
        }
    }

    public JsonNode getPayment(String paymentId) {
        requireConfiguration();
        try {
            return authenticatedClient()
                    .get()
                    .uri("/payments/{paymentId}", paymentId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw gatewayError(exception);
        }
    }

    public JsonNode getOrderPayments(String orderId) {
        requireConfiguration();
        try {
            return authenticatedClient()
                    .get()
                    .uri("/orders/{orderId}/payments", orderId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw gatewayError(exception);
        }
    }

    public boolean isWebhookConfigured() {
        return isConfigured() && webhookSecret != null && !webhookSecret.isBlank();
    }

    @Value("${blueprintai.billing.razorpay.webhook-secret:}")
    private String webhookSecret;

    @Value("${blueprintai.billing.razorpay.live-enabled:false}")
    private boolean livePaymentsEnabled;

    public boolean isValidWebhook(String rawBody, String signature) {
        return PaymentSignatures.matches(rawBody, signature, webhookSecret);
    }

    private RestClient authenticatedClient() {
        return RestClient.builder()
                .baseUrl(API_BASE_URL)
                .defaultHeaders(headers -> headers.setBasicAuth(keyId, keySecret))
                .build();
    }

    private void requireConfiguration() {
        if (keyId != null && keyId.startsWith("rzp_live_") && !livePaymentsEnabled) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Live Razorpay payments are disabled. Keep test keys until live billing is explicitly enabled.");
        }
        if (!isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Razorpay checkout is not configured. Add Razorpay test keys to backend/.env.");
        }
    }

    private ResponseStatusException gatewayError(RestClientResponseException exception) {
        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Razorpay request failed with status " + exception.getStatusCode().value());
    }
}
