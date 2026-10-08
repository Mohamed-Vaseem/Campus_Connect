package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One line in the activity point ledger. Rows are never edited, only added or removed by the coordinator. */
@Entity
@Table(name = "activity_points")
@Getter @Setter @NoArgsConstructor
public class ActivityPoint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "student_id")
    private User student;

    /** Null for semester-level points such as office bearer or club membership. */
    @ManyToOne @JoinColumn(name = "event_id")
    private Event event;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType type;

    @Column(nullable = false)
    private int points;

    @Column(nullable = false)
    private String semester;

    @Column(length = 500)
    private String note;

    @ManyToOne @JoinColumn(name = "awarded_by")
    private User awardedBy;

    private boolean auto;
    private LocalDateTime awardedAt = LocalDateTime.now();
}
