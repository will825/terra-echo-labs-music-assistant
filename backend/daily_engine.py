"""
Terra Echo Labs — Daily Creative Engine (Sprint 4)
Provides: chord of the day, daily tip, creative prompt, daily challenge.
All content is curated — no external API calls needed.
Tips and challenges are seeded into SQLite on first run and rotated daily.
"""

from __future__ import annotations

import datetime
import json
from typing import Any

from database.db import get_connection

# ---------------------------------------------------------------------------
# Chord of the Day — 28 interesting chords, cycles by day-of-year
# ---------------------------------------------------------------------------

CHORDS_OF_THE_DAY: list[dict[str, Any]] = [
    {"name": "Cmaj7",   "notes": ["C", "E", "G", "B"],          "quality": "Major 7th",          "vibe": "Dreamy, sophisticated, warm"},
    {"name": "Am9",     "notes": ["A", "C", "E", "G", "B"],     "quality": "Minor 9th",           "vibe": "Melancholic, deep, neo-soul"},
    {"name": "Dm7♭5",  "notes": ["D", "F", "A♭", "C"],         "quality": "Half-diminished",     "vibe": "Tense, jazzy, mysterious"},
    {"name": "Fmaj9",   "notes": ["F", "A", "C", "E", "G"],     "quality": "Major 9th",           "vibe": "Lush, cinematic, floating"},
    {"name": "G13",     "notes": ["G", "B", "D", "F", "E"],     "quality": "Dominant 13th",       "vibe": "Funky, rich, gospel"},
    {"name": "Em7",     "notes": ["E", "G", "B", "D"],          "quality": "Minor 7th",           "vibe": "Smooth, lo-fi, introspective"},
    {"name": "B♭maj7",  "notes": ["B♭", "D", "F", "A"],         "quality": "Major 7th",           "vibe": "Warm, soulful, jazzy"},
    {"name": "C#m7",    "notes": ["C#", "E", "G#", "B"],        "quality": "Minor 7th",           "vibe": "Dark, moody, trap-ready"},
    {"name": "Gadd9",   "notes": ["G", "B", "D", "A"],          "quality": "Add 9th",             "vibe": "Open, uplifting, indie"},
    {"name": "F#dim7",  "notes": ["F#", "A", "C", "E♭"],        "quality": "Diminished 7th",      "vibe": "Eerie, dramatic, cinematic"},
    {"name": "Amaj7",   "notes": ["A", "C#", "E", "G#"],        "quality": "Major 7th",           "vibe": "Bright, pop, uplifting"},
    {"name": "Gm9",     "notes": ["G", "B♭", "D", "F", "A"],   "quality": "Minor 9th",           "vibe": "Dark, moody, lo-fi"},
    {"name": "Caug",    "notes": ["C", "E", "G#"],              "quality": "Augmented",           "vibe": "Tense, unresolved, transitional"},
    {"name": "D9",      "notes": ["D", "F#", "A", "C", "E"],   "quality": "Dominant 9th",        "vibe": "Funky, soulful, R&B"},
    {"name": "Fm9",     "notes": ["F", "A♭", "C", "E♭", "G"],  "quality": "Minor 9th",           "vibe": "Deep, dark, ambient"},
    {"name": "E7#9",    "notes": ["E", "G#", "B", "D", "G"],   "quality": "7 Sharp 9 (Hendrix)", "vibe": "Bluesy, aggressive, iconic"},
    {"name": "Cmaj9",   "notes": ["C", "E", "G", "B", "D"],    "quality": "Major 9th",           "vibe": "Open, airy, jazz-pop"},
    {"name": "Bm11",    "notes": ["B", "D", "F#", "A", "E"],   "quality": "Minor 11th",          "vibe": "Complex, neo-soul, rich"},
    {"name": "A♭maj7",  "notes": ["A♭", "C", "E♭", "G"],       "quality": "Major 7th",           "vibe": "Smooth, R&B, sophisticated"},
    {"name": "Dsus2",   "notes": ["D", "E", "A"],               "quality": "Suspended 2nd",       "vibe": "Open, floating, atmospheric"},
    {"name": "G7",      "notes": ["G", "B", "D", "F"],         "quality": "Dominant 7th",        "vibe": "Bluesy, driving, classic"},
    {"name": "Em11",    "notes": ["E", "G", "B", "D", "A"],    "quality": "Minor 11th",          "vibe": "Lush, ambient, wide"},
    {"name": "F9",      "notes": ["F", "A", "C", "E♭", "G"],  "quality": "Dominant 9th",        "vibe": "Soulful, gospel, warm"},
    {"name": "C#maj7",  "notes": ["C#", "F", "G#", "C"],       "quality": "Major 7th",           "vibe": "Ethereal, dreamy, lush"},
    {"name": "Asus4",   "notes": ["A", "D", "E"],               "quality": "Suspended 4th",       "vibe": "Tense, anticipatory, driving"},
    {"name": "Dm9",     "notes": ["D", "F", "A", "C", "E"],    "quality": "Minor 9th",           "vibe": "Melancholic, minor-key depth"},
    {"name": "Emaj7",   "notes": ["E", "G#", "B", "D#"],       "quality": "Major 7th",           "vibe": "Bright, sophisticated, pop"},
    {"name": "Bbm7",    "notes": ["B♭", "D♭", "F", "A♭"],      "quality": "Minor 7th",           "vibe": "Dark, drill, heavy"},
]

