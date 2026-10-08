package com.campusconnect.controller;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.model.EventCategory;
import com.campusconnect.model.User;
import com.campusconnect.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final RegistrationService registrationService;
    private final AttendanceService attendanceService;
    private final FeedbackService feedbackService;

    // ---- public ----
    @GetMapping
    public List<EventDto> list(@RequestParam(required = false) String q,
                               @RequestParam(required = false) EventCategory category,
                               @RequestParam(defaultValue = "false") boolean includePast) {
        return eventService.listPublic(q, category, includePast);
    }

    @GetMapping("/{id}")
    public EventDto get(@PathVariable Long id) {
        return eventService.get(id);
    }

    // ---- organisers ----
    @GetMapping("/mine")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EventDto> mine(@AuthenticationPrincipal User user) {
        return eventService.all();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public EventDto create(@AuthenticationPrincipal User user, @Valid @RequestBody EventRequest req) {
        return eventService.create(user, req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EventDto update(@AuthenticationPrincipal User user, @PathVariable Long id,
                           @Valid @RequestBody EventRequest req) {
        return eventService.update(user, id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void cancel(@AuthenticationPrincipal User user, @PathVariable Long id) {
        eventService.cancel(user, id);
    }

    @PostMapping("/{id}/announcements")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void announce(@AuthenticationPrincipal User user, @PathVariable Long id,
                         @Valid @RequestBody AnnouncementRequest req) {
        eventService.announce(user, id, req);
    }

    @GetMapping("/{id}/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<RegistrantDto> registrants(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return registrationService.registrants(user, id);
    }

    @GetMapping("/{id}/attendance")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AttendanceDto> attendance(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return attendanceService.forEvent(user, id);
    }

    // ---- students ----
    @PostMapping("/{id}/register")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STUDENT')")
    public RegistrationDto register(@AuthenticationPrincipal User user, @PathVariable Long id,
                                    @Valid @RequestBody RegisterRequest req) {
        return registrationService.register(user, id, req);
    }

    // ---- feedback ----
    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasRole('STUDENT')")
    public FeedbackDto submitFeedback(@AuthenticationPrincipal User user, @PathVariable Long id,
                                      @Valid @RequestBody FeedbackRequest req) {
        return feedbackService.submit(user, id, req);
    }

    @GetMapping("/{id}/feedback/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public FeedbackDto myFeedback(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return feedbackService.mine(user, id);
    }

    @GetMapping("/{id}/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    public FeedbackSummary feedback(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return feedbackService.summary(user, id);
    }
}
