"""
Terra Echo Labs — Database bootstrap and session factory.
Run directly to create/reset the database: python3.11 database/db.py
"""

import os
import sqlite3
from pathlib import Path

# Database lives in the project root, excluded from git by .gitignore
DB_PATH = Path(__file__).parent.parent / "tel_music.db"
SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def get_connection() -> sqlite3.Connection:
    """Return a database connection with row_factory set for dict-style access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Apply schema.sql to create all tables and indexes if they don't exist."""
    schema = SCHEMA_PATH.read_text()
    conn = get_connection()
    try:
        conn.executescript(schema)
        conn.commit()
        print(f"Database initialized: {DB_PATH}")
        _seed_default_user(conn)
    finally:
        conn.close()


def _seed_default_user(conn: sqlite3.Connection) -> None:
    """Insert the default user if the users table is empty."""
    row = conn.execute("SELECT COUNT(*) FROM users").fetchone()
    if row[0] == 0:
        conn.execute("INSERT INTO users (name) VALUES (?)", ("Will",))
        conn.commit()
        print("Default user 'Will' created.")


if __name__ == "__main__":
    init_db()
    # Quick verification
    conn = get_connection()
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    print("Tables:", [t["name"] for t in tables])
    conn.close()
