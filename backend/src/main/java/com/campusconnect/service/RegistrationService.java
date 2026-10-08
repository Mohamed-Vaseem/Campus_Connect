package com.campusconnect.service;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.exception.ApiException;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RegistrationService {

    private final EventRepository events;
    private final RegistrationRepository registrations;
    private final AttendanceRepository attendance;
    private final NotificationService notifications;
    private final PermissionService permissions;
    private final AuditService audit;
    private final DtoMapper mapper;

    public RegistrationDto register(User student, Long eventId, RegisterRequest req) {
        if (student.getRole() != Role.STUDENT) {
            throw ApiException.forbidden("Only student accounts can register for events");
        }
        if (!DtoMapper.profileComplete(student)) {
            throw ApiException.badRequest("Add your register number, department and year to your profile before registering");
        }
        // Lock the event row so two people can't grab the last seat at once.
        Event event = events.findByIdForUpdate(eventId).orElseThrow(() -> ApiException.notFound("Event"));
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw ApiException.conflict("Registration isn't open for this event");
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(event.getRegistrationDeadline())) {
            throw ApiException.conflict("The registration deadline has passed");
        }
        validate(event, req);

        Registration reg = registrations.findByStudentAndEvent(student, event).orElse(null);
        if (reg != null && reg.getStatus() != RegistrationStatus.CANCELLED) {
            throw ApiException.conflict("You're already registered for this event");
        }
        if (reg == null) {
            reg = new Registration();
            reg.setStudent(student);
            reg.setEvent(event);
            reg.setQrToken(UUID.randomUUID().toString());
        }
        reg.setRegistrationDate(now);
        reg.setMobileNumber(req.mobileNumber().trim());
        if (event.isTeamEvent()) {
            reg.setTeamName(req.teamName().trim());
            List<TeamMember> members = new ArrayList<>();
            req.members().forEach(m -> members.add(new TeamMember(m.name().trim(), m.yearOfStudy())));
            reg.setTeamMembers(members);
        } else {
            reg.setTeamName(null);
            reg.setTeamMembers(new ArrayList<>());
        }
        long confirmed = registrations.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);
        boolean seatFree = confirmed < event.getCapacity();
        reg.setStatus(seatFree ? RegistrationStatus.CONFIRMED : RegistrationStatus.WAITLISTED);
        registrations.save(reg);
        audit.log(student, seatFree ? "REGISTERED" : "WAITLISTED", "Event", event.getId(),
                student.getName() + " (" + student.getRollNumber() + ") for " + event.getTitle()
                        + (event.isTeamEvent() ? " as team \"" + reg.getTeamName() + "\"" : ""));

        if (seatFree) {
            notifications.notify(student, "You're in: " + event.getTitle(),
                    "Your registration is confirmed for " + event.getTitle() + " on " + event.getEventDate()
                            + " at " + event.getVenue() + ". Show your QR ticket at the entrance.",
                    NotificationType.REGISTRATION, "/tickets", true);
        } else {
            notifications.notify(student, "You're on the waiting list: " + event.getTitle(),
                    "The event is full. We'll confirm your seat automatically if someone cancels.",
                    NotificationType.REGISTRATION, "/tickets", true);
        }
        return mapper.registration(reg);
    }

    private void validate(Event event, RegisterRequest req) {
        if (req.mobileNumber() == null || !req.mobileNumber().trim().matches("\\+?[0-9\\s-]{10,15}")) {
            throw ApiException.badRequest("Enter a valid mobile number");
        }
        if (event.isTeamEvent()) {
            if (req.teamName() == null || req.teamName().isBlank()) {
                throw ApiException.badRequest("Enter a team name");
            }
            if (req.members() == null || req.members().isEmpty()) {
                throw ApiException.badRequest("Add at least one team member");
            }
            if (req.members().stream().anyMatch(m -> m.name() == null || m.name().isBlank())) {
                throw ApiException.badRequest("Every team member needs a name");
            }
            if (event.getMaxTeamSize() != null && req.members().size() > event.getMaxTeamSize()) {
                throw ApiException.badRequest("Teams for this event can have at most " + event.getMaxTeamSize() + " members");
            }
        }
    }

    public void cancel(User student, Long registrationId) {
        Registration reg = registrations.findById(registrationId)
                .orElseThrow(() -> ApiException.notFound("Registration"));
        if (!reg.getStudent().getId().equals(student.getId())) {
            throw ApiException.forbidden("This isn't your registration");
        }
        if (reg.getStatus() == RegistrationStatus.CANCELLED) {
            throw ApiException.conflict("This registration is already cancelled");
        }
        if (attendance.existsByRegistration(reg)) {
            throw ApiException.conflict("You've already attended this event");
        }
        Event event = events.findByIdForUpdate(reg.getEvent().getId()).orElseThrow();
        if (LocalDateTime.of(event.getEventDate(), event.getStartTime()).isBefore(LocalDateTime.now())) {
            throw ApiException.conflict("The event has already started");
        }
        boolean freedSeat = reg.getStatus() == RegistrationStatus.CONFIRMED;
        reg.setStatus(RegistrationStatus.CANCELLED);
        registrations.save(reg);
        audit.log(student, "REGISTRATION_CANCELLED", "Event", event.getId(),
                student.getName() + " (" + student.getRollNumber() + ") for " + event.getTitle());
        if (freedSeat) {
            promoteFromWaitlist(event);
        }
    }

    /** Fills any free seats from the waiting list, oldest request first. */
    public void promoteFromWaitlist(Event event) {
        long confirmed = registrations.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);
        List<Registration> waiting =
                registrations.findByEventAndStatusOrderByRegistrationDateAsc(event, RegistrationStatus.WAITLISTED);
        for (Registration w : waiting) {
            if (confirmed >= event.getCapacity()) break;
            w.setStatus(RegistrationStatus.CONFIRMED);
            registrations.save(w);
            confirmed++;
            notifications.notify(w.getStudent(), "A seat opened up: " + event.getTitle(),
                    "You've moved off the waiting list and your seat for " + event.getTitle() + " is confirmed.",
                    NotificationType.REGISTRATION, "/tickets", true);
        }
    }

    @Transactional(readOnly = true)
    public List<RegistrationDto> mine(User student) {
        return registrations.findByStudentOrderByRegistrationDateDesc(student).stream()
                .filter(r -> r.getStatus() != RegistrationStatus.CANCELLED)
                .map(mapper::registration)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RegistrantDto> registrants(User user, Long eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> ApiException.notFound("Event"));
        permissions.requireManage(user, event);
        Map<Long, Attendance> present = attendance.findByRegistration_EventOrderByMarkedAtAsc(event).stream()
                .collect(Collectors.toMap(a -> a.getRegistration().getId(), a -> a));
        return registrations.findByEventOrderByRegistrationDateAsc(event).stream()
                .filter(r -> r.getStatus() != RegistrationStatus.CANCELLED)
                .sorted(Comparator.comparing(Registration::getStatus).thenComparing(Registration::getRegistrationDate))
                .map(r -> {
                    Attendance a = present.get(r.getId());
                    return new RegistrantDto(r.getId(), mapper.user(r.getStudent()), r.getStatus(),
                            r.getRegistrationDate(), a != null, a == null ? null : a.getMarkedAt(),
                            r.getMobileNumber(), r.getTeamName(), mapper.teamMembers(r));
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Registration ownedRegistration(User student, Long id) {
        Registration reg = registrations.findById(id).orElseThrow(() -> ApiException.notFound("Registration"));
        if (!reg.getStudent().getId().equals(student.getId())) {
            throw ApiException.forbidden("This isn't your registration");
        }
        return reg;
    }

    @Transactional(readOnly = true)
    public StudentStats stats(User student) {
        List<Registration> mine = registrations.findByStudentOrderByRegistrationDateDesc(student).stream()
                .filter(r -> r.getStatus() != RegistrationStatus.CANCELLED).toList();
        EventCategory favourite = mine.stream()
                .collect(Collectors.groupingBy(r -> r.getEvent().getCategory(), Collectors.counting()))
                .entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
        return new StudentStats(mine.size(), attendance.countByRegistration_Student(student), favourite);
    }
}
