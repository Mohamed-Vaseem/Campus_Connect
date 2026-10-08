package com.campusconnect.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MailService {

    private final ObjectProvider<JavaMailSender> sender;
    private final boolean enabled;
    private final String from;

    public MailService(ObjectProvider<JavaMailSender> sender,
                       @Value("${app.mail.enabled:false}") boolean enabled,
                       @Value("${app.mail.from:no-reply@campusconnect.local}") String from) {
        this.sender = sender;
        this.enabled = enabled;
        this.from = from;
    }

    @Async
    public void send(String to, String subject, String body) {
        if (!enabled) {
            log.info("[mail disabled] to={} subject={}", to, subject);
            return;
        }
        JavaMailSender mailSender = sender.getIfAvailable();
        if (mailSender == null) {
            log.warn("Mail is enabled but no SMTP host is configured (spring.mail.host)");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Could not send mail to {}: {}", to, ex.getMessage());
        }
    }
}
