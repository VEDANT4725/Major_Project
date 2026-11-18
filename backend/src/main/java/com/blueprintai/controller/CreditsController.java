package com.blueprintai.controller;

import com.blueprintai.model.dto.request.CreateCheckoutRequest;
import com.blueprintai.model.dto.request.DemoPurchaseRequest;
import com.blueprintai.model.dto.request.VerifyCheckoutRequest;
import com.blueprintai.model.dto.response.CheckoutOrderResponse;
import com.blueprintai.model.dto.response.CheckoutReconcileResponse;
import com.blueprintai.model.dto.response.CreditTransactionResponse;
import com.blueprintai.model.dto.response.CreditsResponse;
import com.blueprintai.model.dto.response.DemoBillingResponse;
import com.blueprintai.service.CreditsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/credits")
@RequiredArgsConstructor
public class CreditsController {

    private final CreditsService creditsService;

    @GetMapping
    public ResponseEntity<CreditsResponse> getCredits() {
        return ResponseEntity.ok(creditsService.getCredits());
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<CreditTransactionResponse>> getTransactions() {
        return ResponseEntity.ok(creditsService.getTransactions());
    }

    @GetMapping("/demo-config")
    public ResponseEntity<DemoBillingResponse> getDemoBillingConfig() {
        return ResponseEntity.ok(creditsService.getDemoBilling());
    }

    @PostMapping("/checkout/order")
    public ResponseEntity<CheckoutOrderResponse> createCheckoutOrder(
            @Valid @RequestBody CreateCheckoutRequest request) {
        return ResponseEntity.ok(creditsService.createCheckout(request.getProductType(), request.getPackId()));
    }

    @PostMapping("/checkout/verify")
    public ResponseEntity<CreditsResponse> verifyCheckout(@Valid @RequestBody VerifyCheckoutRequest request) {
        return ResponseEntity.ok(creditsService.verifyCheckout(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()));
    }

    @PostMapping("/checkout/reconcile")
    public ResponseEntity<CheckoutReconcileResponse> reconcileCheckout() {
        return ResponseEntity.ok(creditsService.reconcilePendingCheckout());
    }

    @PostMapping("/demo-purchase")
    public ResponseEntity<CreditsResponse> purchaseDemoPack(@Valid @RequestBody DemoPurchaseRequest request) {
        return ResponseEntity.ok(creditsService.purchaseDemoPack(request.getPackId()));
    }

    @GetMapping("/can-edit")
    public ResponseEntity<Map<String, Boolean>> canEdit() {
        boolean canEdit = creditsService.canEditWithCurrentCredits();
        return ResponseEntity.ok(Map.of("canEdit", canEdit));
    }

}
