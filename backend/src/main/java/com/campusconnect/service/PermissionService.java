package com.campusconnect.service;

import com.campusconnect.exception.ApiException;
import com.campusconnect.model.Event;
import com.campusconnect.model.Role;
import com.campusconnect.model.User;
import org.springframework.stereotype.Component;

/** The club coordinator (ADMIN) manages every event. Students manage nothing. */
@Component
public class PermissionService {

    public boolean canManage(User user, Event event) {
        return user != null && user.getRole() == Role.ADMIN;
    }

    public void requireManage(User user, Event event) {
        if (!canManage(user, event)) {
            throw ApiException.forbidden("Only the club coordinator can manage events");
        }
    }
}
