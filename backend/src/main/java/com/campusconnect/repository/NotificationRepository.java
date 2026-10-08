package com.campusconnect.repository;

import com.campusconnect.model.Notification;
import com.campusconnect.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    long countByUserAndSeenFalse(User user);

    @Modifying
    @Query("update Notification n set n.seen = true where n.user = :user and n.seen = false")
    int markAllSeen(@Param("user") User user);

    void deleteByUser(User user);
}
