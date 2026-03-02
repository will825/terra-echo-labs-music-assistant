"""
Terra Echo Labs — AI Progression Generator (Sprint 2)
Generates chord progressions via the Anthropic Claude API (claude-3-5-haiku).
Uses an in-memory LRU cache to avoid repeat API calls for identical inputs.
"""

from __future__ import annotations

import hashlib
import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from anthropic import Anthropic, APIError
from dotenv import load_dotenv

# Load .env from the project root (two levels up from this file)
_ROOT = Path(__file__).parent.parent
load_dotenv(_ROOT / ".env")

# ---------------------------------------------------------------------------
# Genre presets — used in prompt construction and as UI suggestion values.
# ---------------------------------------------------------------------------
GENRE_PRESETS: dict[str, dict[str, Any]] = {
    "Lo-Fi Hip Hop": {
        "scales": ["minor", "dorian", "minor pentatonic"],
        "tempo_range": "65-90",
        "feel": "jazzy, mellow, nostalgic, sample-ready",
        "common_chords": ["maj7", "m7", "9", "m9", "add9"],
    },
    "Trap": {
        "scales": ["minor", "minor pentatonic", "phrygian"],
        "tempo_range": "130-160",
        "feel": "dark, menacing, hard-hitting",
        "common_chords": ["m", "dim", "m7", "sus2"],
    },
    "Jazz": {
        "scales": ["dorian", "lydian", "mixolydian", "major"],
        "tempo_range": "80-160",
        "feel": "complex, sophisticated, chromatic movement",
        "common_chords": ["maj7", "m7", "dom7", "m7b5", "dim7", "9", "11", "13"],
    },
    "Neo-Soul": {
        "scales": ["dorian", "minor", "major"],
        "tempo_range": "70-95",
        "feel": "soulful, warm, smooth, organic",
        "common_chords": ["m9", "maj9", "dom7", "9", "add9", "sus2"],
    },
    "Ambient": {
        "scales": ["major", "lydian", "minor", "whole tone"],
        "tempo_range": "60-80",
        "feel": "ethereal, spacious, floating, textural",
        "common_chords": ["maj7", "add9", "sus4", "sus2", "maj9"],
    },
    "House": {
        "scales": ["minor", "dorian", "major"],
        "tempo_range": "120-130",
        "feel": "driving, uplifting, groove-oriented",
        "common_chords": ["m7", "m9", "maj7", "dom7", "sus2"],
    },
    "R&B": {
        "scales": ["dorian", "minor", "major", "blues"],
        "tempo_range": "65-95",
        "feel": "smooth, emotive, groove-based, vocal-friendly",
        "common_chords": ["m9", "maj9", "dom7", "9", "11", "13", "add9"],
    },
    "Pop": {
        "scales": ["major", "minor"],
        "tempo_range": "100-130",
        "feel": "catchy, accessible, hook-driven",
        "common_chords": ["maj", "min", "dom7", "sus2", "add9"],
    },
    "Drill": {
        "scales": ["minor", "phrygian", "minor pentatonic"],
        "tempo_range": "140-150",
        "feel": "dark, gritty, atmospheric, UK-influenced",
        "common_chords": ["m", "dim", "m7", "sus4"],
    },
    "Boom Bap": {
        "scales": ["minor", "dorian", "blues"],
        "tempo_range": "85-100",
        "feel": "classic hip-hop, gritty, sample-heavy vibes",
        "common_chords": ["m7", "dom7", "9", "m9"],
    },
}

MOOD_DESCRIPTORS: dict[str, str] = {
    "chill": "relaxed, smooth, laid-back, easy-going",
    "dark": "tense, ominous, foreboding, minor-heavy",
    "uplifting": "bright, positive, energizing, major-oriented",
    "melancholic": "sad, emotional, bittersweet, introspective",
    "energetic": "high-energy, driving, powerful, forward-moving",
    "mysterious": "ambiguous, intriguing, chromatic, unresolved",
    "romantic": "warm, intimate, lush, expressive",
    "aggressive": "intense, dissonant, raw, distorted-feeling",
}

COMPLEXITY_LABELS = {1: "simple (3–4 basic chords)", 2: "moderate (4–6 chords with extensions)", 3: "complex (6–8 chords with advanced voicings and substitutions)"}

# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def _build_prompt(
    genre: str,
    mood: str,
    key: str,
    scale: str,
    num_chords: int,
    complexity: int,
    tempo: int,
    extra_instructions: str = "",
) -> str:
    """Build the Claude prompt for chord progression generation."""
    preset = GENRE_PRESETS.get(genre, {})
    genre_feel = preset.get("feel", "")
    common_chords = preset.get("common_chords", [])
    mood_desc = MOOD_DESCRIPTORS.get(mood, mood)
    complexity_label = COMPLEXITY_LABELS.get(complexity, "moderate")

    chord_hint = (
        f"Typical chord extensions for this genre: {', '.join(common_chords)}. " if common_chords else ""
    )

    extra_block = f"\nExtra instructions: {extra_instructions}" if extra_instructions.strip() else ""

    return f"""You are an expert music theory assistant specializing in modern music production.
Generate a chord progression for the following spec and respond ONLY with valid JSON — no markdown, no extra text.

SPEC:
- Genre: {genre}  ({genre_feel})
- Mood: {mood}  ({mood_desc})
- Key: {key}
- Scale: {scale}
- Number of chords: {num_chords}
- Complexity: {complexity_label}
- Tempo: {tempo} BPM
{chord_hint}{extra_block}

Return this exact JSON shape:
{{
  "chords": ["<chord1>", "<chord2>", ...],
  "key": "<key>",
  "scale": "<scale>",
  "tempo": <bpm_integer>,
  "explanation": "<2–3 sentences explaining the harmonic choices and how they fit the genre/mood>",
  "theory_note": "<1 sentence with a music theory insight or tip>",
  "daw_tip": "<1 sentence practical tip for Logic Pro or Ableton Live>"
}}

Chord notation rules:
- Root: letter + optional # or b  (e.g. C, F#, Bb)
- Quality suffix examples: maj, min, m7, maj7, dom7, m9, maj9, 9, dim, dim7, aug, sus2, sus4, add9, m7b5, 13, 11
- Write chords in the requested key — use diatonic or modal chords that fit {scale} scale in {key}
- Ensure the progression loops convincingly (last chord leads back to first)"""


# ---------------------------------------------------------------------------
# In-memory cache keyed by a hash of all inputs
# ---------------------------------------------------------------------------

_cache: dict[str, dict[str, Any]] = {}
_CACHE_MAX = 128


def _cache_key(
    genre: str, mood: str, key: str, scale: str,
    num_chords: int, complexity: int, tempo: int, extra: str,
) -> str:
    payload = f"{genre}|{mood}|{key}|{scale}|{num_chords}|{complexity}|{tempo}|{extra.strip().lower()}"
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Core generation function
# ---------------------------------------------------------------------------

def generate_progression(
    genre: str = "Lo-Fi Hip Hop",
    mood: str = "chill",
    key: str = "C",
    scale: str = "minor",
    num_chords: int = 4,
    complexity: int = 2,
    tempo: int = 80,
    extra_instructions: str = "",
    bypass_cache: bool = False,
) -> dict[str, Any]:
    """
    Generate a chord progression using Claude claude-3-5-haiku-20241022.

    Returns a dict with keys: chords, key, scale, tempo, explanation,
    theory_note, daw_tip, cached (bool).

    Raises ValueError if ANTHROPIC_API_KEY is not set.
    Raises RuntimeError on API or parse errors.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key or api_key == "sk-ant-your-key-here":
        raise ValueError(
            "ANTHROPIC_API_KEY is not set. Add it to your .env file in the project root."
        )

    # Validate num_chords
    num_chords = max(2, min(num_chords, 12))

    ck = _cache_key(genre, mood, key, scale, num_chords, complexity, tempo, extra_instructions)

    if not bypass_cache and ck in _cache:
        result = dict(_cache[ck])
        result["cached"] = True
        return result

    prompt = _build_prompt(genre, mood, key, scale, num_chords, complexity, tempo, extra_instructions)

    client = Anthropic(api_key=api_key)

    try:
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
    except APIError as exc:
        raise RuntimeError(f"Anthropic API error: {exc}") from exc

    raw = message.content[0].text.strip()

    # Strip accidental markdown code fences if model slips up
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        result: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Model returned invalid JSON: {exc}\nRaw:\n{raw}") from exc

    # Sanity check
    if "chords" not in result or not isinstance(result["chords"], list):
        raise RuntimeError(f"Model response missing 'chords' list. Got: {raw}")

    result["cached"] = False

    # Evict oldest entry if cache is full
    if len(_cache) >= _CACHE_MAX:
        oldest = next(iter(_cache))
        del _cache[oldest]

    _cache[ck] = {k: v for k, v in result.items() if k != "cached"}
    return result


# ---------------------------------------------------------------------------
# Cache management helpers
# ---------------------------------------------------------------------------

def get_cache_stats() -> dict[str, int]:
    """Return current cache utilisation."""
    return {"entries": len(_cache), "max": _CACHE_MAX}


def clear_cache() -> None:
    """Flush the in-memory progression cache."""
    _cache.clear()
