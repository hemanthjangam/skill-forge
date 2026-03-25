package com.example.skillforge.service;

import com.example.skillforge.dto.LeaderboardEntryResponse;
import com.example.skillforge.dto.PagedResponse;
import com.example.skillforge.dto.StreakBoardEntryResponse;
import com.example.skillforge.dto.StreakSummaryResponse;
import com.example.skillforge.entity.LeaderboardEntry;
import com.example.skillforge.entity.User;
import com.example.skillforge.repository.LeaderboardEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final LeaderboardEntryRepository leaderboardEntryRepository;

    /**
     * Adds leaderboard points to the user's aggregate score.
     */
    @Transactional
    public void addPoints(User user, int points) {
        LeaderboardEntry entry = getOrCreateEntry(user);
        int currentPoints = entry.getPoints() == null ? 0 : entry.getPoints();
        entry.setPoints(currentPoints + points);
        leaderboardEntryRepository.save(entry);
    }

    /**
     * Updates streak statistics after a student completes a knowledge check on a given day.
     */
    @Transactional
    public void recordKnowledgeCheck(User user) {
        LocalDate today = LocalDate.now();
        LeaderboardEntry entry = getOrCreateEntry(user);

        LocalDate lastActiveDate = entry.getLastActiveDate();
        int currentStreak = entry.getCurrentStreak() == null ? 0 : entry.getCurrentStreak();
        if (lastActiveDate == null) {
            currentStreak = 1;
        } else if (lastActiveDate.isEqual(today.minusDays(1))) {
            currentStreak = currentStreak + 1;
        } else if (!lastActiveDate.isEqual(today)) {
            currentStreak = 1;
        }

        entry.setCurrentStreak(currentStreak);
        entry.setBestStreak(Math.max(entry.getBestStreak() == null ? 0 : entry.getBestStreak(), currentStreak));
        entry.setLastActiveDate(today);
        entry.setTotalKnowledgeChecks((entry.getTotalKnowledgeChecks() == null ? 0 : entry.getTotalKnowledgeChecks()) + 1);
        leaderboardEntryRepository.save(entry);
    }

    /**
     * Returns the current user's streak and points summary.
     */
    public StreakSummaryResponse getStreakSummary(User user) {
        LeaderboardEntry entry = getOrCreateEntry(user);

        return StreakSummaryResponse.builder()
                .userId(user.getId())
                .userName(user.getName())
                .currentStreak(entry.getCurrentStreak() == null ? 0 : entry.getCurrentStreak())
                .bestStreak(entry.getBestStreak() == null ? 0 : entry.getBestStreak())
                .totalKnowledgeChecks(entry.getTotalKnowledgeChecks() == null ? 0 : entry.getTotalKnowledgeChecks())
                .points(entry.getPoints() == null ? 0 : entry.getPoints())
                .lastActiveDate(entry.getLastActiveDate())
                .build();
    }

    /**
     * Returns the global points leaderboard with deterministic paging-based ranks.
     */
    public PagedResponse<LeaderboardEntryResponse> getLeaderboard(int page, int size) {
        Page<LeaderboardEntry> result = leaderboardEntryRepository.findAllByOrderByPointsDesc(PageRequest.of(page, size));
        int rankStart = page * size + 1;
        return PagedResponse.<LeaderboardEntryResponse>builder()
                .content(buildLeaderboardPage(result, rankStart))
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    /**
     * Returns the streak leaderboard ordered by current streak, best streak, and points.
     */
    public PagedResponse<StreakBoardEntryResponse> getStreakBoard(int page, int size) {
        Page<LeaderboardEntry> result = leaderboardEntryRepository
                .findAllByOrderByCurrentStreakDescBestStreakDescPointsDesc(PageRequest.of(page, size));
        int rankStart = page * size + 1;
        return PagedResponse.<StreakBoardEntryResponse>builder()
                .content(buildStreakPage(result, rankStart))
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    /**
     * Creates a default leaderboard entry in memory when a user has not accumulated activity yet.
     */
    private LeaderboardEntry getOrCreateEntry(User user) {
        return leaderboardEntryRepository.findByUser(user)
                .orElse(LeaderboardEntry.builder()
                        .user(user)
                        .points(0)
                        .currentStreak(0)
                        .bestStreak(0)
                        .totalKnowledgeChecks(0)
                        .build());
    }

    /**
     * Maps a leaderboard result page to API DTOs while preserving stable ranks.
     */
    private java.util.List<LeaderboardEntryResponse> buildLeaderboardPage(Page<LeaderboardEntry> result, int rankStart) {
        java.util.List<LeaderboardEntry> entries = result.getContent();
        java.util.List<LeaderboardEntryResponse> responses = new java.util.ArrayList<>(entries.size());
        for (int index = 0; index < entries.size(); index++) {
            LeaderboardEntry entry = entries.get(index);
            responses.add(LeaderboardEntryResponse.builder()
                    .rank(rankStart + index)
                    .userId(entry.getUser().getId())
                    .userName(entry.getUser().getName())
                    .points(entry.getPoints())
                    .build());
        }
        return responses;
    }

    /**
     * Maps streak leaderboard entries to API DTOs while preserving stable ranks.
     */
    private java.util.List<StreakBoardEntryResponse> buildStreakPage(Page<LeaderboardEntry> result, int rankStart) {
        java.util.List<LeaderboardEntry> entries = result.getContent();
        java.util.List<StreakBoardEntryResponse> responses = new java.util.ArrayList<>(entries.size());
        for (int index = 0; index < entries.size(); index++) {
            LeaderboardEntry entry = entries.get(index);
            responses.add(StreakBoardEntryResponse.builder()
                    .rank(rankStart + index)
                    .userId(entry.getUser().getId())
                    .userName(entry.getUser().getName())
                    .currentStreak(entry.getCurrentStreak() == null ? 0 : entry.getCurrentStreak())
                    .bestStreak(entry.getBestStreak() == null ? 0 : entry.getBestStreak())
                    .totalKnowledgeChecks(entry.getTotalKnowledgeChecks() == null ? 0 : entry.getTotalKnowledgeChecks())
                    .points(entry.getPoints() == null ? 0 : entry.getPoints())
                    .build());
        }
        return responses;
    }
}
