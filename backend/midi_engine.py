"""
Terra Echo Labs — MIDI Chord Engine (Sprint 1)
Chord parser, voicing algorithms, and MIDI file writer.
Dependencies: pretty_midi, mido
"""

from __future__ import annotations
import os
from pathlib import Path
from typing import Literal

import pretty_midi

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Chromatic note names → semitone offset from C (supports sharps and flats)
NOTE_MAP: dict[str, int] = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "Fb": 4,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11, "Cb": 11,
}

# Chord quality → semitone intervals above root
CHORD_INTERVALS: dict[str, list[int]] = {
    # Triads
    "maj":   [0, 4, 7],
    "min":   [0, 3, 7],
    "dim":   [0, 3, 6],
    "aug":   [0, 4, 8],
    "sus2":  [0, 2, 7],
    "sus4":  [0, 5, 7],

    # Sevenths
    "maj7":  [0, 4, 7, 11],
    "min7":  [0, 3, 7, 10],
    "7":     [0, 4, 7, 10],     # dominant 7
    "dim7":  [0, 3, 6, 9],
    "m7b5":  [0, 3, 6, 10],     # half-diminished
    "aug7":  [0, 4, 8, 10],
    "mMaj7": [0, 3, 7, 11],     # minor-major 7

    # Sixths
    "6":     [0, 4, 7, 9],      # major 6
    "min6":  [0, 3, 7, 9],

    # Ninths
    "maj9":  [0, 4, 7, 11, 14],
    "min9":  [0, 3, 7, 10, 14],
    "9":     [0, 4, 7, 10, 14], # dominant 9
    "add9":  [0, 4, 7, 14],

    # Elevenths & thirteenths
    "11":    [0, 4, 7, 10, 14, 17],
    "min11": [0, 3, 7, 10, 14, 17],
    "13":    [0, 4, 7, 10, 14, 17, 21],
}

# Suffix aliases to normalise incoming chord names
QUALITY_ALIASES: dict[str, str] = {
    "m":       "min",
    "M":       "maj",
    "minor":   "min",
    "major":   "maj",
    "m7":      "min7",
    "m9":      "min9",
    "m6":      "min6",
    "m11":     "min11",
    "M7":      "maj7",
    "M9":      "maj9",
    "dom7":    "7",
    "dom":     "7",
    "ø":       "m7b5",
    "ø7":      "m7b5",
    "°":       "dim",
    "°7":      "dim7",
    "+":       "aug",
    "+7":      "aug7",
    "Δ":       "maj7",
    "Δ7":      "maj7",
}

VoicingStyle = Literal["closed", "open", "drop2", "inv1", "inv2", "inv3"]

# Default output directory for .mid files
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "midi"


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def _resolve_root(root_str: str) -> int:
    """Convert a root string (e.g. 'Bb', 'F#') to a semitone offset 0-11."""
    for name, semitone in sorted(NOTE_MAP.items(), key=lambda x: -len(x[0])):
        if root_str.startswith(name):
            return semitone
    raise ValueError(f"Unknown root note: '{root_str}'")


def _split_chord_name(chord_name: str) -> tuple[str, str]:
    """
    Split 'Cm7' → ('C', 'min7'), 'F#maj7' → ('F#', 'maj7'), 'Bb' → ('Bb', 'maj').
    Accepts lowercase input: 'cm7', 'f#maj7', 'bb' all work.
    Returns (root, quality).
    """
    chord_name = chord_name.strip()
    if not chord_name:
        raise ValueError("Chord name cannot be empty")

    # Normalize root: first letter uppercase, preserve #/b accidental
    chord_name = chord_name[0].upper() + chord_name[1:]

    # Determine root (1 or 2 chars)
    if len(chord_name) >= 2 and chord_name[1] in ("#", "b"):
        root = chord_name[:2]
        suffix = chord_name[2:]
    else:
        root = chord_name[:1]
        suffix = chord_name[1:]

    if not suffix:
        suffix = "maj"

    # Normalise aliases — try as-is first, then lowercase
    quality = QUALITY_ALIASES.get(suffix, None)
    if quality is None:
        quality = QUALITY_ALIASES.get(suffix.lower(), suffix.lower())

    return root, quality


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_chord(chord_name: str, octave: int = 4) -> list[int]:
    """
    Parse a chord name into a list of MIDI note numbers.

    Args:
        chord_name: e.g. 'Cm7', 'F#maj7', 'Bb', 'Gsus4'
        octave:     Octave for the root note (default 4 → middle C = 60)

    Returns:
        List of MIDI note numbers in ascending order.

    Raises:
        ValueError: If root or quality is unrecognised.
    """
    root_str, quality = _split_chord_name(chord_name)
    root_semitone = _resolve_root(root_str)

    if quality not in CHORD_INTERVALS:
        raise ValueError(
            f"Unknown chord quality '{quality}' in '{chord_name}'. "
            f"Available: {sorted(CHORD_INTERVALS.keys())}"
        )

    root_midi = (octave + 1) * 12 + root_semitone  # C4 = 60
    intervals = CHORD_INTERVALS[quality]
    return [root_midi + i for i in intervals]


