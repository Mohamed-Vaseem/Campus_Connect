package com.campusconnect.service;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.exception.ApiException;
import com.campusconnect.model.*;
import com.campusconnect.repository.ActivityPointRepository;
import com.campusconnect.repository.AttendanceRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/** Implements the Activity Point System: 20 points a semester, with the per-activity limits from the circular. */
@Service
@RequiredArgsConstructor
@Transactional
public class ActivityPointService {

    private final ActivityPointRepository points;
    private final UserRepository users;
    private final EventRepository events;
    private final AttendanceRepository attendance;
    private final AuditService audit;
    private final DtoMapper mapper;

    @Value("${app.points.target:20}")
    private int target;

    public List<RuleDto> rules() {
        return Arrays.stream(ActivityType.values())
                .map(t -> new RuleDto(t, t.label(), t.points(), t.note(), t.eventBased(), t.manual()))
                .toList();
    }

    // ------------------------------------------------------------------ awarding

    /** Coordinator awards points for a role at an event (organiser, volunteer, prize winner ...). */
    public ActivityPointDto awardForEvent(User by, Long eventId, AwardRequest req) {
        Event event = events.findById(eventId).orElseThrow(() -> ApiException.notFound("Event"));
        User student = student(req.studentId());
        if (!req.type().manual() || !req.type().eventBased()) {
            throw ApiException.badRequest(req.type().label() + " can't be awarded for an event by hand");
        }
        String problem = problem(student, event, req.type(), Semester.of(event.getEventDate()));
        if (problem != null) throw ApiException.conflict(problem);
        ActivityPoint p = save(by, student, event, req.type(), Semester.of(event.getEventDate()), req.note(), false);
        audit.log(by, "POINTS_AWARDED", "Event", event.getId(),
                p.getPoints() + " pts (" + req.type().label() + ") to " + student.getName() + " for " + event.getTitle());
        return mapper.point(p);
    }

    /** Coordinator awards a per-semester category (office bearer, club membership). */
    public ActivityPointDto awardForSemester(User by, SemesterAwardRequest req) {
        User student = student(req.studentId());
        if (req.type().eventBased() || !req.type().manual()) {
            throw ApiException.badRequest(req.type().label() + " is awarded for an event, not for a semester");
        }
        String semester = req.semester() == null || req.semester().isBlank() ? Semester.current() : req.semester().trim();
        String problem = problem(student, null, req.type(), semester);
        if (problem != null) throw ApiException.conflict(problem);
        ActivityPoint p = save(by, student, null, req.type(), semester, null, false);
        audit.log(by, "POINTS_AWARDED", "User", student.getId(),
                p.getPoints() + " pts (" + req.type().label() + ", " + semester + ") to " + student.getName());
        return mapper.point(p);
    }

    /**
     * Called when attendance is marked. Never throws: if a limit is reached the student simply
     * doesn't get more attendance points. (Throwing here would roll back the attendance too.)
     */
    public void autoAwardAttendance(User marker, User student, Event event) {
        if (!event.isPointsEligible()) return;
        String semester = Semester.of(event.getEventDate());
        if (problem(student, event, ActivityType.ATTENDING, semester) != null) return;
        ActivityPoint p = save(marker, student, event, ActivityType.ATTENDING, semester, null, true);
        audit.log(marker, "POINTS_AWARDED", "Event", event.getId(),
                p.getPoints() + " pts (attending) to " + student.getName() + " for " + event.getTitle());
    }

    public void remove(User by, Long pointId) {
        ActivityPoint p = points.findById(pointId).orElseThrow(() -> ApiException.notFound("Activity point entry"));
        audit.log(by, "POINTS_REMOVED", p.getEvent() != null ? "Event" : "User",
                p.getEvent() != null ? p.getEvent().getId() : p.getStudent().getId(),
                p.getPoints() + " pts (" + p.getType().label() + ") removed from " + p.getStudent().getName());
        points.delete(p);
    }

    // ------------------------------------------------------------------ reading