# ---------------------------------------------------------------------------
# Creative Prompts — 25 entries, rotated by day-of-year
# ---------------------------------------------------------------------------

CREATIVE_PROMPTS: list[dict[str, str]] = [
    {"prompt": "Write a 4-bar intro using only two chords. Let the space between them do the talking.", "category": "Composition"},
    {"prompt": "Sample a sound from your environment (rain, keyboard, coffee maker) and build a groove around it.", "category": "Sound Design"},
    {"prompt": "Start a track at 75 BPM in a minor key. Don't add any kick drum for the first 8 bars.", "category": "Lo-Fi"},
    {"prompt": "Take any melody you've written before and move every note up or down a perfect 5th.", "category": "Theory"},
    {"prompt": "Write a chord progression that tells a story: tension → climax → release in just 4 chords.", "category": "Composition"},
    {"prompt": "Layer 3 different reverb sizes on the same pad and automate their wet/dry throughout the track.", "category": "Mixing"},
    {"prompt": "Write a bass line first — no chords, no melody — just groove for 2 minutes straight.", "category": "Groove"},
    {"prompt": "Flip the script: write a major-key track that still sounds dark and heavy.", "category": "Theory"},
    {"prompt": "Create a 1-bar drum loop with exactly 7 hits. No more, no less. Make every hit count.", "category": "Drums"},
    {"prompt": "Use only samples from one artist as your source material. Chop and resample into something unrecognizable.", "category": "Production"},
    {"prompt": "Write a progression using 4 chords you've never used in a track before.", "category": "Theory"},
    {"prompt": "Build a track with no kick drum. Let the bass carry all the low-end weight.", "category": "Arrangement"},
    {"prompt": "Create a one-minute ambient piece using only sustained chords and reverb tails.", "category": "Ambient"},
    {"prompt": "Write a hook that works as both a vocal melody and a keyboard riff simultaneously.", "category": "Melody"},
    {"prompt": "Set your tempo to something uncomfortable — try 92 BPM if you usually work at 140.", "category": "Production"},
    {"prompt": "Create a track inspired by a specific color. What does that color sound like?", "category": "Creative"},
    {"prompt": "Write a chord progression that modulates (changes key) at least once in 8 bars.", "category": "Theory"},
    {"prompt": "Produce a 30-second beat with a 10-minute time limit. No second-guessing.", "category": "Discipline"},
    {"prompt": "Take a simple C major scale and only use notes 1, 2, 5, and 6. Build a whole track.", "category": "Theory"},
    {"prompt": "Write a track inspired by a memory — a place, a person, a moment in time.", "category": "Creative"},
    {"prompt": "Create a drop or build-up with no synths — only acoustic-sounding elements.", "category": "Sound Design"},
    {"prompt": "Write a track in 3/4 (waltz time). See how it changes your natural rhythmic instincts.", "category": "Rhythm"},
    {"prompt": "Use a chord from today's Chord of the Day as the first chord of a new progression.", "category": "Theory"},
    {"prompt": "Record yourself humming a melody, sample it, and build a full beat around that sample.", "category": "Production"},
    {"prompt": "Create a track that has no more than 4 elements playing at any given time.", "category": "Minimalism"},
]

