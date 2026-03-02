-- Terra Echo Labs — SQLite Schema
-- Version: 0.1.0
-- Run: python3.11 database/db.py  (creates tel_music.db)

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Users
-- Single-user app for v1.0; table exists for future multi-profile support.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL DEFAULT 'Will',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Genre DNA Profiles
-- Stores personalization data from the onboarding quiz and learned preferences.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre           TEXT    NOT NULL,           -- e.g. "Lo-Fi Hip Hop"
    tempo_range     TEXT,                        -- e.g. "70-90"
    mood_tags       TEXT,                        -- JSON array: ["chill","dark"]
    fav_keys        TEXT,                        -- JSON array: ["Cm","Fm"]
    fav_scales      TEXT,                        -- JSON array: ["minor","dorian"]
    complexity      INTEGER DEFAULT 2,           -- 1=simple, 3=complex
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Chord Progressions
-- Saved progressions from the MIDI Chord Engine or AI Generator.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progressions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT    NOT NULL DEFAULT 'Untitled Progression',
    chords          TEXT    NOT NULL,            -- JSON array: ["Cm","Fm","Ab","Bb"]
    key             TEXT,                        -- e.g. "C"
    scale           TEXT,                        -- e.g. "minor"
    genre           TEXT,
    tempo           INTEGER,                     -- BPM
    time_signature  TEXT    DEFAULT '4/4',
    source          TEXT    DEFAULT 'manual',    -- 'manual' | 'ai' | 'midi_engine'
    midi_path       TEXT,                        -- path to exported .mid file
    notes           TEXT,                        -- freeform user notes
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Ratings
-- User star ratings (1–5) on saved progressions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    progression_id  INTEGER NOT NULL REFERENCES progressions(id) ON DELETE CASCADE,
    stars           INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    rated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Daily Tips
-- Pre-loaded and AI-generated daily music production tips.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tips (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    content     TEXT    NOT NULL,
    category    TEXT    DEFAULT 'general',       -- 'midi'|'theory'|'mixing'|'general'
    genre       TEXT,                            -- NULL = universal
    shown_at    TEXT,                            -- NULL = not yet shown
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Daily Challenges
-- Creative challenges shown one per day.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    difficulty      TEXT    DEFAULT 'medium',    -- 'easy'|'medium'|'hard'
    genre           TEXT,                        -- NULL = universal
    completed       INTEGER DEFAULT 0,           -- 0=false, 1=true
    shown_at        TEXT,
    completed_at    TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Sessions
-- Session Starter entries — mood-to-session mappings.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood            TEXT    NOT NULL,            -- e.g. "melancholic"
    genre           TEXT,
    tempo           INTEGER,
    key             TEXT,
    scale           TEXT,
    progression_id  INTEGER REFERENCES progressions(id) ON DELETE SET NULL,
    daw             TEXT    DEFAULT 'Logic Pro', -- 'Logic Pro'|'Ableton Live'
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_progressions_user    ON progressions(user_id);
CREATE INDEX IF NOT EXISTS idx_progressions_genre   ON progressions(genre);
CREATE INDEX IF NOT EXISTS idx_profiles_user        ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user        ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tips_shown           ON tips(shown_at);
CREATE INDEX IF NOT EXISTS idx_challenges_shown     ON challenges(shown_at);
