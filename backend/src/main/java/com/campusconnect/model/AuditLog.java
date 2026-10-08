package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Permanent history of who did what. Stores names as text so history survives changes to users. */
@Entity
@Table(name = "audit_log")
@Getter @Setter @NoArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actorName;
    private String actorEmail;

    @Column(nullable = false)
    private String action;

    private String entityType;
    private Long entityId;

    @Column(length = 500)
    private String details;

    private LocalDateTime createdAt = LocalDateTime.now();
}
