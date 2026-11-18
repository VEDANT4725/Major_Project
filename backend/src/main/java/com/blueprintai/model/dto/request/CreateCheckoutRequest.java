package com.blueprintai.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCheckoutRequest {
    @NotBlank
    private String productType;

    private String packId;
}
