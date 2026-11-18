package com.blueprintai.service;

import com.blueprintai.model.dto.response.CheckoutOrderResponse;
import com.blueprintai.model.dto.response.CheckoutReconcileResponse;
import com.blueprintai.model.dto.response.CreditsResponse;
import com.blueprintai.model.dto.response.CreditTransactionResponse;
import com.blueprintai.model.dto.response.DemoBillingResponse;
import com.blueprintai.model.entity.BillingOrder;
import com.blueprintai.model.entity.CreditTransaction;
import com.blueprintai.model.entity.User;
import com.blueprintai.model.entity.UserCredits;
import com.blueprintai.model.enums.PlanType;
import com.blueprintai.repository.BillingOrderRepository;
import com.blueprintai.repository.CreditTransactionRepository;
import com.blueprintai.repository.UserCreditsRepository;
import com.blueprintai.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreditsService {

    private final UserCreditsRepository creditsRepository;
    private final CreditTransactionRepository transactionRepository;
    private final BillingOrderRepository billingOrderRepository;
    private final RazorpayGateway razorpayGateway;
    private final SecurityUtils securityUtils;

    @Value("${blueprintai.billing.demo-enabled:false}")
    private boolean demoBillingEnabled;

    @Value("${blueprintai.billing.pro-price-paise:49900}")
    private int proPricePaise;

    private static final int DEFAULT_FREE_CREDITS = 100;
    private static final int UNLIMITED = -1;
    private static final int GRACE_PERIOD_THRESHOLD = 5;
    private static final int MIN_CREDITS_FOR_EDIT = 3;

    @Transactional
    public CreditsResponse getCredits() {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        checkAndResetPeriod(credits);
        return toResponse(credits);
    }

    @Transactional(readOnly = true)
    public List<CreditTransactionResponse> getTransactions() {
        Long userId = securityUtils.getCurrentUserId();
        return transactionRepository.findTop25ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(transaction -> CreditTransactionResponse.builder()
                        .id(transaction.getId())
                        .type(transaction.getType())
                        .description(transaction.getDescription())
                        .creditChange(transaction.getCreditChange())
                        .balanceAfter(transaction.getBalanceAfter())
                        .amountPaidPaise(transaction.getAmountPaidPaise())
                        .reference(transaction.getReference())
                        .createdAt(transaction.getCreatedAt())
                        .build())
                .toList();
    }

    public DemoBillingResponse getDemoBilling() {
        return DemoBillingResponse.builder()
                .enabled(demoBillingEnabled)
                .razorpayEnabled(razorpayGateway.isConfigured())
                .razorpayKeyId(razorpayGateway.isConfigured() ? razorpayGateway.getKeyId() : null)
                .currency("INR")
                .proPricePaise(proPricePaise)
                .packs(List.of(
                        DemoBillingResponse.Pack.builder()
                                .id("starter")
                                .name("Starter")
                                .credits(100)
                                .amountPaise(4900)
                                .featured(false)
                                .build(),
                        DemoBillingResponse.Pack.builder()
                                .id("builder")
                                .name("Builder")
                                .credits(250)
                                .amountPaise(9900)
                                .featured(true)
                                .build(),
                        DemoBillingResponse.Pack.builder()
                                .id("studio")
                                .name("Studio")
                                .credits(600)
                                .amountPaise(19900)
                                .featured(false)
                                .build()))
                .build();
    }

    @Transactional
    public CheckoutOrderResponse createCheckout(String productType, String packId) {
        if (!razorpayGateway.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay test keys are not configured.");
        }

        String normalizedType = productType == null ? "" : productType.trim().toUpperCase();
        String productId;
        String productName;
        int creditAmount;
        int amountPaise;
        if ("CREDIT_PACK".equals(normalizedType)) {
            DemoBillingResponse.Pack pack = getDemoBilling().getPacks().stream()
                    .filter(candidate -> candidate.getId().equals(packId))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid credit pack."));
            productId = pack.getId();
            productName = pack.getName() + " credit pack";
            creditAmount = pack.getCredits();
            amountPaise = pack.getAmountPaise();
        } else if ("PRO_MONTHLY".equals(normalizedType)) {
            productId = "pro-monthly";
            productName = "Pro plan (30 days)";
            creditAmount = 0;
            amountPaise = proPricePaise;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported billing product.");
        }

        Long userId = securityUtils.getCurrentUserId();
        String localReceipt = "wc_" + UUID.randomUUID().toString().replace("-", "");
        JsonNode gatewayOrder = razorpayGateway.createOrder(
                amountPaise,
                localReceipt,
                Map.of("user_id", userId.toString(), "product_id", productId, "product_type", normalizedType));
        String orderId = gatewayOrder == null ? null : gatewayOrder.path("id").asText(null);
        if (orderId == null || orderId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay did not return an order ID.");
        }

        billingOrderRepository.save(BillingOrder.builder()
                .user(securityUtils.getCurrentUser())
                .razorpayOrderId(orderId)
                .purchaseType(normalizedType)
                .productId(productId)
                .productName(productName)
                .creditAmount(creditAmount)
                .amountPaise(amountPaise)
                .build());

        return CheckoutOrderResponse.builder()
                .keyId(razorpayGateway.getKeyId())
                .orderId(orderId)
                .amount(amountPaise)
                .currency("INR")
                .productName(productName)
                .productType(normalizedType)
                .build();
    }

    @Transactional
    public CreditsResponse verifyCheckout(
            String orderId,
            String paymentId,
            String signature) {
        Long userId = securityUtils.getCurrentUserId();
        BillingOrder order = billingOrderRepository.findByRazorpayOrderIdForUpdate(orderId)
                .filter(candidate -> candidate.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Billing order not found."));
        if (!PaymentSignatures.matches(orderId + "|" + paymentId, signature, getRazorpayKeySecret())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment signature verification failed.");
        }

        JsonNode payment = razorpayGateway.getPayment(paymentId);
        if (payment == null
                || !orderId.equals(payment.path("order_id").asText())
                || payment.path("amount").asInt(-1) != order.getAmountPaise()
                || !"INR".equals(payment.path("currency").asText())
                || !payment.path("captured").asBoolean()
                || !"captured".equals(payment.path("status").asText())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Razorpay has not confirmed this payment as captured.");
        }
        return fulfillCapturedOrder(orderId, paymentId);
    }

    @Transactional
    public CheckoutReconcileResponse reconcilePendingCheckout() {
        if (!razorpayGateway.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay is not configured.");
        }
        Long userId = securityUtils.getCurrentUserId();
        List<BillingOrder> pendingOrders =
                billingOrderRepository.findTop10ByUserIdAndStatusOrderByCreatedAtDesc(userId, "CREATED");
        for (BillingOrder order : pendingOrders) {
            JsonNode paymentList = razorpayGateway.getOrderPayments(order.getRazorpayOrderId());
            JsonNode items = paymentList == null ? null : paymentList.path("items");
            if (items == null || !items.isArray()) continue;
            for (JsonNode payment : items) {
                if (!"captured".equals(payment.path("status").asText())
                        || !payment.path("captured").asBoolean()
                        || payment.path("amount").asInt(-1) != order.getAmountPaise()
                        || !"INR".equals(payment.path("currency").asText())) {
                    continue;
                }
                String paymentId = payment.path("id").asText();
                if (paymentId.isBlank()
                        || !order.getRazorpayOrderId().equals(payment.path("order_id").asText())) {
                    continue;
                }
                CreditsResponse credits = fulfillCapturedOrder(order.getRazorpayOrderId(), paymentId);
                return CheckoutReconcileResponse.builder().recovered(true).credits(credits).build();
            }
        }
        return CheckoutReconcileResponse.builder()
                .recovered(false)
                .credits(getCredits())
                .build();
    }

    @Transactional
    public void processCapturedWebhook(String orderId, String paymentId, int amountPaise, String currency) {
        BillingOrder order = billingOrderRepository.findByRazorpayOrderIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Billing order not found."));
        if (amountPaise != order.getAmountPaise() || !"INR".equals(currency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webhook payment amount does not match the order.");
        }
        fulfillCapturedOrder(orderId, paymentId);
    }

    @Transactional
    public void processFailedWebhook(String orderId) {
        billingOrderRepository.findByRazorpayOrderId(orderId).ifPresent(order -> {
            if (!"PAID".equals(order.getStatus())) {
                order.setStatus("FAILED");
                billingOrderRepository.save(order);
            }
        });
    }

    @Transactional
    public CreditsResponse purchaseDemoPack(String packId) {
        if (!demoBillingEnabled) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Demo billing is not enabled");
        }

        DemoBillingResponse.Pack pack = getDemoBilling().getPacks().stream()
                .filter(candidate -> candidate.getId().equals(packId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid demo credit pack"));

        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        if (credits.getPlan() == PlanType.PRO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pro accounts do not need credit packs");
        }

        credits.setPaidCredits(credits.getPaidCredits() + pack.getCredits());
        creditsRepository.save(credits);
        recordTransaction(
                credits,
                "DEMO_PURCHASE",
                pack.getName() + " demo credit pack",
                pack.getCredits(),
                pack.getAmountPaise(),
                compactRef("DEMO"));
        return toResponse(credits);
    }

    @Transactional
    public CreditsResponse checkAndDeductCredits(int creditCost) {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        checkAndResetPeriod(credits);

        if (credits.getPlan() == PlanType.PRO) {
            return toResponse(credits);
        }

        if (getAvailableCredits(credits) < creditCost) {
            throw new com.blueprintai.exception.CreditExhaustedException(
                    "Not enough credits remaining");
        }

        consumeCredits(credits, creditCost);
        creditsRepository.save(credits);
        recordTransaction(credits, "USAGE", "AI generation", -creditCost, 0, compactRef("USAGE"));
        return toResponse(credits);
    }

    @Transactional
    public void checkCredits(int creditCost) {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        checkAndResetPeriod(credits);

        if (credits.getPlan() == PlanType.PRO) {
            return;
        }

        if (getAvailableCredits(credits) < creditCost) {
            throw new com.blueprintai.exception.CreditExhaustedException(
                    "Not enough credits remaining");
        }
    }

    @Transactional
    public void deductCredits(int creditCost) {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        if (credits.getPlan() == PlanType.PRO) return;
        if (getAvailableCredits(credits) < creditCost) {
            throw new com.blueprintai.exception.CreditExhaustedException(
                    "Not enough credits remaining");
        }
        consumeCredits(credits, creditCost);
        creditsRepository.save(credits);
        recordTransaction(credits, "USAGE", "AI generation", -creditCost, 0, compactRef("USAGE"));
    }

    @Transactional
    public CreditsResponse deductCreditsForEdit(int creditCost) {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        checkAndResetPeriod(credits);

        if (credits.getPlan() == PlanType.PRO) {
            return toResponse(credits);
        }

        // Grace period: if user has <= 5 credits, allow edits without deduction
        int availableCredits = getAvailableCredits(credits);
        if (availableCredits <= GRACE_PERIOD_THRESHOLD && availableCredits > 0) {
            return toResponse(credits);
        }

        // Normal deduction for edits
        if (availableCredits < creditCost) {
            throw new com.blueprintai.exception.CreditExhaustedException(
                    "Not enough credits remaining for editing. Please upgrade your plan.");
        }

        consumeCredits(credits, creditCost);
        creditsRepository.save(credits);
        recordTransaction(credits, "USAGE", "AI edit", -creditCost, 0, compactRef("USAGE"));
        return toResponse(credits);
    }

    @Transactional
    public boolean canEditWithCurrentCredits() {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        checkAndResetPeriod(credits);

        if (credits.getPlan() == PlanType.PRO) {
            return true;
        }

        // Allow editing if credits > MIN_CREDITS_FOR_EDIT
        return getAvailableCredits(credits) > MIN_CREDITS_FOR_EDIT;
    }

    @Transactional
    public CreditsResponse downgradePlan() {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        credits.setPlan(PlanType.FREE);
        credits.setRemaining(DEFAULT_FREE_CREDITS);
        credits.setTotal(DEFAULT_FREE_CREDITS);
        credits.setPeriodStart(Instant.now());
        credits.setPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));
        creditsRepository.save(credits);
        return toResponse(credits);
    }

    private UserCredits getOrCreateCredits(Long userId) {
        return getOrCreateCredits(userId, securityUtils.getCurrentUser());
    }

    private UserCredits getOrCreateCredits(Long userId, User user) {
        return creditsRepository.findByUserId(userId).map(credits -> {
            if (credits.getPlan() == PlanType.FREE
                    && !credits.isFreeAllowanceDisabled()
                    && credits.getTotal() > 0
                    && credits.getTotal() < DEFAULT_FREE_CREDITS) {
                int creditAdjustment = DEFAULT_FREE_CREDITS - credits.getTotal();
                credits.setRemaining(credits.getRemaining() + creditAdjustment);
                credits.setTotal(DEFAULT_FREE_CREDITS);
                UserCredits savedCredits = creditsRepository.save(credits);
                recordTransaction(savedCredits, "GRANT", "Free allowance adjustment", creditAdjustment, 0,
                        compactRef("GRANT"));
                return savedCredits;
            }
            return credits;
        }).orElseGet(() -> {
            Instant now = Instant.now();
            UserCredits credits = UserCredits.builder()
                    .user(user)
                    .remaining(DEFAULT_FREE_CREDITS)
                    .total(DEFAULT_FREE_CREDITS)
                    .plan(PlanType.FREE)
                    .periodStart(now)
                    .periodEnd(now.plus(30, ChronoUnit.DAYS))
                    .build();
            UserCredits savedCredits = creditsRepository.save(credits);
            recordTransaction(savedCredits, "GRANT", "Monthly free allowance", DEFAULT_FREE_CREDITS, 0,
                    compactRef("GRANT"));
            return savedCredits;
        });
    }

    private void checkAndResetPeriod(UserCredits credits) {
        if (Instant.now().isAfter(credits.getPeriodEnd())) {
            if (credits.getPlan() == PlanType.PRO) {
                credits.setPlan(PlanType.FREE);
                if (!credits.isFreeAllowanceDisabled()) {
                    credits.setRemaining(DEFAULT_FREE_CREDITS);
                    credits.setTotal(DEFAULT_FREE_CREDITS);
                } else {
                    credits.setRemaining(0);
                    credits.setTotal(0);
                }
                credits.setPeriodStart(Instant.now());
                credits.setPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));
                UserCredits downgraded = creditsRepository.save(credits);
                recordTransaction(downgraded, "PLAN_EXPIRED", "Pro plan expired", 0, 0,
                        compactRef("EXP"));
                return;
            }
            int previousBalance = getAvailableCredits(credits);
            if (credits.getPlan() == PlanType.FREE
                    && !credits.isFreeAllowanceDisabled()
                    && credits.getTotal() > 0) {
                credits.setRemaining(DEFAULT_FREE_CREDITS);
                credits.setTotal(DEFAULT_FREE_CREDITS);
            }
            credits.setPeriodStart(Instant.now());
            credits.setPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));
            UserCredits savedCredits = creditsRepository.save(credits);
            int balanceChange = getAvailableCredits(savedCredits) - previousBalance;
            if (balanceChange != 0) {
                recordTransaction(savedCredits, "GRANT", "Monthly free credits renewed", balanceChange, 0,
                        compactRef("GRANT"));
            }
        }
    }

    private CreditsResponse toResponse(UserCredits credits) {
        boolean isUnlimited = credits.getRemaining() == UNLIMITED;
        return CreditsResponse.builder()
                .remaining(isUnlimited ? -1 : getAvailableCredits(credits))
                .total(isUnlimited ? -1 : credits.getTotal() + credits.getPaidCredits())
                .plan(credits.getPlan())
                .periodStart(credits.getPeriodStart())
                .periodEnd(credits.getPeriodEnd())
                .isUnlimited(isUnlimited)
                .build();
    }

    private int getAvailableCredits(UserCredits credits) {
        if (credits.getPlan() == PlanType.PRO) {
            return UNLIMITED;
        }
        return credits.getRemaining() + credits.getPaidCredits();
    }

    private void consumeCredits(UserCredits credits, int amount) {
        int freeCreditsUsed = Math.min(credits.getRemaining(), amount);
        credits.setRemaining(credits.getRemaining() - freeCreditsUsed);
        credits.setPaidCredits(credits.getPaidCredits() - (amount - freeCreditsUsed));
    }

    private String compactRef(String prefix) {
        String compactUuid = UUID.randomUUID().toString().replace("-", "");
        return prefix + "-" + compactUuid;
    }

    private void recordTransaction(
            UserCredits credits,
            String type,
            String description,
            int creditChange,
            int amountPaidPaise,
            String reference) {
        String safeRef = reference == null ? compactRef("TXN") : reference;
        if (safeRef.length() > 40) {
            safeRef = safeRef.substring(0, 40);
        }
        transactionRepository.save(CreditTransaction.builder()
                .user(credits.getUser())
                .type(type)
                .description(description)
                .creditChange(creditChange)
                .balanceAfter(getAvailableCredits(credits))
                .amountPaidPaise(amountPaidPaise)
                .reference(safeRef)
                .build());
    }

    private CreditsResponse fulfillCapturedOrder(String orderId, String paymentId) {
        BillingOrder order = billingOrderRepository.findByRazorpayOrderIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Billing order not found."));
        if ("PAID".equals(order.getStatus())) {
            if (!paymentId.equals(order.getRazorpayPaymentId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This order is already associated with another payment.");
            }
            return getCreditsForUser(order.getUser().getId(), order.getUser());
        }
        if (order.getRazorpayPaymentId() != null && !paymentId.equals(order.getRazorpayPaymentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another payment is already associated with this order.");
        }

        UserCredits credits = creditsRepository.findByUserId(order.getUser().getId())
                .orElseGet(() -> getOrCreateCredits(order.getUser().getId(), order.getUser()));
        Instant now = Instant.now();
        int creditChange = 0;
        if ("CREDIT_PACK".equals(order.getPurchaseType())) {
            credits.setPaidCredits(credits.getPaidCredits() + order.getCreditAmount());
            creditChange = order.getCreditAmount();
        } else if ("PRO_MONTHLY".equals(order.getPurchaseType())) {
            Instant renewalBase = credits.getPlan() == PlanType.PRO && credits.getPeriodEnd().isAfter(now)
                    ? credits.getPeriodEnd()
                    : now;
            if (credits.getPlan() == PlanType.FREE && credits.getTotal() == 0) {
                credits.setFreeAllowanceDisabled(true);
            }
            credits.setPlan(PlanType.PRO);
            credits.setRemaining(UNLIMITED);
            credits.setTotal(UNLIMITED);
            credits.setPeriodStart(now);
            credits.setPeriodEnd(renewalBase.plus(30, ChronoUnit.DAYS));
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported billing order type.");
        }
        creditsRepository.save(credits);

        order.setRazorpayPaymentId(paymentId);
        order.setStatus("PAID");
        order.setPaidAt(now);
        billingOrderRepository.save(order);
        recordTransaction(
                credits,
                "PURCHASE",
                order.getProductName(),
                creditChange,
                order.getAmountPaise(),
                paymentId);
        return toResponse(credits);
    }

    private CreditsResponse getCreditsForUser(Long userId, User user) {
        UserCredits credits = creditsRepository.findByUserId(userId)
                .orElseGet(() -> getOrCreateCredits(userId, user));
        checkAndResetPeriod(credits);
        return toResponse(credits);
    }

    private String getRazorpayKeySecret() {
        return razorpayGateway.getKeySecretForVerification();
    }
}
