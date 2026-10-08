package com.campusconnect.service;

import com.campusconnect.model.*;
import com.campusconnect.repository.AttendanceRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledJobs {

    private final EventRepository events;
    private final RegistrationRepository registrations;
    private final AttendanceRepository attendance;
    private final UserRepository users;
    private final NotificationService notifications;

    /** 8 AM every day: remind everyone registered for tomorrow's events. */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        for (Event e : events.findByStatusAndEventDateAndReminderSentFalse(EventStatus.PUBLISHED, tomorrow)) {
            registrations.findByEventAndStatusOrderByRegistrationDateAsc(e, RegistrationStatus.CONFIRMED)
                    .forEach(r -> notifications.notify(r.getStudent(), "Tomorrow: " + e.getTitle(),
                            e.getTitle() + " starts tomorrow at " + e.getStartTime() + ", " + e.getVenue()
                                    + ". Keep your QR ticket ready.", NotificationType.REMINDER,
                            "/tickets", true));
            e.setReminderSent(true);
            log.info("Sent reminders for event {}", e.getId());
        }
    }

    /** Hourly: tell students who haven't registered that a deadline is less than a day away. */
    @Scheduled(cron = "0 5 * * * *")
    @Transactional
    public void sendClosingNotices() {
        LocalDateTime now = LocalDateTime.now();
        for (Event e : events.findByStatusAndClosingNoticeSentFalseAndRegistrationDeadlineBetween(
                EventStatus.PUBLISHED, now, now.plusHours(24))) {
            Set<Long> already = registrations.findByEventOrderByRegistrationDateAsc(e).stream()
                    .filter(r -> r.getStatus() != RegistrationStatus.CANCELLED)
                    .map(r -> r.getStudent().getId()).collect(Collectors.toSet());
            notifications.notifyAll(
                    users.findByRoleAndActiveTrue(Role.STUDENT).stream().filter(s -> !already.contains(s.getId())).toList(),
                    "Registration closing: " + e.getTitle(),
                    "Registration for " + e.getTitle() + " closes " + e.getRegistrationDeadline().toLocalDate()
                            + " at " + e.getRegistrationDeadline().toLocalTime().withSecond(0).withNano(0) + ".",
                    NotificationType.DEADLINE, "/events/" + e.getId(), false);
            e.setClosingNoticeSent(true);
        }
    }

    /** Hourly: events whose date has passed become COMPLETED and attendees are invited to leave feedback. */
    @Scheduled(cron = "0 15 * * * *")
    @Transactional
    public void completePastEvents() {
        for (Event e : events.findByStatusAndEventDateBefore(EventStatus.PUBLISHED, LocalDate.now())) {
            e.setStatus(EventStatus.COMPLETED);
            attendance.findByRegistration_EventOrderByMarkedAtAsc(e).forEach(a ->
                    notifications.notify(a.getRegistration().getStudent(), "How was " + e.getTitle() + "?",
                            "Rate the event and tell the organisers what worked.", NotificationType.EVENT,
                            "/events/" + e.getId(), false));
        }
    }
}
