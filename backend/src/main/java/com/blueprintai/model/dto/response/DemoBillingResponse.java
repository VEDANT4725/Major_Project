package com.blueprintai.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class DemoBillingResponse {
    private boolean enabled;
    private boolean razorpayEnabled;
    private String razorpayKeyId;
    private String currency;
    private int proPricePaise;
    private List<Pack> packs;

    @Data
    @Builder
    @AllArgsConstructor
    public static class Pack {
        private String id;
        private String name;
        private int credits;
        private int amountPaise;
        private boolean featured;
    }
}
