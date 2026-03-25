ALTER TABLE leaderboard_entry 
ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_active_date DATE,
ADD COLUMN total_knowledge_checks INTEGER NOT NULL DEFAULT 0;
