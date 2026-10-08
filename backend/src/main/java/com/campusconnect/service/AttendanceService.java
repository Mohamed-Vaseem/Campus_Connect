package com.campusconnect.service;

import com.campusconnect.dto.Dtos.AttendanceDto;
import com.campusconnect.exception.ApiException;
import com.campusconnect.model.*;
import com.campusconnect.repository.AttendanceRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("hh:mm a");

    private final RegistrationRepository registrations;
    private final AttendanceRepository attendance;
    private final EventRepository events;
    private final PermissionService permissions;
    private final ActivityPointService activityPoints;
    private final AuditService audit;
    private final DtoMapper mapper;

    @Value("${app.attendance.enforce-window:true}")
    private boolean enforceWindow;
    @Value("${app.attendance.opens-minutes-before:60}")
    private long opensBefore;
    @Value("${app.attendance.closes-minutes-after:30}")
    private long closesAfter;

    /** Marks attendance from a scanned QR token. */
    public AttendanceDto markByToken(User marker, String token) {
        Registration reg = registrations.findByQrToken(token.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "This QR code isn't valid"));
        return mark(marker, reg);
    }

    /** Manual fallback when a phone camera or QR code isn't available. */
    public AttendanceDto markByRegistration(User marker, Long registrationId) {
        Registration reg = registrations.findById(registrationId)
                .orElseThrow(() -> ApiException.notFound("Registration"));
        return mark(marker, reg);
    }

    private AttendanceDto mark(User marker, Registration reg) {
        Event event = reg.getEvent();
        permissions.requireManage(marker, event);

        if (reg.getStatus() != RegistrationStatus.CONFIRMED) {
            throw ApiException.conflict(reg.getStudent().getName() + " is not confirmed for this event ("
                    + reg.getStatus().name().toLowerCase() + ")");
        }
        if (event.getStatus() != EventStatus.PUBLISHED && event.getStatus() != EventStatus.COMPLETED) {
            throw ApiException.conflict("This event is " + event.getStatus().name().toLowerCase().replace('_', ' '));
        }
        if (enforceWindow) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime opens = LocalDateTime.of(event.getEventDate(), event.getStartTime()).minusMinutes(opensBefore);
            LocalDateTime closes = LocalDateTime.of(event.getEventDate(), event.getEndTime()).plusMinutes(closesAfter);
            if (now.isBefore(opens)) {
                throw ApiException.conflict("Attendance opens at " + opens.format(HM) + " on " + opens.toLocalDate());
            }
            if (now.isAfter(closes)) {
                throw ApiException.conflict("Attendance closed at " + closes.format(HM) + " on " + closes.toLocalDate());
            }
        }
        var existing = attendance.findByRegistration(reg);
        if (existing.isPresent()) {
            throw ApiException.conflict(reg.getStudent().getName() + " was already marked present at "
                    + existing.get().getMarkedAt().format(HM));
        }
        Attendance a = new Attendance();
        a.setRegistration(reg);
        a.setMarkedBy(marker);
        a.setMarkedAt(LocalDateTime.now());
        attendance.save(a);
        audit.log(marker, "ATTENDANCE", "Event", event.getId(),
                reg.getStudent().getName() + " (" + reg.getStudent().getRollNumber() + ") present at " + event.getTitle());
        activityPoints.autoAwardAttendance(marker, reg.getStudent(), event);
        return mapper.attendance(a);
    }

    @Transactional(readOnly = true)
    public List<AttendanceDto> forEvent(User user, Long eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> ApiException.notFound("Event"));
        permissions.requireManage(user, event);
        return attendance.findByRegistration_EventOrderByMarkedAtAsc(event).stream().map(mapper::attendance).toList();
    }
}
