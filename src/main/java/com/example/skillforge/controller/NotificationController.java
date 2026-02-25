package com.example.skillforge.controller;

import com.example.skillforge.dto.NotificationResponse;
import com.example.skillforge.dto.PagedResponse;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.NotificationService;
import com.example.skillforge.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<PagedResponse<NotificationResponse>> myNotifications(Authentication authentication,
                                                                               @RequestParam(defaultValue = "0") int page,
                                                                               @RequestParam(defaultValue = "10") int size) {
        User user = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(notificationService.getMyNotifications(user, page, size));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markRead(Authentication authentication, @PathVariable Long notificationId) {
        User user = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(notificationService.markAsRead(user, notificationId));
    }
}
