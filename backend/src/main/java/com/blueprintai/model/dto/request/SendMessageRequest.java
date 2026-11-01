package com.blueprintai.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Prompt is required")
    private String prompt;

    private String model;

    private List<ImageAttachmentDto> images;

    private List<String> selectedFiles;

    @Data
    public static class ImageAttachmentDto {
        @NotNull
        private String base64;
        @NotNull
        private String mediaType;
        private String name;
    }
}
