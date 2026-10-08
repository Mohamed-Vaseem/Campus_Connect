package com.campusconnect.service;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.exception.ApiException;
import com.campusconnect.model.Event;
import com.campusconnect.model.Feedback;
import com.campusconnect.model.User;
import com.campusconnect.repository.AttendanceRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FeedbackService {

    private final FeedbackRepository feedback;
    private final EventRepository events;
    private final AttendanceRepository attendance;
    private final PermissionService permissions;

    /** Only students who actually attended can rate. Submitting again updates the earlier answer. */
    public FeedbackDto submit(User student, Long eventId, FeedbackRequest req) {
        Event event = events.findById(eventId).orElseThrow(() -> ApiException.notFound("Event"));
        if (!attendance.existsByRegistration_StudentAndRegistration_Event(student, event)) {
            throw ApiException.forbidden("Only students who attended can leave feedback");
        }
        Feedback f = feedback.findByStudentAndEvent(student, event).orElseGet(Feedback::new);
        f.setStudent(student);
        f.setEvent(event);
        f.setRating(req.rating());
        f.setComments(req.comments());
        f.setCreatedAt(LocalDateTime.now());
        feedback.save(f);
        return toDto(f);
    }

    @Transactional(readOnly = true)
    public FeedbackDto mine(User student, Long eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> ApiException.notFound("Event"));
        return feedback.findByStudentAndEvent(student, event).map(this::toDto).orElse(null);
    }

    @Transactional(readOnly = true)
    public FeedbackSummary summary(User user, Long eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> ApiException.notFound("Event"));
        permissions.requireManage(user, event);
        List<FeedbackDto> items = feedback.findByEventOrderByCreatedAtDesc(event).stream().map(this::toDto).toList();
        Double avg = feedback.averageRating(event);
        return new FeedbackSummary(avg == null ? null : Math.round(avg * 10.0) / 10.0, items.size(), items);
    }

    private FeedbackDto toDto(Feedback f) {
        return new FeedbackDto(f.getId(), f.getStudent().getName(), f.getRating(), f.getComments(), f.getCreatedAt());
    }
}
