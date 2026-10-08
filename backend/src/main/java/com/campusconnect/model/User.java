package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    /** BCrypt hash for every account (students and the coordinator alike). */
    private String password;

    private LocalDateTime lastLoginAt;

    @Column(unique = true)
    private String rollNumber;

    private String department;
    private Integer yearOfStudy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STUDENT;

    private boolean active = true;
    private LocalDateTime createdAt = LocalDateTime.now();
}