    @Transactional(readOnly = true)
    public PointsSummary mine(User student) {
        String semester = Semester.current();
        List<ActivityPoint> all = points.findByStudentOrderByAwardedAtDesc(student);
        List<ActivityPoint> now = all.stream().filter(p -> p.getSemester().equals(semester)).toList();
        return new PointsSummary(semester, target, sum(now), sum(all), breakdown(now),
                all.stream().map(mapper::point).toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityPointDto> forEvent(Long eventId) {
        Event event = events.findById(eventId).orElseThrow(() -> ApiException.notFound("Event"));
        return points.findByEventOrderByAwardedAtDesc(event).stream().map(mapper::point).toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityPointDto> ledger(String semester) {
        List<ActivityPoint> list = semester == null || semester.isBlank()
                ? points.findAllByOrderByAwardedAtDesc() : points.findBySemesterOrderByAwardedAtDesc(semester);
        return list.stream().map(mapper::point).toList();
    }

    /** Semester list of every student with their total, so tutors can see who has reached the target. */
    @Transactional(readOnly = true)
    public PointsReport report(String semester) {
        String sem = semester == null || semester.isBlank() ? Semester.current() : semester;
        Map<Long, List<ActivityPoint>> byStudent = points.findBySemesterOrderByAwardedAtDesc(sem).stream()
                .collect(Collectors.groupingBy(p -> p.getStudent().getId()));
        List<ReportRow> rows = users.findByRoleAndActiveTrue(Role.STUDENT).stream()
                .sorted(Comparator.comparing(u -> u.getName().toLowerCase()))
                .map(u -> {
                    List<ActivityPoint> mine = byStudent.getOrDefault(u.getId(), List.of());
                    int total = sum(mine);
                    return new ReportRow(u.getId(), u.getName(), u.getEmail(), u.getRollNumber(), u.getDepartment(),
                            u.getYearOfStudy(), total, total >= target, breakdown(mine));
                }).toList();
        TreeSet<String> semesters = new TreeSet<>(Comparator.reverseOrder());
        semesters.add(Semester.current());
        points.findAll().forEach(p -> semesters.add(p.getSemester()));
        return new PointsReport(sem, target, new ArrayList<>(semesters), rows);
    }

    // ------------------------------------------------------------------ rules

    /** Returns why the award isn't allowed, or null if it is. Never throws so callers can decide what to do. */
    private String problem(User student, Event event, ActivityType type, String semester) {
        if (type.eventBased()) {
            if (event == null) return "Pick an event";
            if (points.existsByStudentAndEventAndType(student, event, type)) {
                return student.getName() + " already has \"" + type.label() + "\" points for this event";
            }
            if (type.perEventMax() > 0 && points.countByEventAndType(event, type) >= type.perEventMax()) {
                return "At most " + type.perEventMax() + " students can get \"" + type.label() + "\" points for one event";
            }
            if (type == ActivityType.ATTENDING
                    && !attendance.existsByRegistration_StudentAndRegistration_Event(student, event)) {
                return student.getName() + " hasn't been marked present at this event";
            }
        } else if (points.existsByStudentAndTypeAndSemester(student, type, semester)) {
            return student.getName() + " already has \"" + type.label() + "\" points for " + semester;
        }
        if (type.perSemesterMax() > 0 && type.eventBased()
                && points.countByStudentAndTypeAndSemester(student, type, semester) >= type.perSemesterMax()) {
            return student.getName() + " has reached the limit of " + type.perSemesterMax()
                    + " events for \"" + type.label() + "\" in " + semester;
        }
        return null;
    }

    private ActivityPoint save(User by, User student, Event event, ActivityType type, String semester,
                               String note, boolean auto) {
        ActivityPoint p = new ActivityPoint();
        p.setStudent(student);
        p.setEvent(event);
        p.setType(type);
        p.setPoints(type.points());
        p.setSemester(semester);
        p.setNote(note == null || note.isBlank() ? null : note.trim());
        p.setAwardedBy(by);
        p.setAuto(auto);
        return points.save(p);
    }

    private User student(Long id) {
        return users.findById(id).filter(u -> u.getRole() == Role.STUDENT)
                .orElseThrow(() -> ApiException.notFound("Student"));
    }

    private int sum(List<ActivityPoint> list) {
        return list.stream().mapToInt(ActivityPoint::getPoints).sum();
    }

    private List<TypeTotal> breakdown(List<ActivityPoint> list) {
        Map<ActivityType, List<ActivityPoint>> grouped = list.stream()
                .collect(Collectors.groupingBy(ActivityPoint::getType));
        return Arrays.stream(ActivityType.values())
                .filter(grouped::containsKey)
                .map(t -> new TypeTotal(t, t.label(), sum(grouped.get(t)), grouped.get(t).size()))
                .toList();
    }
}
