package com.blueprintai.controller;

import com.blueprintai.model.dto.response.CreditsResponse;
import com.blueprintai.service.CreditsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