def get_voicing(notes: list[int], style: VoicingStyle = "closed") -> list[int]:
    """
    Apply a voicing style to a list of MIDI notes.

    Args:
        notes:  MIDI note numbers (from parse_chord)
        style:  'closed' | 'open' | 'drop2' | 'inv1' | 'inv2' | 'inv3'

    Returns:
        Re-voiced list of MIDI note numbers.
    """
    if not notes:
        return notes

    n = list(notes)

    if style == "closed":
        return sorted(n)

    if style == "inv1":
        # First inversion: raise root by an octave
        return sorted([n[0] + 12] + n[1:])

    if style == "inv2":
        # Second inversion: raise root and 3rd by an octave
        if len(n) < 3:
            return sorted(n)
        return sorted([n[0] + 12, n[1] + 12] + n[2:])

    if style == "inv3":
        # Third inversion: raise root, 3rd, 5th (for 7th chords)
        if len(n) < 4:
            return sorted(n)
        return sorted([n[0] + 12, n[1] + 12, n[2] + 12] + n[3:])

    if style == "open":
        # Spread: raise every other note by an octave
        voiced = []
        for i, note in enumerate(sorted(n)):
            voiced.append(note + (12 if i % 2 == 1 else 0))
        return sorted(voiced)

    if style == "drop2":
        # Drop-2: take closed position, drop 2nd highest note by an octave
        closed = sorted(n)
        if len(closed) < 3:
            return closed
        drop_idx = len(closed) - 2
        closed[drop_idx] -= 12
        return sorted(closed)

    return sorted(n)


def progression_to_midi(
    chords: list[str],
    output_path: str | None = None,
    tempo: int = 80,
    beats_per_chord: int = 4,
    octave: int = 4,
    voicing: VoicingStyle = "closed",
    velocity: int = 80,
    instrument_program: int = 0,  # 0 = Acoustic Grand Piano
) -> str:
    """
    Convert a chord progression to a MIDI file.

    Args:
        chords:           List of chord name strings e.g. ['Cm7', 'Fm7', 'Ab', 'Bb']
        output_path:      Where to save the .mid file. Auto-generated if None.
        tempo:            BPM (default 80)
        beats_per_chord:  How many beats each chord lasts (default 4)
        octave:           Root octave (default 4)
        voicing:          Voicing style (default 'closed')
        velocity:         MIDI velocity 1-127 (default 80)
        instrument_program: GM program number (default 0 = Grand Piano)

    Returns:
        Absolute path of the saved .mid file.

    Raises:
        ValueError: If any chord name is invalid.
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if output_path is None:
        slug = "_".join(c.replace("#", "s").replace("/", "-") for c in chords[:4])
        output_path = str(OUTPUT_DIR / f"{slug}.mid")

    pm = pretty_midi.PrettyMIDI(initial_tempo=float(tempo))
    instrument = pretty_midi.Instrument(program=instrument_program)

    seconds_per_beat = 60.0 / tempo
    chord_duration = beats_per_chord * seconds_per_beat

    for chord_idx, chord_name in enumerate(chords):
        notes = parse_chord(chord_name, octave=octave)
        voiced = get_voicing(notes, style=voicing)

        start_time = chord_idx * chord_duration
        end_time = start_time + chord_duration

        for midi_note in voiced:
            midi_note = max(0, min(127, midi_note))
            note = pretty_midi.Note(
                velocity=velocity,
                pitch=midi_note,
                start=start_time,
                end=end_time - 0.05,  # slight gap between chords
            )
            instrument.notes.append(note)

    pm.instruments.append(instrument)
    pm.write(output_path)
    return os.path.abspath(output_path)


def list_chord_types() -> dict[str, list[int]]:
    """Return all supported chord qualities and their interval sets."""
    return dict(CHORD_INTERVALS)


def list_voicing_styles() -> list[str]:
    """Return all supported voicing style names."""
    return ["closed", "open", "drop2", "inv1", "inv2", "inv3"]


def midi_notes_to_names(midi_notes: list[int]) -> list[str]:
    """Convert MIDI note numbers to human-readable note names (e.g. 60 → 'C4')."""
    note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    result = []
    for n in midi_notes:
        octave = (n // 12) - 1
        name = note_names[n % 12]
        result.append(f"{name}{octave}")
    return result
