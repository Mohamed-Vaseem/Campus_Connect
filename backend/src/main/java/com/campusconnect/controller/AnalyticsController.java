package com.campusconnect.controller;

import com.campusconnect.dto.Dtos.AnalyticsDto;
import com.campusconnect.model.User;
import com.campusconnect.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analytics;

    @GetMapping
    public AnalyticsDto overview(@AuthenticationPrincipal User user) {
        return analytics.overview();
    }
}
