CREATE TABLE lesson_progress (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id),
    lesson_id BIGINT NOT NULL REFERENCES lesson(id),
    completed_at TIMESTAMP NOT NULL,
    UNIQUE(student_id, lesson_id)
);
