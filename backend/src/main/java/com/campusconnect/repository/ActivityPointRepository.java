package com.campusconnect.repository;

import com.campusconnect.model.ActivityPoint;
import com.campusconnect.model.ActivityType;
import com.campusconnect.model.Event;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityPointRepository extends JpaRepository<ActivityPoint, Long> {
    List<ActivityPoint> findByStudentOrderByAwardedAtDesc(User student);
    List<ActivityPoint> findByEventOrderByAwardedAtDesc(Event event);
    List<ActivityPoint> findBySemesterOrderByAwardedAtDesc(String semester);
    List<ActivityPoint> findAllByOrderByAwardedAtDesc();
    boolean existsByStudentAndEventAndType(User student, Event event, ActivityType type);
    boolean existsByStudentAndTypeAndSemester(User student, ActivityType type, String semester);
    long countByEventAndType(Event event, ActivityType type);
    long countByStudentAndTypeAndSemester(User student, ActivityType type, String semester);
    void deleteByStudent(User student);
}
