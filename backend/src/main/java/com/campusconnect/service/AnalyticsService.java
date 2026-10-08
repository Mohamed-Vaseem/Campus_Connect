package com.campusconnect.service;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("MMM yy", Locale.ENGLISH);

    private final EventRepository events;
    private final RegistrationRepository registrations;
    private final AttendanceRepository attendance;
    private final FeedbackRepository feedback;
    private final UserRepository users;
    private final ActivityPointRepository points;

    public AnalyticsDto overview() {
        List<Event> mine = events.findAllByOrderByEventDateDesc().stream()
                .filter(e -> e.getStatus() == EventStatus.PUBLISHED || e.getStatus() == EventStatus.COMPLETED)
                .toList();
        Set<Long> ids = mine.stream().map(Event::getId).collect(Collectors.toSet());

        List<Registration> regs = registrations.findAll().stream()
                .filter(r -> ids.contains(r.getEvent().getId()) && r.getStatus() == RegistrationStatus.CONFIRMED)
                .toList();
        List<Attendance> atts = attendance.findAll().stream()
                .filter(a -> ids.contains(a.getRegistration().getEvent().getId()))
                .toList();

        Map<Long, Long> regByEvent = regs.stream()
                .collect(Collectors.groupingBy(r -> r.getEvent().getId(), Collectors.counting()));
        Map<Long, Long> attByEvent = atts.stream()
                .collect(Collectors.groupingBy(a -> a.getRegistration().getEvent().getId(), Collectors.counting()));

        LocalDate today = LocalDate.now();
        long pastConfirmed = mine.stream().filter(e -> !e.getEventDate().isAfter(today))
                .mapToLong(e -> regByEvent.getOrDefault(e.getId(), 0L)).sum();
        double rate = pastConfirmed == 0 ? 0 : Math.round(atts.size() * 1000.0 / pastConfirmed) / 10.0;

        List<CategoryStat> categories = Arrays.stream(EventCategory.values()).map(cat -> {
            List<Event> inCat = mine.stream().filter(e -> e.getCategory() == cat).toList();
            return new CategoryStat(cat, inCat.size(),
                    inCat.stream().mapToLong(e -> regByEvent.getOrDefault(e.getId(), 0L)).sum(),
                    inCat.stream().mapToLong(e -> attByEvent.getOrDefault(e.getId(), 0L)).sum());
        }).filter(c -> c.events() > 0).toList();

        YearMonth thisMonth = YearMonth.now();
        Map<YearMonth, Long> regMonths = regs.stream()
                .collect(Collectors.groupingBy(r -> YearMonth.from(r.getRegistrationDate()), Collectors.counting()));
        Map<YearMonth, Long> attMonths = atts.stream()
                .collect(Collectors.groupingBy(a -> YearMonth.from(a.getMarkedAt()), Collectors.counting()));
        List<MonthStat> monthly = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = thisMonth.minusMonths(i);
            monthly.add(new MonthStat(ym.format(MONTH), regMonths.getOrDefault(ym, 0L), attMonths.getOrDefault(ym, 0L)));
        }

        List<TopEvent> top = mine.stream()
                .map(e -> new TopEvent(e.getId(), e.getTitle(), regByEvent.getOrDefault(e.getId(), 0L),
                        attByEvent.getOrDefault(e.getId(), 0L)))
                .sorted(Comparator.comparingLong(TopEvent::registrations).reversed())
                .limit(5).toList();

        double[] ratings = mine.stream().map(feedback::averageRating).filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue).toArray();
        Double avgRating = ratings.length == 0 ? null
                : Math.round(Arrays.stream(ratings).average().orElse(0) * 10.0) / 10.0;

        long pointsAwarded = points.findAll().stream().mapToLong(ActivityPoint::getPoints).sum();

        return new AnalyticsDto(mine.size(), regs.size(), atts.size(), rate,
                users.findByRoleAndActiveTrue(Role.STUDENT).size(), avgRating, pointsAwarded,
                categories, monthly, top);
    }
}
