package com.campusconnect.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "events")
@Getter @Setter @NoArgsConstructor
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventCategory category;

    @Column(nullable = false)
    private String venue;

    @Column(nullable = false)
    private LocalDate eventDate;
    @Column(nullable = false)
    private LocalTime startTime;
    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private int capacity;

    @Column(nullable = false)
    private LocalDateTime registrationDeadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.PUBLISHED;

    private String posterUrl;

    /** Optional WhatsApp group invite link, shown to students once they register for this event. */
    private String whatsappLink;
    private String clubName;
    /** Whether students earn activity points for attending this event. */
    private boolean pointsEligible = true;

    /** Team events collect a team name and roster at registration; solo events only collect a mobile number. */
    private boolean teamEvent;

    /** Maximum members per team, set by the coordinator when teamEvent is true. Null/ignored for solo events. */
    private Integer maxTeamSize;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organizer_id")
    private User organizer;

    private boolean reminderSent;
    private boolean closingNoticeSent;
    private LocalDateTime createdAt = LocalDateTime.now();
}
