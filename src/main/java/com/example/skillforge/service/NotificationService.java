package com.example.skillforge.service;

import com.example.skillforge.dto.NotificationResponse;
import com.example.skillforge.dto.PagedResponse;
import com.example.skillforge.entity.Notification;
import com.example.skillforge.entity.User;
import com.example.skillforge.exception.ApiException;
import com.example.skillforge.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(User user, String message) {
        notificationRepository.save(Notification.builder()
                .user(user)
                .message(message)
                .build());
    }

    public PagedResponse<NotificationResponse> getMyNotifications(User user, int page, int size) {
        Page<Notification> result = notificationRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(page, size));
        return PagedResponse.<NotificationResponse>builder()
                .content(result.getContent().stream().map(this::toDto).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    @Transactional
    public NotificationResponse markAsRead(User user, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update this notification");
        }

        notification.setRead(true);
        return toDto(notificationRepository.save(notification));
    }

    public long unreadCount(User user) {
        return notificationRepository.countByUserAndReadIsFalse(user);
    }

    private NotificationResponse toDto(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
