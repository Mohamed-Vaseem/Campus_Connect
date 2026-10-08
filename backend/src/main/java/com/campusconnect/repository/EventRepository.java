package com.campusconnect.repository;

import com.campusconnect.model.Event;
import com.campusconnect.model.EventStatus;
import com.campusconnect.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByStatusInOrderByEventDateAscStartTimeAsc(Collection<EventStatus> statuses);

    List<Event> findByOrganizerOrderByEventDateDesc(User organizer);

    List<Event> findByStatusOrderByCreatedAtAsc(EventStatus status);

    List<Event> findAllByOrderByEventDateDesc();

    /** Row lock so two students can't take the last seat at the same time. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Event e where e.id = :id")
    Optional<Event> findByIdForUpdate(@Param("id") Long id);

    List<Event> findByStatusAndEventDateAndReminderSentFalse(EventStatus status, LocalDate date);

    List<Event> findByStatusAndEventDateBefore(EventStatus status, LocalDate date);

    List<Event> findByStatusAndClosingNoticeSentFalseAndRegistrationDeadlineBetween(
            EventStatus status, LocalDateTime from, LocalDateTime to);
}
