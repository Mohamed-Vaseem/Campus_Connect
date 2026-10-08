package com.campusconnect.service;

import com.campusconnect.dto.Dtos.NotificationDto;
import com.campusconnect.exception.ApiException;
import com.campusconnect.model.Notification;
import com.campusconnect.model.NotificationType;
import com.campusconnect.model.User;
import com.campusconnect.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository repo;
    private final MailService mail;

    /** Saves an in-app notification and optionally emails the same content. */
    public void notify(User user, String title, String message, NotificationType type, String link, boolean email) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setLink(link);
        repo.save(n);
        if (email) {
            mail.send(user.getEmail(), "CampusConnect: " + title, "Hi " + user.getName() + ",\n\n" + message
                    + "\n\n- CampusConnect");
        }
    }

    public void notifyAll(Collection<User> users, String title, String message,
                          NotificationType type, String link, boolean email) {
        users.forEach(u -> notify(u, title, message, type, link, email));
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> latest(User user) {
        return repo.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, 50)).stream()
                .map(n -> new NotificationDto(n.getId(), n.getTitle(), n.getMessage(), n.getType(),
                        n.getLink(), n.isSeen(), n.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(User user) {
        return repo.countByUserAndSeenFalse(user);
    }

    public void markSeen(User user, Long id) {
        Notification n = repo.findById(id).orElseThrow(() -> ApiException.notFound("Notification"));
        if (!n.getUser().getId().equals(user.getId())) throw ApiException.forbidden("Not your notification");
        n.setSeen(true);
    }

    public void markAllSeen(User user) {
        repo.markAllSeen(user);
    }
}
