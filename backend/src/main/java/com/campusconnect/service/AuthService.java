package com.campusconnect.service;

import com.campusconnect.dto.Dtos.*;
import com.campusconnect.exception.ApiException;
import com.campusconnect.model.Role;
import com.campusconnect.model.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import com.campusconnect.security.LoginThrottle;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final DtoMapper mapper;
    private final LoginThrottle throttle;
    private final AuditService audit;

    /** Optional: only accept sign-ups from this email domain, e.g. "college.edu". Blank = allow any. */
    @Value("${app.allowed-email-domain:}")
    private String allowedDomain;

    /** Anyone can create a student account. The club coordinator account is seeded separately (see AdminBootstrap). */
    public AuthResponse register(RegisterAccountRequest req) {
        if (!req.password().equals(req.confirmPassword())) {
            throw ApiException.badRequest("Passwords don't match");
        }
        String email = req.email().trim().toLowerCase();
        if (!allowedDomain.isBlank() && !email.endsWith("@" + allowedDomain.toLowerCase())) {
            throw ApiException.badRequest("Please use your college email (@" + allowedDomain + ")");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists. Try signing in instead.");
        }
        String roll = req.rollNumber().trim().toUpperCase();
        if (users.existsByRollNumber(roll)) {
            throw ApiException.conflict("That register number is already registered to another account");
        }
        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(req.password()));
        u.setRollNumber(roll);
        u.setRole(Role.STUDENT);
        u.setLastLoginAt(LocalDateTime.now());
        users.save(u);
        audit.log(u, "STUDENT_JOINED", "User", u.getId(), "Account created");
        return new AuthResponse(jwt.generate(u), mapper.user(u));
    }

    /**
     * One login form for everyone. The special coordinator username/password (see application.yml)
     * signs in as the club coordinator; any other matching email/password signs in as that student.
     * The same error is thrown for every failure so nothing about which accounts exist leaks.
     */
    public AuthResponse login(LoginRequest req, String clientKey) {
        throttle.check(clientKey);
        String username = req.username().trim();
        User account = users.findByEmailIgnoreCase(username).orElse(null);
        boolean ok = account != null && account.isActive() && account.getPassword() != null
                && encoder.matches(req.password(), account.getPassword());
        if (account == null) {
            encoder.matches(req.password(), dummyHash()); // keep the timing similar for unknown usernames
        }
        if (!ok) {
            throttle.failure(clientKey);
            audit.log(null, "LOGIN_FAILED", "User", null, "Failed sign-in for " + username);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect username or password");
        }
        throttle.success(clientKey);
        account.setLastLoginAt(LocalDateTime.now());
        users.save(account);
        audit.log(account, account.getRole() == Role.ADMIN ? "ADMIN_LOGIN" : "LOGIN", "User", account.getId(), "Signed in");
        return new AuthResponse(jwt.generate(account), mapper.user(account));
    }

    public UserDto updateProfile(User current, ProfileRequest req) {
        User user = users.findById(current.getId()).orElseThrow(() -> ApiException.notFound("User"));
        String roll = req.rollNumber().trim().toUpperCase();
        if (users.existsByRollNumberIgnoreCaseAndIdNot(roll, user.getId())) {
            throw ApiException.conflict("That register number is already registered to another account");
        }
        user.setRollNumber(roll);
        user.setDepartment(req.department().trim());
        user.setYearOfStudy(req.yearOfStudy());
        users.save(user);
        audit.log(user, "PROFILE_UPDATED", "User", user.getId(), "Roll " + roll + ", " + user.getDepartment() + ", year " + user.getYearOfStudy());
        return mapper.user(user);
    }

    private volatile String dummyHash;

    /** A real BCrypt hash of a throwaway string, only used to spend the same time on unknown usernames. */
    private String dummyHash() {
        if (dummyHash == null) dummyHash = encoder.encode("not-a-real-password");
        return dummyHash;
    }
}
