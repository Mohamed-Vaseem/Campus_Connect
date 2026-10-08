package com.campusconnect.config;

import com.campusconnect.model.Role;
import com.campusconnect.model.User;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Makes sure the club coordinator account exists and matches the configured credentials
 * (app.admin.username / app.admin.password, i.e. ADMIN_USERNAME / ADMIN_PASSWORD).
 * The coordinator signs in on the SAME login form as students; this special username is what
 * routes them to the admin portal instead. Only a BCrypt hash is stored, never sent to the browser.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    @Value("${app.admin.username:}")
    private String username;
    @Value("${app.admin.password:}")
    private String password;
    @Value("${app.admin.name:iTech Broadcast Coordinator}")
    private String displayName;

    @Override
    public void run(String... args) {
        if (username.isBlank() || password.isBlank()) {
            log.warn("No coordinator account configured (set ADMIN_USERNAME and ADMIN_PASSWORD).");
            return;
        }
        User admin = users.findByEmailIgnoreCase(username.trim()).orElse(null);
        if (admin == null) {
            admin = new User();
            admin.setEmail(username.trim());
            admin.setName(displayName);
            admin.setRole(Role.ADMIN);
            admin.setPassword(encoder.encode(password));
            users.save(admin);
            log.info("Club coordinator account created.");
        } else if (admin.getPassword() == null || !encoder.matches(password, admin.getPassword())) {
            admin.setPassword(encoder.encode(password));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            users.save(admin);
            log.info("Club coordinator credentials updated from configuration.");
        }
    }
}
