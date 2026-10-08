package com.campusconnect.controller;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.exception.ApiException;
import com.campusconnect.model.*;
import com.campusconnect.repository.AttendanceRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.AdminManagementService;
import com.campusconnect.service.AuditService;
import com.campusconnect.service.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Records the coordinator can view and export: every registration, every student, the history log. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository users;
    private final RegistrationRepository registrations;
    private final AttendanceRepository attendance;
    private final AuditService audit;
    private final DtoMapper mapper;
    private final AdminManagementService adminService;

    @GetMapping("/students")
    @Transactional(readOnly = true)
    public List<UserDto> students() {
        return users.findAllByOrderByCreatedAtDesc().stream()
                .filter(u -> u.getRole() == Role.STUDENT)
                .map(mapper::user).toList();
    }

    @PatchMapping("/students/{id}/active")
    @Transactional
    public UserDto setActive(@AuthenticationPrincipal User admin, @PathVariable Long id, @RequestBody ActiveRequest req) {
        User u = users.findById(id).filter(x -> x.getRole() == Role.STUDENT)
                .orElseThrow(() -> ApiException.notFound("Student"));
        u.setActive(req.active());
        audit.log(admin, req.active() ? "STUDENT_REACTIVATED" : "STUDENT_DEACTIVATED", "User", u.getId(), u.getName());
        return mapper.user(u);
    }

    /** Every registration ever made, cancelled ones included, one flat row each. */
    @GetMapping("/registrations")
    @Transactional(readOnly = true)
    public List<RegistrationRow> registrations() {
        Map<Long, Attendance> present = attendance.findAll().stream()
                .collect(Collectors.toMap(a -> a.getRegistration().getId(), Function.identity()));
        return registrations.findAll().stream()
                .sorted((a, b) -> b.getRegistrationDate().compareTo(a.getRegistrationDate()))
                .map(r -> {
                    User s = r.getStudent();
                    Attendance a = present.get(r.getId());
                    String members = r.getTeamMembers().isEmpty() ? "" : r.getTeamMembers().stream()
                            .map(m -> m.getName() + (m.getYearOfStudy() != null ? " (Y" + m.getYearOfStudy() + ")" : ""))
                            .collect(Collectors.joining("; "));
                    return new RegistrationRow(r.getId(), r.getEvent().getId(), r.getEvent().getTitle(),
                            r.getEvent().getEventDate(), s.getId(), s.getName(), s.getRollNumber(), s.getDepartment(),
                            s.getYearOfStudy(), s.getEmail(), r.getMobileNumber(), r.getTeamName(), members,
                            r.getStatus(), r.getRegistrationDate(), a != null, a == null ? null : a.getMarkedAt());
                }).toList();
    }

    /** Permanently deletes a student account and everything tied to it. Use with care - this cannot be undone. */
    @DeleteMapping("/students/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deleteStudent(@AuthenticationPrincipal User adminUser, @PathVariable Long id) {
        adminService.deleteStudent(adminUser, id);
    }

    /** Permanently deletes one registration (frees the seat for the waitlist). Use with care - this cannot be undone. */
    @DeleteMapping("/registrations/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deleteRegistration(@AuthenticationPrincipal User adminUser, @PathVariable Long id) {
        adminService.deleteRegistration(adminUser, id);
    }

    @GetMapping("/history")
    public List<AuditDto> history(@RequestParam(defaultValue = "500") int limit) {
        return audit.recent(limit);
    }
}
