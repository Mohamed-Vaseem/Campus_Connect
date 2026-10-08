package com.campusconnect.service;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.exception.ApiException;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    private final EventRepository events;
    private final RegistrationRepository registrations;
    private final UserRepository users;
    private final NotificationService notifications;
    private final RegistrationService registrationService;
    private final PermissionService permissions;
    private final AuditService audit;
    private final DtoMapper mapper;

    @Value("${app.club-name:iTech Broadcast}")
    private String clubName;

    // ---------- reading ----------

    @Transactional(readOnly = true)
    public List<EventDto> listPublic(String q, EventCategory category, boolean includePast) {
        List<EventStatus> statuses = includePast
                ? List.of(EventStatus.PUBLISHED, EventStatus.COMPLETED)
                : List.of(EventStatus.PUBLISHED);
        String needle = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return events.findByStatusInOrderByEventDateAscStartTimeAsc(statuses).stream()
                .filter(e -> category == null || e.getCategory() == category)
                .filter(e -> needle.isEmpty() || matches(e, needle))
                .map(mapper::event)
                .toList();
    }

    private boolean matches(Event e, String needle) {
        return contains(e.getTitle(), needle) || contains(e.getDescription(), needle) || contains(e.getVenue(), needle);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    @Transactional(readOnly = true)
    public EventDto get(Long id) {
        return mapper.event(events.findById(id).orElseThrow(() -> ApiException.notFound("Event")));
    }

    /** Everything the coordinator has ever created, cancelled events included: history is kept. */
    @Transactional(readOnly = true)
    public List<EventDto> all() {
        return events.findAllByOrderByEventDateDesc().stream().map(mapper::event).toList();
    }

    // ---------- writing ----------

    public EventDto create(User organizer, EventRequest req) {
        validate(req, true);
        Event e = new Event();
        e.setOrganizer(organizer);
        apply(e, req);
        e.setStatus(EventStatus.PUBLISHED);
        events.save(e);
        notifications.notifyAll(users.findByRoleAndActiveTrue(Role.STUDENT), "New event: " + e.getTitle(),
                e.getTitle() + " is open for registration. " + e.getEventDate() + " at " + e.getVenue() + ".",
                NotificationType.EVENT, "/events/" + e.getId(), false); // in-app only, so we don't spam inboxes
        audit.log(organizer, "EVENT_CREATED", "Event", e.getId(), e.getTitle() + " on " + e.getEventDate());
        return mapper.event(e);
    }

    public EventDto update(User user, Long id, EventRequest req) {
        Event e = events.findById(id).orElseThrow(() -> ApiException.notFound("Event"));
        permissions.requireManage(user, e);
        if (e.getStatus() == EventStatus.CANCELLED || e.getStatus() == EventStatus.COMPLETED) {
            throw ApiException.conflict("A " + e.getStatus().name().toLowerCase() + " event can't be edited");
        }
        validate(req, false);
        boolean logisticsChanged = !e.getVenue().equals(req.venue().trim()) || !e.getEventDate().equals(req.eventDate())
                || !e.getStartTime().equals(req.startTime());
        apply(e, req);
        events.save(e);
        registrationService.promoteFromWaitlist(e);            // capacity may have grown
        if (logisticsChanged) {
            notifyRegistrants(e, "Update for " + e.getTitle(),
                    "The event is now on " + e.getEventDate() + " at " + e.getStartTime()
                            + ", venue: " + e.getVenue() + ".", NotificationType.VENUE_CHANGE, true);
        }
        audit.log(user, "EVENT_UPDATED", "Event", e.getId(), e.getTitle());
        return mapper.event(e);
    }

    /** DELETE /api/events/{id} cancels the event and tells everyone who signed up. The record stays. */
    public void cancel(User user, Long id) {
        Event e = events.findById(id).orElseThrow(() -> ApiException.notFound("Event"));
        permissions.requireManage(user, e);
        if (e.getStatus() == EventStatus.CANCELLED) return;
        if (e.getStatus() == EventStatus.COMPLETED) throw ApiException.conflict("A completed event can't be cancelled");
        e.setStatus(EventStatus.CANCELLED);
        events.save(e);
        notifyRegistrants(e, "Cancelled: " + e.getTitle(),
                "Sorry, " + e.getTitle() + " on " + e.getEventDate() + " has been cancelled.",
                NotificationType.EVENT, true);
        audit.log(user, "EVENT_CANCELLED", "Event", e.getId(), e.getTitle());
    }

    public void announce(User user, Long id, AnnouncementRequest req) {
        Event e = events.findById(id).orElseThrow(() -> ApiException.notFound("Event"));
        permissions.requireManage(user, e);
        notifyRegistrants(e, req.title(), req.message(), NotificationType.ANNOUNCEMENT, true);
        audit.log(user, "ANNOUNCEMENT", "Event", e.getId(), req.title());
    }

    // ---------- helpers ----------

    private void notifyRegistrants(Event e, String title, String message, NotificationType type, boolean email) {
        registrations.findByEventOrderByRegistrationDateAsc(e).stream()
                .filter(r -> r.getStatus() != RegistrationStatus.CANCELLED)
                .forEach(r -> notifications.notify(r.getStudent(), title, message, type,
                        "/events/" + e.getId(), email));
    }

    private void apply(Event e, EventRequest r) {
        e.setTitle(r.title().trim());
        e.setDescription(r.description());
        e.setCategory(r.category());
        e.setVenue(r.venue().trim());
        e.setEventDate(r.eventDate());
        e.setStartTime(r.startTime());
        e.setEndTime(r.endTime());
        e.setCapacity(r.capacity());
        e.setRegistrationDeadline(r.registrationDeadline());
        e.setPosterUrl(r.posterUrl() == null || r.posterUrl().isBlank() ? null : r.posterUrl());
        e.setWhatsappLink(r.whatsappLink() == null || r.whatsappLink().isBlank() ? null : r.whatsappLink().trim());
        e.setClubName(clubName);
        e.setPointsEligible(r.pointsEligible() == null || r.pointsEligible());
        e.setTeamEvent(Boolean.TRUE.equals(r.teamEvent()));
        e.setMaxTeamSize(e.isTeamEvent() ? r.maxTeamSize() : null);
    }

    private void validate(EventRequest r, boolean creating) {
        if (!r.endTime().isAfter(r.startTime())) {
            throw ApiException.badRequest("End time must be after the start time");
        }
        if (Boolean.TRUE.equals(r.teamEvent()) && (r.maxTeamSize() == null || r.maxTeamSize() < 1)) {
            throw ApiException.badRequest("Set a maximum team size for a team event");
        }
        if (r.whatsappLink() != null && !r.whatsappLink().isBlank() && !r.whatsappLink().trim().startsWith("http")) {
            throw ApiException.badRequest("The WhatsApp link should start with https://");
        }
        if (creating && r.eventDate().isBefore(LocalDate.now())) {
            throw ApiException.badRequest("The event date can't be in the past");
        }
        if (r.registrationDeadline().isAfter(LocalDateTime.of(r.eventDate(), r.startTime()))) {
            throw ApiException.badRequest("Registration must close before the event starts");
        }
    }
}
