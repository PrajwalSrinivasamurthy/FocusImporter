CREATE TABLE IF NOT EXISTS dashboard_users (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    project       TEXT NOT NULL,
    permissions   TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focus_conversion_history (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES dashboard_users(id),
    job_id            VARCHAR(64) NOT NULL,
    source_file       TEXT NOT NULL,
    output_files      TEXT NOT NULL,
    issue_count       INTEGER NOT NULL DEFAULT 0,
    issues_overridden BOOLEAN NOT NULL DEFAULT FALSE,
    status            VARCHAR(30) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_focus_conversion_history_user_id
    ON focus_conversion_history(user_id);

-- Seed admin user (password: admin)
INSERT INTO dashboard_users (email, password_hash, project, permissions)
VALUES ('admin@email.com', '$2b$10$aw1W3mirlxs6JaAc1JaL3.AOO8eMymYwjb5pZQOFsE0pJ20tQezM.', 'focusimporter', 'admin')
ON CONFLICT (email) DO NOTHING;
