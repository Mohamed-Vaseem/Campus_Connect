package com.campusconnect.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One row of a team roster attached to a team-event registration. */
@Embeddable
@Getter @Setter @NoArgsConstructor
public class TeamMember {
    @Column(name = "member_name", nullable = false)
    private String name;

    @Column(name = "member_year")
    private Integer yearOfStudy;

    public TeamMember(String name, Integer yearOfStudy) {
        this.name = name;
        this.yearOfStudy = yearOfStudy;
    }
}
