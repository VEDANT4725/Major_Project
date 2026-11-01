package com.blueprintai.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 1, max = 100, message = "Project name must be 1-100 characters")
    private String name;

    @NotBlank(message = "Model is required")
    private String model;

    private String description;
}
