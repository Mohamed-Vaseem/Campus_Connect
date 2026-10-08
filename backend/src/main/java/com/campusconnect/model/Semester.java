package com.campusconnect.model;

import java.time.LocalDate;

/** Academic semester labels such as "2026-27 Odd" (July to December) and "2026-27 Even" (January to June). */
public final class Semester {
    private Semester() {}

    public static String of(LocalDate date) {
        boolean odd = date.getMonthValue() >= 7;
        int start = odd ? date.getYear() : date.getYear() - 1;
        return start + "-" + String.format("%02d", (start + 1) % 100) + (odd ? " Odd" : " Even");
    }

    public static String current() {
        return of(LocalDate.now());
    }
}
