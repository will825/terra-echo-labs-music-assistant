"""
Terra Echo Labs — Genre DNA Profile Manager (Sprint 2)
Manages user profiles/preferences stored in the SQLite `profiles` table.
Also provides the onboarding quiz question definitions.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from database.db import get_connection

# ---------------------------------------------------------------------------
# Onboarding quiz — returned to the frontend on first launch
# ---------------------------------------------------------------------------

ONBOARDING_QUESTIONS: list[dict[str, Any]] = [
    {
        "id": "genre",
        "question": "What genre(s) do you produce most?",
        "type": "multiselect",
        "options": [
            "Lo-Fi Hip Hop", "Trap", "Drill", "Boom Bap", "R&B",
            "Neo-Soul", "Jazz", "House", "Ambient", "Pop", "Other",
        ],
    },
    {
        "id": "mood_tags",
        "question": "What mood(s) best describe your sound?",
        "type": "multiselect",
        "options": [
            "chill", "dark", "uplifting", "melancholic",
            "energetic", "mysterious", "romantic", "aggressive",
        ],
    },
    {
        "id": "fav_keys",
        "question": "Do you have favourite keys you work in?",
        "type": "multiselect",
        "options": ["C", "Cm", "D", "Dm", "F", "Fm", "G", "Gm", "A", "Am", "Bb", "Bbm", "No preference"],
    },
    {
        "id": "fav_scales",
        "question": "Which scales do you use most?",
        "type": "multiselect",
        "options": ["minor", "major", "dorian", "phrygian", "lydian", "mixolydian", "minor pentatonic", "blues"],
    },
    {
        "id": "tempo_range",
        "question": "What is your typical tempo range (BPM)?",
        "type": "select",
        "options": ["60-80", "80-100", "100-120", "120-140", "140-160", "160+"],
    },
    {
        "id": "complexity",
        "question": "How complex do you like your chord progressions?",
        "type": "select",
        "options": ["Simple (triads, basic chords)", "Moderate (7ths and 9ths)", "Complex (extensions, alterations)"],
        "values": [1, 2, 3],
    },
    {
        "id": "daw",
        "question": "Which DAW do you primarily use?",
        "type": "select",
        "options": ["Logic Pro", "Ableton Live", "Both"],
    },
]


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------

def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    """Convert a sqlite3.Row to a plain dict, parsing JSON fields."""
    d = dict(row)
    for field in ("mood_tags", "fav_keys", "fav_scales"):
        raw = d.get(field)
        if raw and isinstance(raw, str):
            try:
                d[field] = json.loads(raw)
            except json.JSONDecodeError:
                d[field] = []
    return d


def get_profile(user_id: int = 1) -> dict[str, Any] | None:
    """Return the first (most recently updated) profile for a user, or None."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM profiles WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
            (user_id,),
        ).fetchone()
        return _row_to_dict(row) if row else None
    finally:
        conn.close()


def get_all_profiles(user_id: int = 1) -> list[dict[str, Any]]:
    """Return all profiles for a user."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM profiles WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
        return [_row_to_dict(r) for r in rows]
    finally:
        conn.close()


def upsert_profile(
    user_id: int = 1,
    genre: str = "Lo-Fi Hip Hop",
    tempo_range: str = "70-90",
    mood_tags: list[str] | None = None,
    fav_keys: list[str] | None = None,
    fav_scales: list[str] | None = None,
    complexity: int = 2,
    profile_id: int | None = None,
) -> dict[str, Any]:
    """
    Insert a new profile row or update an existing one if profile_id is provided.
    Returns the saved profile as a dict.
    """
    mood_tags_json = json.dumps(mood_tags or [])
    fav_keys_json = json.dumps(fav_keys or [])
    fav_scales_json = json.dumps(fav_scales or [])

    conn = get_connection()
    try:
        if profile_id:
            conn.execute(
                """UPDATE profiles
                   SET genre=?, tempo_range=?, mood_tags=?, fav_keys=?,
                       fav_scales=?, complexity=?, updated_at=datetime('now')
                   WHERE id=? AND user_id=?""",
                (genre, tempo_range, mood_tags_json, fav_keys_json,
                 fav_scales_json, complexity, profile_id, user_id),
            )
            conn.commit()
            row = conn.execute(
                "SELECT * FROM profiles WHERE id=?", (profile_id,)
            ).fetchone()
        else:
            cur = conn.execute(
                """INSERT INTO profiles
                   (user_id, genre, tempo_range, mood_tags, fav_keys, fav_scales, complexity)
                   VALUES (?,?,?,?,?,?,?)""",
                (user_id, genre, tempo_range, mood_tags_json,
                 fav_keys_json, fav_scales_json, complexity),
            )
            conn.commit()
            row = conn.execute(
                "SELECT * FROM profiles WHERE id=?", (cur.lastrowid,)
            ).fetchone()
        return _row_to_dict(row)
    finally:
        conn.close()


def delete_profile(profile_id: int, user_id: int = 1) -> bool:
    """Delete a profile. Returns True if a row was deleted."""
    conn = get_connection()
    try:
        cur = conn.execute(
            "DELETE FROM profiles WHERE id=? AND user_id=?", (profile_id, user_id)
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Onboarding helpers
# ---------------------------------------------------------------------------

def has_profile(user_id: int = 1) -> bool:
    """Return True if the user already has at least one profile saved."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT COUNT(*) FROM profiles WHERE user_id=?", (user_id,)
        ).fetchone()
        return row[0] > 0
    finally:
        conn.close()


def get_quiz_questions() -> list[dict[str, Any]]:
    """Return the onboarding quiz questions for the frontend."""
    return ONBOARDING_QUESTIONS


# ---------------------------------------------------------------------------
# Saved Progressions (used by Generator page to save AI results)
# ---------------------------------------------------------------------------

def save_progression(
    user_id: int = 1,
    title: str = "Untitled Progression",
    chords: list[str] | None = None,
    key: str = "",
    scale: str = "",
    genre: str = "",
    tempo: int = 80,
    source: str = "ai",
    midi_path: str = "",
    notes: str = "",
) -> dict[str, Any]:
    """Save a progression to the database and return the saved row."""
    chords_json = json.dumps(chords or [])
    conn = get_connection()
    try:
        cur = conn.execute(
            """INSERT INTO progressions
               (user_id, title, chords, key, scale, genre, tempo, source, midi_path, notes)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (user_id, title, chords_json, key, scale, genre, tempo, source, midi_path, notes),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM progressions WHERE id=?", (cur.lastrowid,)
        ).fetchone()
        d = dict(row)
        if d.get("chords") and isinstance(d["chords"], str):
            d["chords"] = json.loads(d["chords"])
        return d
    finally:
        conn.close()


def get_saved_progressions(user_id: int = 1, limit: int = 50) -> list[dict[str, Any]]:
    """Return saved progressions for a user, newest first."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM progressions WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
        results = []
        for row in rows:
            d = dict(row)
            if d.get("chords") and isinstance(d["chords"], str):
                try:
                    d["chords"] = json.loads(d["chords"])
                except json.JSONDecodeError:
                    pass
            results.append(d)
        return results
    finally:
        conn.close()