# ---------------------------------------------------------------------------
# Seed Data — Tips (30) and Challenges (21) for the DB
# ---------------------------------------------------------------------------

SEED_TIPS: list[dict[str, str]] = [
    {"content": "Layering a sine sub with a slightly detuned saw creates a fatter, more modern bass tone.", "category": "mixing"},
    {"content": "Use a high-pass filter at 30–40 Hz on everything except your kick and bass to clean up mud.", "category": "mixing"},
    {"content": "The Dorian mode is the go-to for Neo-Soul and Jazz fusion — it's minor but with a raised 6th.", "category": "theory"},
    {"content": "Velocity variation is what separates human-sounding MIDI from robotic sequences. Aim for 10–20% randomness.", "category": "midi"},
    {"content": "A ♭VII chord in a minor key (e.g., B♭ in Cm) adds a powerful, anthemic feel popular in R&B.", "category": "theory"},
    {"content": "Side-chain compression between your kick and bass is one of the most important glue techniques in modern production.", "category": "mixing"},
    {"content": "Try 'negative space' — remove elements every 4 bars to give your track room to breathe.", "category": "general"},
    {"content": "The tritone substitution replaces a V7 chord with a ♭II7 chord — a classic jazz move that adds smoothness.", "category": "theory"},
    {"content": "In Logic Pro, use the Step Sequencer for drum programming instead of the Piano Roll for a faster workflow.", "category": "general"},
    {"content": "Parallel compression (New York compression) adds punch without killing dynamics. Blend a heavily compressed signal with the dry.", "category": "mixing"},
    {"content": "A 2-5-1 (ii-V-I) progression is the backbone of jazz. In C: Dm7 → G7 → Cmaj7.", "category": "theory"},
    {"content": "Adding a 9th to any minor chord (e.g., Am → Am9) instantly makes it more emotional and interesting.", "category": "theory"},
    {"content": "Reference tracks are your best friend — A/B your mix against a commercial track in a similar genre constantly.", "category": "mixing"},
    {"content": "Pitch-shifting a vocal chop up an octave and layering it behind the original adds an airy shimmer.", "category": "general"},
    {"content": "In Ableton, use a MIDI Effect Rack with Chord to instantly add harmonies to any melody line.", "category": "midi"},
    {"content": "The Circle of Fifths: moving counter-clockwise gives you the flattest, darkest keys. Clockwise = brighter.", "category": "theory"},
    {"content": "Humanize your hi-hats: program ghost hits at 20–30% velocity between your main hat hits.", "category": "midi"},
    {"content": "A long reverb pre-delay (40–80ms) stops reverb from washing over the initial transient of a sound.", "category": "mixing"},
    {"content": "Modes explained simply: they're the major scale but starting on a different degree. D Dorian = C major starting on D.", "category": "theory"},
    {"content": "Bus your drums to a single stereo bus and add subtle saturation — it glues the kit together naturally.", "category": "mixing"},
    {"content": "Try writing chord progressions backwards — write the final chord first, then work backwards to find the best approach.", "category": "general"},
    {"content": "In Lo-Fi production, adding vinyl crackle should be subtle — around -20 to -18 dBFS keeps it authentic.", "category": "general"},
    {"content": "The 'Juno chord' (barre chord with octave on top) is what gives Lo-Fi beats their signature feel.", "category": "general"},
    {"content": "MIDI quantize at 85–90% instead of 100% to keep a human feel while still being tight.", "category": "midi"},
    {"content": "Chromatic mediant chords (moving by a 3rd with chromatic flavour, like C → E) create cinematic, unexpected colour.", "category": "theory"},
    {"content": "When a mix sounds muddy, the culprit is usually the 200–400 Hz range. Dip it slightly on the busiest elements.", "category": "mixing"},
    {"content": "Automation is arrangement. A subtle filter opening over 8 bars does more than adding a new element.", "category": "general"},
    {"content": "The sus4 chord creates tension that naturally wants to resolve to the major chord — use it before a drop.", "category": "theory"},
    {"content": "In Demucs stem separation, htdemucs gives the best overall quality but mdx_extra is better for isolating vocals.", "category": "general"},
    {"content": "Record at -12 to -18 dBFS peak to give yourself headroom for mixing and prevent clipping in the chain.", "category": "mixing"},
]

