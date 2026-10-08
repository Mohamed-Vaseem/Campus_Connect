package com.campusconnect.controller;

import com.campusconnect.dto.Dtos.RegistrationDto;
import com.campusconnect.model.Registration;
import com.campusconnect.model.User;
import com.campusconnect.service.QrService;
import com.campusconnect.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class RegistrationController {

    private final RegistrationService registrations;
    private final QrService qr;

    @GetMapping("/api/students/my-registrations")
    public List<RegistrationDto> mine(@AuthenticationPrincipal User user) {
        return registrations.mine(user);
    }

    @DeleteMapping("/api/registrations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal User user, @PathVariable Long id) {
        registrations.cancel(user, id);
    }

    /** PNG of the ticket QR, for downloading or printing. */
    @GetMapping("/api/registrations/{id}/qr")
    public ResponseEntity<byte[]> qr(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Registration reg = registrations.ownedRegistration(user, id);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"ticket-" + id + ".png\"")
                .body(qr.png(reg.getQrToken(), 512));
    }
}
