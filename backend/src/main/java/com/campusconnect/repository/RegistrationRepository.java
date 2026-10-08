package com.campusconnect.repository;

import com.campusconnect.model.Event;
import com.campusconnect.model.Registration;
import com.campusconnect.model.RegistrationStatus;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    Optional<Registration> findByStudentAndEvent(User student, Event event);
    Optional<Registration> findByQrToken(String qrToken);
    List<Registration> findByStudentOrderByRegistrationDateDesc(User student);
    List<Registration> findByEventOrderByRegistrationDateAsc(Event event);
    List<Registration> findByEventAndStatusOrderByRegistrationDateAsc(Event event, RegistrationStatus status);
    long countByEventAndStatus(Event event, RegistrationStatus status);
    long countByEventAndStatusAndRegistrationDateBefore(Event event, RegistrationStatus status, LocalDateTime before);
    List<Registration> findByStatus(RegistrationStatus status);
}
