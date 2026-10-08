package com.campusconnect.model;

/**
 * Activity point categories from the institute's Activity Point circular (21.09.2026).
 * Limits are applied per semester.
 */
public enum ActivityType {
    ORGANISING("Organising an event", 5, 10, 0, true, true,
            "Permission letter, budget, resource person, bills. Up to 10 students per event."),
    COORDINATING("Coordinating an event", 3, 10, 0, true, true,
            "Poster, certificate, invitation, publicity. Up to 10 students per event."),
    TALK("Delivering a talk", 3, 0, 2, true, true,
            "Technical events, workshops and Let's Talk. Up to 2 events."),
    PAPER("Presenting a paper", 3, 0, 2, true, true,
            "Symposiums and similar technical events. Up to 2 events."),
    PRIZE("Prize winner", 5, 0, 0, true, true,
            "Top 3 prizes in symposiums, hackathons and similar events."),
    VOLUNTEER("Student volunteer", 2, 0, 3, true, true,
            "Up to 3 events."),
    ATTENDING("Attending an event", 2, 0, 3, true, false,
            "Added automatically when your attendance is marked. Up to 3 events."),
    OFFICE_BEARER("Office bearer of the club", 3, 0, 1, false, true,
            "3 points per semester (one club)."),
    CLUB_MEMBER("Club membership", 2, 0, 1, false, true,
            "2 points per semester.");

    private final String label;
    private final int points;
    private final int perEventMax;     // 0 = no limit
    private final int perSemesterMax;  // 0 = no limit
    private final boolean eventBased;
    private final boolean manual;      // can the coordinator award it by hand?
    private final String note;

    ActivityType(String label, int points, int perEventMax, int perSemesterMax,
                 boolean eventBased, boolean manual, String note) {
        this.label = label;
        this.points = points;
        this.perEventMax = perEventMax;
        this.perSemesterMax = perSemesterMax;
        this.eventBased = eventBased;
        this.manual = manual;
        this.note = note;
    }

    public String label() { return label; }
    public int points() { return points; }
    public int perEventMax() { return perEventMax; }
    public int perSemesterMax() { return perSemesterMax; }
    public boolean eventBased() { return eventBased; }
    public boolean manual() { return manual; }
    public String note() { return note; }
}
