package com.campusconnect.service;

import com.campusconnect.exception.ApiException;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Permanent deletes for the coordinator. Cancelling (elsewhere) keeps the record and is what students and the
 * coordinator use day to day; these methods remove rows from the database entirely, for cleaning up mistakes
 * (duplicate sign-ups, test accounts, a wrongly created registration) rather than routine event administration.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminManagementService {

    private final UserRepository users;
    private final RegistrationRepository registrations;
    private final AttendanceRepository attendance;
    private final ActivityPointRepository points;
    private final FeedbackRepository feedback;
    private final NotificationRepository notifications;
    private final RegistrationService registrationService;
    private final AuditService audit;

    /** Permanently removes one registration (and its attendance record, if any). Frees a seat for the waitlist. */
    public void deleteRegistration(User admin, Long id) {
        Registration reg = registrations.findById(id).orElseThrow(() -> ApiException.notFound("Registration"));
        Event event = reg.getEvent();
        boolean wasConfirmed = reg.getStatus() == RegistrationStatus.CONFIRMED;
        String detail = reg.getStudent().getName() + " (" + reg.getStudent().getRollNumber() + ") from "
                + event.getTitle() + (reg.getTeamName() != null ? ", team \"" + reg.getTeamName() + "\"" : "");
        attendance.deleteByRegistration(reg);
        registrations.delete(reg);
        audit.log(admin, "REGISTRATION_DELETED", "Event", event.getId(), detail);
        if (wasConfirmed) {
            registrationService.promoteFromWaitlist(event);
        }
    }

    /**
     * Permanently removes a student account and everything tied to it: registrations, attendance, activity
     * points, feedback and notifications. The event and other students' records are untouched.
     */
    public void deleteStudent(User admin, Long id) {
        User student = users.findById(id).filter(u -> u.getRole() == Role.STUDENT)
                .orElseThrow(() -> ApiException.notFound("Student"));
        String detail = student.getName() + " (" + student.getEmail() + ", " + student.getRollNumber() + ")";

        List<Registration> mine = registrations.findByStudentOrderByRegistrationDateDesc(student);
        Set<Event> freedSeats = new HashSet<>();
        for (Registration reg : mine) {
            if (reg.getStatus() == RegistrationStatus.CONFIRMED) freedSeats.add(reg.getEvent());
            attendance.deleteByRegistration(reg);
            registrations.delete(reg);
        }
        points.deleteByStudent(student);
        feedback.deleteByStudent(student);
        notifications.deleteByUser(student);
        users.delete(student);
        audit.log(admin, "STUDENT_DELETED", "User", id, detail + " permanently deleted, " + mine.size() + " registration(s) removed");
        freedSeats.forEach(registrationService::promoteFromWaitlist);
    }
}
