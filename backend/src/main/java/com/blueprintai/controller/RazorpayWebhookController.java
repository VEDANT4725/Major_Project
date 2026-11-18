package com.blueprintai.controller;

import com.blueprintai.service.CreditsService;
import com.blueprintai.service.RazorpayGateway;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class RazorpayWebhookController {

    private final RazorpayGateway razorpayGateway;
    private final CreditsService creditsService;
    private final ObjectMapper objectMapper;

    @PostMapping("/webhook")
    public ResponseEntity<Void> receiveWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        if (!razorpayGateway.isWebhookConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay webhook is not configured.");
        }
        if (!razorpayGateway.isValidWebhook(rawBody, signature)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Razorpay webhook signature.");
        }

        JsonNode event;
        try {
            event = objectMapper.readTree(rawBody);
        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Razorpay webhook payload.", exception);
        }

        String eventName = event.path("event").asText();
        JsonNode payment = event.path("payload").path("payment").path("entity");
        String orderId = payment.path("order_id").asText();
        String paymentId = payment.path("id").asText();
        if ("payment.captured".equals(eventName)) {
            if (orderId.isBlank() || paymentId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webhook is missing payment identifiers.");
            }
            creditsService.processCapturedWebhook(
                    orderId,
                    paymentId,
                    payment.path("amount").asInt(-1),
                    payment.path("currency").asText());
        } else if ("payment.failed".equals(eventName) && !orderId.isBlank()) {
            creditsService.processFailedWebhook(orderId);
        }

        return ResponseEntity.ok().build();
    }
}
