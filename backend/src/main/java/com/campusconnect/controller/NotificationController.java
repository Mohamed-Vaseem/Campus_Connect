package com.campusconnect.controller;

import com.campusconnect.dto.Dtos.NotificationDto;
import com.campusconnect.model.User;
import com.campusconnect.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notifications;

    @GetMapping
    public List<NotificationDto> latest(@AuthenticationPrincipal User user) {
        return notifications.latest(user);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread(@AuthenticationPrincipal User user) {
        return Map.of("count", notifications.unreadCount(user));
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notifications.markSeen(user, id);
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void readAll(@AuthenticationPrincipal User user) {
        notifications.markAllSeen(user);
    }
}