SEED_CHALLENGES: list[dict[str, str]] = [
    {"title": "One Chord Wonder",         "description": "Write a complete 2-minute track using only ONE chord. Focus entirely on rhythm, texture, and sound design.", "difficulty": "easy"},
    {"title": "Finish It",                "description": "Open an unfinished project from your library and finish it today. No starting something new.", "difficulty": "hard"},
    {"title": "The 5-Note Melody",        "description": "Write a melody using only 5 notes. Keep it under 8 bars. Make it memorable enough to hum.", "difficulty": "easy"},
    {"title": "No Kick Challenge",        "description": "Produce a full beat with absolutely no kick drum. Let the bass and snare carry all the weight.", "difficulty": "medium"},
    {"title": "Modal Exploration",        "description": "Write a progression entirely in the Dorian mode. Avoid the natural minor — that raised 6th is the key.", "difficulty": "medium"},
    {"title": "Speed Run",                "description": "Set a 20-minute timer. Make the best beat you can before it goes off. No going back to fix things.", "difficulty": "hard"},
    {"title": "The Turnaround",           "description": "Write a jazz-style ii-V-I turnaround in any key and build a 4-bar loop around it.", "difficulty": "medium"},
    {"title": "Reverse Everything",       "description": "Reverse your kick, snare, and main melody. Rebuild the track around the reversed elements.", "difficulty": "medium"},
    {"title": "Boom Bap Fundamentals",    "description": "Create a classic boom bap beat: kick on 1 and 3, snare on 2 and 4, dusty sample, 90 BPM.", "difficulty": "easy"},
    {"title": "No Reverb",                "description": "Produce a track with zero reverb on any element. Create depth using only EQ, panning, and volume.", "difficulty": "hard"},
    {"title": "Chord Extension Practice", "description": "Take a simple Cm-Fm-Ab-Bb progression and extend every chord (7ths, 9ths, 11ths). Keep the vibe.", "difficulty": "medium"},
    {"title": "Field Recording Flip",     "description": "Record 3 sounds from your physical environment, sample them into your DAW, and build a beat around them.", "difficulty": "medium"},
    {"title": "The Re-Harmony",           "description": "Take a well-known melody (or one of your own) and put entirely different chords underneath it.", "difficulty": "hard"},
    {"title": "Drum-Only Track",          "description": "Produce 2 minutes of drum programming only — no melodic or harmonic elements. Make it musical.", "difficulty": "medium"},
    {"title": "Waltz Time",               "description": "Write a complete loop in 3/4 time. No 4/4 allowed. See how it changes your rhythmic instincts.", "difficulty": "medium"},
    {"title": "Copy a Classic",           "description": "Recreate the drum pattern from a track you love — from scratch, by ear. Don't sample it.", "difficulty": "easy"},
    {"title": "The Dark Major",           "description": "Write a track in a major key that still sounds dark and heavy. Use dynamics and timbre, not mode.", "difficulty": "hard"},
    {"title": "1-Bar Loop, 10 Variations","description": "Write one 1-bar chord loop. Then write 10 variations of it — each slightly different in rhythm or voicing.", "difficulty": "hard"},
    {"title": "Ambient Voyage",           "description": "Create a 3-minute ambient piece using only sustained chords, reverb, and delay. No drums.", "difficulty": "easy"},
    {"title": "Genre Swap",               "description": "Take a chord progression you use in your main genre and rewrite it for a completely different genre.", "difficulty": "medium"},
    {"title": "The Breakdown Artist",     "description": "Focus only on writing an 8-bar breakdown for an imaginary track. Make the return feel inevitable.", "difficulty": "medium"},
]


