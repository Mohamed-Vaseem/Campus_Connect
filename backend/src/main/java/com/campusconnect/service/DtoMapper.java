package com.campusconnect.service;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.model.*;
import com.campusconnect.repository.AttendanceRepository;
import com.campusconnect.repository.FeedbackRepository;
import com.campusconnect.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DtoMapper {

    private final RegistrationRepository registrations;
    private final FeedbackRepository feedback;
    private final AttendanceRepository attendance;

    public static boolean profileComplete(User u) {
        if (u.getRole() != Role.STUDENT) return true;
        return u.getRollNumber() != null && !u.getRollNumber().isBlank()
                && u.getDepartment() != null && !u.getDepartment().isBlank()
                && u.getYearOfStudy() != null;
    }

    public UserDto user(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRollNumber(), u.getDepartment(),
                u.getYearOfStudy(), u.getRole(), u.isActive(), profileComplete(u), u.getCreatedAt());
    }

    public EventDto event(Event e) {
        Double avg = feedback.averageRating(e);
        return new EventDto(e.getId(), e.getTitle(), e.getDescription(), e.getCategory(), e.getVenue(),
                e.getEventDate(), e.getStartTime(), e.getEndTime(), e.getCapacity(),
                e.getRegistrationDeadline(), e.getStatus(), e.getPosterUrl(), e.getClubName(),
                e.getOrganizer().getId(), e.getOrganizer().getName(),
                registrations.countByEventAndStatus(e, RegistrationStatus.CONFIRMED),
                registrations.countByEventAndStatus(e, RegistrationStatus.WAITLISTED),
                avg == null ? null : Math.round(avg * 10.0) / 10.0,
                feedback.countByEvent(e), e.isPointsEligible(),
                e.isPointsEligible() ? ActivityType.ATTENDING.points() : 0, e.isTeamEvent(), e.getMaxTeamSize(),
                e.getWhatsappLink());
    }

    public RegistrationDto registration(Registration r) {
        Long position = null;
        if (r.getStatus() == RegistrationStatus.WAITLISTED) {
            position = registrations.countByEventAndStatusAndRegistrationDateBefore(
                    r.getEvent(), RegistrationStatus.WAITLISTED, r.getRegistrationDate()) + 1;
        }
        return new RegistrationDto(r.getId(), event(r.getEvent()), r.getStatus(), r.getRegistrationDate(),
                r.getQrToken(), position, attendance.existsByRegistration(r), r.getMobileNumber(), r.getTeamName(),
                teamMembers(r));
    }

    public List<TeamMemberDto> teamMembers(Registration r) {
        return r.getTeamMembers().stream().map(m -> new TeamMemberDto(m.getName(), m.getYearOfStudy())).toList();
    }

    public AttendanceDto attendance(Attendance a) {
        Registration r = a.getRegistration();
        User s = r.getStudent();
        return new AttendanceDto(a.getId(), r.getId(), s.getName(), s.getRollNumber(), s.getDepartment(),
                r.getEvent().getId(), r.getEvent().getTitle(), a.getMarkedAt());
    }

    public ActivityPointDto point(ActivityPoint p) {
        User s = p.getStudent();
        return new ActivityPointDto(p.getId(), s.getId(), s.getName(), s.getRollNumber(),
                p.getEvent() == null ? null : p.getEvent().getId(),
                p.getEvent() == null ? null : p.getEvent().getTitle(),
                p.getType(), p.getType().label(), p.getPoints(), p.getSemester(), p.getNote(),
                p.getAwardedAt(), p.isAuto());
    }
}
