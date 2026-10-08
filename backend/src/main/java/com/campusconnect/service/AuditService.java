package com.campusconnect.service;

import com.campusconnect.dto.Dtos.AuditDto;
import com.campusconnect.model.AuditLog;
import com.campusconnect.model.User;
import com.campusconnect.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditService {

    private final AuditLogRepository repo;

    /** Records an action. {@code actor} may be null for things nobody is signed in for (e.g. a failed login). */
    public void log(User actor, String action, String entityType, Long entityId, String details) {
        AuditLog entry = new AuditLog();
        if (actor != null) {
            entry.setActorName(actor.getName());
            entry.setActorEmail(actor.getEmail());
        }
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetails(details != null && details.length() > 500 ? details.substring(0, 500) : details);
        repo.save(entry);
    }

    @Transactional(readOnly = true)
    public List<AuditDto> recent(int limit) {
        return repo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(Math.max(limit, 1), 2000))).stream()
                .map(a -> new AuditDto(a.getId(), a.getActorName(), a.getActorEmail(), a.getAction(),
                        a.getEntityType(), a.getEntityId(), a.getDetails(), a.getCreatedAt()))
                .toList();
    }
}
