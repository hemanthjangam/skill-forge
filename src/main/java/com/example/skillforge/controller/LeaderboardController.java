package com.example.skillforge.controller;

import com.example.skillforge.dto.LeaderboardEntryResponse;
import com.example.skillforge.dto.PagedResponse;
import com.example.skillforge.dto.StreakBoardEntryResponse;
import com.example.skillforge.dto.StreakSummaryResponse;
import com.example.skillforge.entity.User;
import com.example.skillforge.service.LeaderboardService;
import com.example.skillforge.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final UserService userService;

    /**
     * Returns the global points leaderboard.
     */
    @GetMapping
    public ResponseEntity<PagedResponse<LeaderboardEntryResponse>> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(page, size));
    }

    /**
     * Returns the global streak leaderboard.
     */
    @GetMapping("/streaks")
    public ResponseEntity<PagedResponse<StreakBoardEntryResponse>> streakBoard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(leaderboardService.getStreakBoard(page, size));
    }

    /**
     * Returns the authenticated user's streak summary.
     */
    @GetMapping("/streaks/me")
    public ResponseEntity<StreakSummaryResponse> myStreak(Authentication authentication) {
        User user = userService.getRequiredUserByEmail(authentication.getName());
        return ResponseEntity.ok(leaderboardService.getStreakSummary(user));
    }
}
