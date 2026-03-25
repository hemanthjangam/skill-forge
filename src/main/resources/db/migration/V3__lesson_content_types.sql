ALTER TABLE lesson
    ADD COLUMN IF NOT EXISTS content_type VARCHAR(50);

ALTER TABLE lesson
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);

ALTER TABLE lesson
    ADD COLUMN IF NOT EXISTS video_url VARCHAR(1000);

UPDATE lesson
SET content_type = 'TEXT'
WHERE content_type IS NULL;
