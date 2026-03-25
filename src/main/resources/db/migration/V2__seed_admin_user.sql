INSERT INTO users (name, email, password, role, status, created_at)
VALUES (
    'System Admin',
    'admin@skillforge.local',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOqV7x1YgnPZXoqBYwygJyI072QtdgQXK',
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
