package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "event_id"}))
@Getter @Setter @NoArgsConstructor
public class Feedback {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne(optional = false) @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false)
    private int rating;

    @Column(length = 2000)
    private String comments;

    private LocalDateTime createdAt = LocalDateTime.now();
}
