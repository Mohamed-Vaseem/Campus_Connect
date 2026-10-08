package com.campusconnect.repository;

import com.campusconnect.model.Role;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByRollNumber(String rollNumber);
    boolean existsByRollNumberIgnoreCaseAndIdNot(String rollNumber, Long id);
    List<User> findByRoleAndActiveTrue(Role role);
    List<User> findAllByOrderByCreatedAtDesc();
}
