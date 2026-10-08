package com.campusconnect.repository;

import com.campusconnect.model.Attendance;
import com.campusconnect.model.Event;
import com.campusconnect.model.Registration;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByRegistration(Registration registration);
    boolean existsByRegistration(Registration registration);
    List<Attendance> findByRegistration_EventOrderByMarkedAtAsc(Event event);
    long countByRegistration_Event(Event event);
    boolean existsByRegistration_StudentAndRegistration_Event(User student, Event event);
    long countByRegistration_Student(User student);
    void deleteByRegistration(Registration registration);
}
