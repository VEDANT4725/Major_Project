package com.blueprintai.repository;

import com.blueprintai.model.entity.BillingOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface BillingOrderRepository extends JpaRepository<BillingOrder, Long> {
    Optional<BillingOrder> findByRazorpayOrderId(String razorpayOrderId);
    java.util.List<BillingOrder> findTop10ByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select billingOrder from BillingOrder billingOrder where billingOrder.razorpayOrderId = :orderId")
    Optional<BillingOrder> findByRazorpayOrderIdForUpdate(@Param("orderId") String orderId);
}
