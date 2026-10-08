package com.campusconnect.dto;

import com.campusconnect.model.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** All request/response shapes of the REST API in one place. */
public final class Dtos {
    private Dtos() {}

    // ---- auth & users ----
    public record LoginRequest(@NotBlank(message = "Enter your username") String username,
                               @NotBlank(message = "Enter your password") String password) {}

    public record RegisterAccountRequest(
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "Register number is required") String rollNumber,
            @NotBlank(message = "Password is required") @Size(min = 8, message = "Password must be at least 8 characters") String password,
            @NotBlank(message = "Please confirm your password") String confirmPassword) {}

    public record ProfileRequest(
            @NotBlank(message = "Register number is required") String rollNumber,
            @NotBlank(message = "Department is required") String department,
            @NotNull(message = "Pick your year") @Min(1) @Max(4) Integer yearOfStudy) {}

    public record UserDto(Long id, String name, String email, String rollNumber, String department,
                          Integer yearOfStudy, Role role, boolean active, boolean profileComplete,
                          LocalDateTime createdAt) {}

    public record AuthResponse(String token, UserDto user) {}
    public record ActiveRequest(boolean active) {}

    public record StudentStats(long registered, long attended, EventCategory favouriteCategory) {}

    // ---- events ----
    public record EventRequest(
            @NotBlank(message = "Title is required") String title,
            String description,
            @NotNull(message = "Pick a category") EventCategory category,
            @NotBlank(message = "Venue is required") String venue,
            @NotNull(message = "Event date is required") LocalDate eventDate,
            @NotNull(message = "Start time is required") LocalTime startTime,
            @NotNull(message = "End time is required") LocalTime endTime,
            @Min(value = 1, message = "Capacity must be at least 1") int capacity,
            @NotNull(message = "Registration deadline is required") LocalDateTime registrationDeadline,
            String posterUrl, Boolean pointsEligible, Boolean teamEvent, Integer maxTeamSize, String whatsappLink) {}

    public record EventDto(
            Long id, String title, String description, EventCategory category, String venue,
            LocalDate eventDate, LocalTime startTime, LocalTime endTime, int capacity,
            LocalDateTime registrationDeadline, EventStatus status, String posterUrl, String clubName,
            Long organizerId, String organizerName, long confirmedCount, long waitlistCount,
            Double averageRating, long feedbackCount, boolean pointsEligible, int attendPoints, boolean teamEvent,
            Integer maxTeamSize, String whatsappLink) {}

    public record AnnouncementRequest(@NotBlank String title, @NotBlank String message) {}

    // ---- registrations ----
    public record TeamMemberDto(@NotBlank(message = "Every member needs a name") String name,
                                @NotNull(message = "Every member needs a year") @Min(1) @Max(4) Integer yearOfStudy) {}

    public record RegisterRequest(
            @NotBlank(message = "Enter a mobile number") @Size(min = 10, max = 15, message = "Enter a valid mobile number") String mobileNumber,
            String teamName,
            @Valid List<TeamMemberDto> members) {}

    public record RegistrationDto(Long id, EventDto event, RegistrationStatus status,
                                  LocalDateTime registrationDate, String qrToken,
                                  Long waitlistPosition, boolean attended,
                                  String mobileNumber, String teamName, List<TeamMemberDto> teamMembers) {}

    public record RegistrantDto(Long registrationId, UserDto student, RegistrationStatus status,
                                LocalDateTime registrationDate, boolean attended, LocalDateTime attendedAt,
                                String mobileNumber, String teamName, List<TeamMemberDto> teamMembers) {}

    /** One flat row per registration across all events, used for the exported sheet. */
    public record RegistrationRow(Long registrationId, Long eventId, String eventTitle, LocalDate eventDate,
                                  Long studentId, String studentName, String rollNumber, String department,
                                  Integer yearOfStudy, String email, String mobileNumber, String teamName,
                                  String teamMembers, RegistrationStatus status,
                                  LocalDateTime registeredAt, boolean attended, LocalDateTime attendedAt) {}

    // ---- attendance ----
    public record AttendanceRequest(@NotBlank(message = "QR token is required") String qrToken) {}
    public record AttendanceDto(Long id, Long registrationId, String studentName, String rollNumber,
                                String department, Long eventId, String eventTitle, LocalDateTime markedAt) {}

    // ---- feedback ----
    public record FeedbackRequest(@Min(value = 1, message = "Rate 1 to 5") @Max(value = 5, message = "Rate 1 to 5") int rating,
                                  @Size(max = 2000) String comments) {}
    public record FeedbackDto(Long id, String studentName, int rating, String comments, LocalDateTime createdAt) {}
    public record FeedbackSummary(Double average, long count, List<FeedbackDto> items) {}

    // ---- notifications ----
    public record NotificationDto(Long id, String title, String message, NotificationType type,
                                  String link, boolean seen, LocalDateTime createdAt) {}

    // ---- activity points ----
    public record RuleDto(ActivityType type, String label, int points, String note,
                          boolean eventBased, boolean manual) {}

    public record ActivityPointDto(Long id, Long studentId, String studentName, String rollNumber,
                                   Long eventId, String eventTitle, ActivityType type, String label,
                                   int points, String semester, String note, LocalDateTime awardedAt,
                                   boolean auto) {}

    public record AwardRequest(@NotNull(message = "Pick a student") Long studentId,
                               @NotNull(message = "Pick what the points are for") ActivityType type,
                               @Size(max = 500) String note) {}

    public record SemesterAwardRequest(@NotNull(message = "Pick a student") Long studentId,
                                       @NotNull(message = "Pick a category") ActivityType type,
                                       String semester) {}

    public record TypeTotal(ActivityType type, String label, int points, long count) {}

    public record PointsSummary(String semester, int target, int semesterTotal, int lifetimeTotal,
                                List<TypeTotal> byType, List<ActivityPointDto> items) {}

    public record ReportRow(Long studentId, String name, String email, String rollNumber, String department,
                            Integer yearOfStudy, int total, boolean meetsTarget, List<TypeTotal> breakdown) {}

    public record PointsReport(String semester, int target, List<String> semesters, List<ReportRow> rows) {}

    // ---- history ----
    public record AuditDto(Long id, String actorName, String actorEmail, String action, String entityType,
                           Long entityId, String details, LocalDateTime createdAt) {}

    // ---- analytics ----
    public record CategoryStat(EventCategory category, long events, long registrations, long attendance) {}
    public record MonthStat(String month, long registrations, long attendance) {}
    public record TopEvent(Long id, String title, long registrations, long attendance) {}
    public record AnalyticsDto(long totalEvents, long totalRegistrations, long totalAttendance,
                               double attendanceRate, long totalStudents, Double averageRating,
                               long pointsAwarded, List<CategoryStat> categories,
                               List<MonthStat> monthly, List<TopEvent> topEvents) {}
}
