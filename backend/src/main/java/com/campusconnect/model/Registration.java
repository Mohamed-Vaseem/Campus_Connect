package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "registrations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "event_id"}))
@Getter @Setter @NoArgsConstructor
public class Registration {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne(optional = false) @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false)
    private LocalDateTime registrationDate = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status = RegistrationStatus.CONFIRMED;

    @Column(nullable = false, unique = true)
    private String qrToken;

    /** Contact number, collected for every registration (team or solo). */
    @Column(nullable = false)
    private String mobileNumber;

    /** Set only when the event is a team event. */
    private String teamName;

    @ElementCollection
    @CollectionTable(name = "registration_team_members", joinColumns = @JoinColumn(name = "registration_id"))
    private List<TeamMember> teamMembers = new ArrayList<>();
}
