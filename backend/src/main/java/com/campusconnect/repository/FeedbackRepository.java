package com.campusconnect.repository;

import com.campusconnect.model.Event;
import com.campusconnect.model.Feedback;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByEventOrderByCreatedAtDesc(Event event);
    Optional<Feedback> findByStudentAndEvent(User student, Event event);
    long countByEvent(Event event);

    @Query("select avg(f.rating) from Feedback f where f.event = :event")
    Double averageRating(@Param("event") Event event);

    void deleteByStudent(User student);
}