# ---------------------------------------------------------------------------
# DB helpers — seed on first use
# ---------------------------------------------------------------------------

def _ensure_seeded() -> None:
    """Seed tips and challenges into the DB if the tables are empty."""
    conn = get_connection()
    try:
        tip_count = conn.execute("SELECT COUNT(*) FROM tips").fetchone()[0]
        if tip_count == 0:
            conn.executemany(
                "INSERT INTO tips (content, category) VALUES (?, ?)",
                [(t["content"], t["category"]) for t in SEED_TIPS],
            )

        challenge_count = conn.execute("SELECT COUNT(*) FROM challenges").fetchone()[0]
        if challenge_count == 0:
            conn.executemany(
                "INSERT INTO challenges (title, description, difficulty) VALUES (?, ?, ?)",
                [(c["title"], c["description"], c["difficulty"]) for c in SEED_CHALLENGES],
            )

        conn.commit()
    finally:
        conn.close()


def _get_daily_tip() -> dict[str, str]:
    """Return a tip not shown in the last 30 days; fall back to a random one."""
    conn = get_connection()
    try:
        row = conn.execute(
            """SELECT * FROM tips
               WHERE shown_at IS NULL OR shown_at < date('now', '-30 days')
               ORDER BY RANDOM() LIMIT 1"""
        ).fetchone()
        if not row:
            # All tips shown recently — just pick any random one
            row = conn.execute("SELECT * FROM tips ORDER BY RANDOM() LIMIT 1").fetchone()
        if row:
            conn.execute(
                "UPDATE tips SET shown_at = date('now') WHERE id = ?", (row["id"],)
            )
            conn.commit()
            return {"id": row["id"], "content": row["content"], "category": row["category"]}
    finally:
        conn.close()
    return {"id": 0, "content": "Listen critically and trust your ears.", "category": "general"}


def _get_daily_challenge() -> dict[str, Any]:
    """Return a challenge not shown in the last 21 days; fall back to a random one."""
    conn = get_connection()
    try:
        row = conn.execute(
            """SELECT * FROM challenges
               WHERE shown_at IS NULL OR shown_at < date('now', '-21 days')
               ORDER BY RANDOM() LIMIT 1"""
        ).fetchone()
        if not row:
            row = conn.execute("SELECT * FROM challenges ORDER BY RANDOM() LIMIT 1").fetchone()
        if row:
            conn.execute(
                "UPDATE challenges SET shown_at = date('now') WHERE id = ?", (row["id"],)
            )
            conn.commit()
            return {
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "difficulty": row["difficulty"],
                "completed": bool(row["completed"]),
            }
    finally:
        conn.close()
    return {"id": 0, "title": "Free Write", "description": "Open your DAW and make something for 30 minutes.", "difficulty": "easy", "completed": False}


def mark_challenge_complete(challenge_id: int) -> bool:
    """Mark a challenge as completed. Returns True on success."""
    conn = get_connection()
    try:
        cur = conn.execute(
            "UPDATE challenges SET completed = 1, completed_at = datetime('now') WHERE id = ?",
            (challenge_id,),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_daily_content(user_id: int = 1) -> dict[str, Any]:
    """
    Return all four daily content pieces:
      - chord_of_day: chord info dict
      - tip: daily production tip
      - prompt: creative writing prompt
      - challenge: daily challenge
      - date: today's date string
    """
    _ensure_seeded()

    today = datetime.date.today()
    day_of_year = today.timetuple().tm_yday  # 1-365

    # Chord of the day — deterministic rotation by day
    chord = CHORDS_OF_THE_DAY[(day_of_year - 1) % len(CHORDS_OF_THE_DAY)]

    # Creative prompt — deterministic rotation by day
    prompt = CREATIVE_PROMPTS[(day_of_year - 1) % len(CREATIVE_PROMPTS)]

    # Tip and challenge — pulled from DB, avoiding recent repeats
    tip = _get_daily_tip()
    challenge = _get_daily_challenge()

    return {
        "date": today.isoformat(),
        "chord_of_day": chord,
        "tip": tip,
        "prompt": prompt,
        "challenge": challenge,
    }
