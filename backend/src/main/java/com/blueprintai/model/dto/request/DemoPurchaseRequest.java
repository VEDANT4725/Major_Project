package com.blueprintai.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DemoPurchaseRequest {
    @NotBlank
    private String packId;
}
