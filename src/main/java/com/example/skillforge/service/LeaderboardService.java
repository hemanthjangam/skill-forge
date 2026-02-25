package com.example.skillforge.service;

import com.example.skillforge.dto.LeaderboardEntryResponse;
import com.example.skillforge.dto.PagedResponse;
import com.example.skillforge.entity.LeaderboardEntry;
import com.example.skillforge.entity.User;
import com.example.skillforge.repository.LeaderboardEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final LeaderboardEntryRepository leaderboardEntryRepository;

    @Transactional
    public void addPoints(User user, int points) {
        LeaderboardEntry entry = leaderboardEntryRepository.findByUser(user)
                .orElse(LeaderboardEntry.builder().user(user).points(0).build());
        entry.setPoints(entry.getPoints() + points);
        leaderboardEntryRepository.save(entry);
    }

    public PagedResponse<LeaderboardEntryResponse> getLeaderboard(int page, int size) {
        Page<LeaderboardEntry> result = leaderboardEntryRepository.findAllByOrderByPointsDesc(PageRequest.of(page, size));
        int rankStart = page * size + 1;
        return PagedResponse.<LeaderboardEntryResponse>builder()
                .content(result.getContent().stream()
                        .map(entry -> LeaderboardEntryResponse.builder()
                                .rank(rankStart + result.getContent().indexOf(entry))
                                .userId(entry.getUser().getId())
                                .userName(entry.getUser().getName())
                                .points(entry.getPoints())
                                .build())
                        .toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }
}
