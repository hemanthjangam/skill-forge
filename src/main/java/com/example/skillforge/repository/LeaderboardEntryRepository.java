package com.example.skillforge.repository;

import com.example.skillforge.entity.LeaderboardEntry;
import com.example.skillforge.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, Long> {
    Optional<LeaderboardEntry> findByUser(User user);
    Page<LeaderboardEntry> findAllByOrderByPointsDesc(Pageable pageable);
    Page<LeaderboardEntry> findAllByOrderByCurrentStreakDescBestStreakDescPointsDesc(Pageable pageable);
}
