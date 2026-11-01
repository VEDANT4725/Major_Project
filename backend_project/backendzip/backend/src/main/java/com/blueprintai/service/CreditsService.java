package com.blueprintai.service;

import com.blueprintai.model.dto.response.CreditsResponse;
import com.blueprintai.model.entity.UserCredits;
import com.blueprintai.model.enums.PlanType;
import com.blueprintai.repository.UserCreditsRepository;
import com.blueprintai.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CreditsService {

    private final UserCreditsRepository creditsRepository;
    private final SecurityUtils securityUtils;

    private static final int DEFAULT_FREE_CREDITS = 50;
    private static final int UNLIMITED = -1;

    public CreditsResponse getCredits() {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
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

        if (credits.getRemaining() < creditCost) {
            throw new com.blueprintai.exception.CreditExhaustedException(
                    "Not enough credits remaining");
        }

        credits.setRemaining(credits.getRemaining() - creditCost);
        creditsRepository.save(credits);
        return toResponse(credits);
    }

    public void checkCredits(int creditCost) {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        checkAndResetPeriod(credits);

        if (credits.getPlan() == PlanType.PRO) {
            return;
        }

        if (credits.getRemaining() < creditCost) {
            throw new com.blueprintai.exception.CreditExhaustedException(
                    "Not enough credits remaining");
        }
    }

    @Transactional
    public void deductCredits(int creditCost) {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        if (credits.getPlan() == PlanType.PRO) return;
        credits.setRemaining(credits.getRemaining() - creditCost);
        creditsRepository.save(credits);
    }

    @Transactional
    public CreditsResponse upgradePlan() {
        Long userId = securityUtils.getCurrentUserId();
        UserCredits credits = getOrCreateCredits(userId);
        credits.setPlan(PlanType.PRO);
        credits.setRemaining(UNLIMITED);
        credits.setTotal(UNLIMITED);
        credits.setPeriodStart(Instant.now());
        credits.setPeriodEnd(Instant.now().plus(365, ChronoUnit.DAYS));
        creditsRepository.save(credits);
        return toResponse(credits);
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
        return creditsRepository.findByUserId(userId).orElseGet(() -> {
            Instant now = Instant.now();
            UserCredits credits = UserCredits.builder()
                    .user(securityUtils.getCurrentUser())
                    .remaining(DEFAULT_FREE_CREDITS)
                    .total(DEFAULT_FREE_CREDITS)
                    .plan(PlanType.FREE)
                    .periodStart(now)
                    .periodEnd(now.plus(30, ChronoUnit.DAYS))
                    .build();
            return creditsRepository.save(credits);
        });
    }

    private void checkAndResetPeriod(UserCredits credits) {
        if (Instant.now().isAfter(credits.getPeriodEnd())) {
            if (credits.getPlan() == PlanType.FREE) {
                credits.setRemaining(DEFAULT_FREE_CREDITS);
                credits.setTotal(DEFAULT_FREE_CREDITS);
            }
            credits.setPeriodStart(Instant.now());
            credits.setPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));
            creditsRepository.save(credits);
        }
    }

    private CreditsResponse toResponse(UserCredits credits) {
        boolean isUnlimited = credits.getRemaining() == UNLIMITED;
        return CreditsResponse.builder()
                .remaining(isUnlimited ? -1 : credits.getRemaining())
                .total(isUnlimited ? -1 : credits.getTotal())
                .plan(credits.getPlan())
                .periodStart(credits.getPeriodStart())
                .periodEnd(credits.getPeriodEnd())
                .isUnlimited(isUnlimited)
                .build();
    }
}
