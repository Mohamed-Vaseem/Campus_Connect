package com.campusconnect.security;

import com.campusconnect.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Blocks a client after 5 wrong coordinator passwords in 15 minutes. */
@Component
public class LoginThrottle {

    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private record Attempts(int count, Instant first) {}

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    public void check(String key) {
        Attempts a = attempts.get(key);
        if (a == null) return;
        if (Instant.now().isAfter(a.first().plus(WINDOW))) {
            attempts.remove(key);
        } else if (a.count() >= MAX_FAILURES) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again in a few minutes.");
        }
    }

    public void failure(String key) {
        attempts.merge(key, new Attempts(1, Instant.now()),
                (old, fresh) -> new Attempts(old.count() + 1, old.first()));
    }

    public void success(String key) {
        attempts.remove(key);
    }
}
