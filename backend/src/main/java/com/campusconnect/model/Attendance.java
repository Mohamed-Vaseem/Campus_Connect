package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Getter @Setter @NoArgsConstructor
public class Attendance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false) @JoinColumn(name = "registration_id", unique = true)
    private Registration registration;

    @Column(nullable = false)
    private LocalDateTime markedAt = LocalDateTime.now();

    @ManyToOne @JoinColumn(name = "marked_by")
    private User markedBy;
}
