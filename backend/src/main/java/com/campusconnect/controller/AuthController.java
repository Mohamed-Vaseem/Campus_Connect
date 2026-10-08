package com.campusconnect.controller;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.model.User;
import com.campusconnect.service.AuthService;
import com.campusconnect.service.DtoMapper;
import com.campusconnect.service.RegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService auth;
    private final DtoMapper mapper;
    private final RegistrationService registrationService;

    @PostMapping("/api/auth/register")
    public AuthResponse register(@Valid @RequestBody RegisterAccountRequest req) {
        return auth.register(req);
    }

    /** One form for everyone: the club coordinator's username/password opens the admin portal, anything else is a student. */
    @PostMapping("/api/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return auth.login(req, clientKey(http));
    }

    @GetMapping("/api/users/profile")
    public UserDto profile(@AuthenticationPrincipal User user) {
        return mapper.user(user);
    }

    @PutMapping("/api/users/profile")
    public UserDto updateProfile(@AuthenticationPrincipal User user, @Valid @RequestBody ProfileRequest req) {
        return auth.updateProfile(user, req);
    }

    @GetMapping("/api/students/stats")
    public StudentStats stats(@AuthenticationPrincipal User user) {
        return registrationService.stats(user);
    }

    /** Behind nginx the real client is the last X-Forwarded-For entry; otherwise the socket address. */
    private String clientKey(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            return parts[parts.length - 1].trim();
        }
        return http.getRemoteAddr();
    }
}
