package com.campusconnect.controller;

import com.campusconnect.dto.Dtos.AttendanceDto;
import com.campusconnect.dto.Dtos.AttendanceRequest;
import com.campusconnect.model.User;
import com.campusconnect.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AttendanceController {

    private final AttendanceService attendance;

    @PostMapping("/mark")
    public AttendanceDto mark(@AuthenticationPrincipal User user, @Valid @RequestBody AttendanceRequest req) {
        return attendance.markByToken(user, req.qrToken());
    }

    @PostMapping("/mark-manual/{registrationId}")
    public AttendanceDto markManual(@AuthenticationPrincipal User user, @PathVariable Long registrationId) {
        return attendance.markByRegistration(user, registrationId);
    }
}
