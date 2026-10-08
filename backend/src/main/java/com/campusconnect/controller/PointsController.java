package com.campusconnect.controller;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.model.User;
import com.campusconnect.service.ActivityPointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PointsController {

    private final ActivityPointService points;

    /** The activity point rules from the institute circular, for the "how to earn" table. */
    @GetMapping("/api/points/rules")
    public List<RuleDto> rules() {
        return points.rules();
    }

    @GetMapping("/api/points/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public PointsSummary mine(@AuthenticationPrincipal User user) {
        return points.mine(user);
    }

    // ---- club coordinator ----
    @GetMapping("/api/events/{eventId}/points")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ActivityPointDto> forEvent(@PathVariable Long eventId) {
        return points.forEvent(eventId);
    }

    @PostMapping("/api/events/{eventId}/points")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ActivityPointDto award(@AuthenticationPrincipal User user, @PathVariable Long eventId,
                                  @Valid @RequestBody AwardRequest req) {
        return points.awardForEvent(user, eventId, req);
    }

    @PostMapping("/api/admin/points/semester")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ActivityPointDto awardSemester(@AuthenticationPrincipal User user,
                                          @Valid @RequestBody SemesterAwardRequest req) {
        return points.awardForSemester(user, req);
    }

    @DeleteMapping("/api/points/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void remove(@AuthenticationPrincipal User user, @PathVariable Long id) {
        points.remove(user, id);
    }

    @GetMapping("/api/admin/points/report")
    @PreAuthorize("hasRole('ADMIN')")
    public PointsReport report(@RequestParam(required = false) String semester) {
        return points.report(semester);
    }

    @GetMapping("/api/admin/points/ledger")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ActivityPointDto> ledger(@RequestParam(required = false) String semester) {
        return points.ledger(semester);
    }
}
