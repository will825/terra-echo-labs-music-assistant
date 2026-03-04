"""
Terra Echo Labs — Music Theory Reference (Sprint 4)
Chord dictionary, scale explorer, interval reference.
All data is static — no DB or external API needed.
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# Chromatic note list — used to compute actual notes from intervals
# ---------------------------------------------------------------------------

CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Enharmonic display map (sharps → flats) for common keys
_FLAT_DISPLAY = {
    "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"
}

# Keys that prefer flat notation
_FLAT_KEYS = {"F", "Bb", "Eb", "Ab", "Db", "Gb", "Cm", "Fm", "Bbm", "Ebm", "Abm", "Dbm"}


def _note_idx(note: str) -> int:
    """Return chromatic index 0-11 for a note name (handles sharps and flats)."""
    note = note.strip()
    flat_to_sharp = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
    note = flat_to_sharp.get(note, note)
    return CHROMATIC.index(note)


def _build_notes(root: str, intervals: list[int], prefer_flats: bool = False) -> list[str]:
    """Given a root and list of semitone intervals, return note names."""
    root_idx = _note_idx(root)
    notes = []
    for interval in intervals:
        idx = (root_idx + interval) % 12
        note = CHROMATIC[idx]
        if prefer_flats and note in _FLAT_DISPLAY:
            note = _FLAT_DISPLAY[note]
        notes.append(note)
    return notes


# ---------------------------------------------------------------------------
# Chord Types Dictionary
# Each entry: intervals (semitones from root), interval_names, quality, description, use_cases
# ---------------------------------------------------------------------------

CHORD_TYPES: dict[str, dict[str, Any]] = {
    # Triads
    "maj": {
        "label": "Major",
        "intervals": [0, 4, 7],
        "interval_names": ["R", "3", "5"],
        "quality": "Major triad",
        "description": "Bright, happy, stable. The foundation of Western harmony.",
        "use_cases": "Tonic chord in major keys, pop, rock, classical. Pair with I-IV-V-I.",
        "tension": 1,
    },
    "min": {
        "label": "Minor",
        "intervals": [0, 3, 7],
        "interval_names": ["R", "♭3", "5"],
        "quality": "Minor triad",
        "description": "Dark, sad, introspective. The counterpart to the major triad.",
        "use_cases": "Tonic in minor keys, lo-fi, trap, R&B. Try i-VII-VI in minor keys.",
        "tension": 1,
    },
    "dim": {
        "label": "Diminished",
        "intervals": [0, 3, 6],
        "interval_names": ["R", "♭3", "♭5"],
        "quality": "Diminished triad",
        "description": "Tense, unstable, dramatic. Built entirely from minor 3rds.",
        "use_cases": "Passing chord, builds tension before resolution. Common as viidim in major.",
        "tension": 4,
    },
    "aug": {
        "label": "Augmented",
        "intervals": [0, 4, 8],
        "interval_names": ["R", "3", "#5"],
        "quality": "Augmented triad",
        "description": "Tense, dreamlike, unresolved. Built from two major 3rds.",
        "use_cases": "Transition chord between I and IV/vi. Creates suspense before resolution.",
        "tension": 4,
    },
    "sus2": {
        "label": "Suspended 2nd",
        "intervals": [0, 2, 7],
        "interval_names": ["R", "2", "5"],
        "quality": "Suspended 2nd",
        "description": "Open, floating, ambiguous. Neither major nor minor — pure atmosphere.",
        "use_cases": "Intro chords, ambient pads, lo-fi. Try Dsus2 into G for an open feel.",
        "tension": 2,
    },
    "sus4": {
        "label": "Suspended 4th",
        "intervals": [0, 5, 7],
        "interval_names": ["R", "4", "5"],
        "quality": "Suspended 4th",
        "description": "Tense, anticipatory. The 4th yearns to resolve down to the 3rd.",
        "use_cases": "Before the drop, pre-chorus tension, transitional chord in progressions.",
        "tension": 3,
    },
    "5": {
        "label": "Power Chord",
        "intervals": [0, 7],
        "interval_names": ["R", "5"],
        "quality": "Power chord (no 3rd)",
        "description": "Raw, ambiguous — neither major nor minor. Pure energy and drive.",
        "use_cases": "Rock, metal, lo-fi bass lines, trap chord stabs. Works with heavy distortion.",
        "tension": 1,
    },
    # 7th Chords
    "maj7": {
        "label": "Major 7th",
        "intervals": [0, 4, 7, 11],
        "interval_names": ["R", "3", "5", "7"],
        "quality": "Major 7th",
        "description": "Dreamy, sophisticated, warm. The most lush of the 7th chords.",
        "use_cases": "Jazz, neo-soul, lo-fi. Cmaj7 → Am7 is a staple of smooth R&B and lo-fi.",
        "tension": 2,
    },
    "7": {
        "label": "Dominant 7th",
        "intervals": [0, 4, 7, 10],
        "interval_names": ["R", "3", "5", "♭7"],
        "quality": "Dominant 7th",
        "description": "Tense, bluesy, driving. The V7 chord — strongest pull to the tonic.",
        "use_cases": "Blues, jazz cadences (V7→I), gospel. The engine of functional harmony.",
        "tension": 3,
    },
    "min7": {
        "label": "Minor 7th",
        "intervals": [0, 3, 7, 10],
        "interval_names": ["R", "♭3", "5", "♭7"],
        "quality": "Minor 7th",
        "description": "Smooth, introspective, soulful. The most used chord in jazz and R&B.",
        "use_cases": "ii chord in minor/major, lo-fi progressions, neo-soul. Am7-Dm7-G7 is classic.",
        "tension": 2,
    },
    "min_maj7": {
        "label": "Minor-Major 7th",
        "intervals": [0, 3, 7, 11],
        "interval_names": ["R", "♭3", "5", "7"],
        "quality": "Minor-Major 7th",
        "description": "Eerie, cinematic, tense. The natural minor with a major 7th on top.",
        "use_cases": "Film scores, jazz, cinematic production. Used in harmonic minor progressions.",
        "tension": 4,
    },
    "dim7": {
        "label": "Diminished 7th",
        "intervals": [0, 3, 6, 9],
        "interval_names": ["R", "♭3", "♭5", "♭♭7"],
        "quality": "Fully diminished 7th",
        "description": "Maximum tension, symmetrical — all minor 3rds. Extremely dramatic.",
        "use_cases": "Chromatic passing chord, horror/thriller scores, dramatic jazz resolutions.",
        "tension": 5,
    },
    "half_dim7": {
        "label": "Half-Diminished (m7♭5)",
        "intervals": [0, 3, 6, 10],
        "interval_names": ["R", "♭3", "♭5", "♭7"],
        "quality": "Half-diminished 7th",
        "description": "Tense but more mellow than full dim7. Common as ii chord in minor.",
        "use_cases": "ii chord in minor keys (iim7♭5). Dm7♭5-G7-Cm is the minor ii-V-i.",
        "tension": 4,
    },
    "aug7": {
        "label": "Augmented 7th",
        "intervals": [0, 4, 8, 10],
        "interval_names": ["R", "3", "#5", "♭7"],
        "quality": "Augmented dominant 7th",
        "description": "Exotic, unstable. Augmented with a dominant 7th — wants to resolve strongly.",
        "use_cases": "Substitution for dominant chords, jazz, chromatic voice leading.",
        "tension": 5,
    },
    # 9th Chords
    "maj9": {
        "label": "Major 9th",
        "intervals": [0, 4, 7, 11, 14],
        "interval_names": ["R", "3", "5", "7", "9"],
        "quality": "Major 9th",
        "description": "Lush, open, airy. The major 7th with an added colour note.",
        "use_cases": "Jazz pop, neo-soul, lo-fi. Cmaj9-Am9 is extremely popular in smooth genres.",
        "tension": 2,
    },
    "9": {
        "label": "Dominant 9th",
        "intervals": [0, 4, 7, 10, 14],
        "interval_names": ["R", "3", "5", "♭7", "9"],
        "quality": "Dominant 9th",
        "description": "Funky, soulful, rich. Dominant 7th with added 9th for extra colour.",
        "use_cases": "Funk, soul, R&B grooves. C9-F9 is a foundational funk/soul progression.",
        "tension": 3,
    },
    "min9": {
        "label": "Minor 9th",
        "intervals": [0, 3, 7, 10, 14],
        "interval_names": ["R", "♭3", "5", "♭7", "9"],
        "quality": "Minor 9th",
        "description": "Deep, melancholic, rich. Adds dimension and emotional depth to minor chords.",
        "use_cases": "Neo-soul, lo-fi, jazz. Am9-Dm9 has a signature lo-fi and neo-soul quality.",
        "tension": 2,
    },
    "7_sharp9": {
        "label": "7#9 (Hendrix Chord)",
        "intervals": [0, 4, 7, 10, 15],
        "interval_names": ["R", "3", "5", "♭7", "#9"],
        "quality": "Dominant 7 sharp 9",
        "description": "Aggressive, bluesy, iconic. Both major and minor 3rd at the same time — pure tension.",
        "use_cases": "Blues rock, funk (Purple Haze!), jazz-fusion. The Hendrix chord of rock.",
        "tension": 5,
    },
    "7_flat9": {
        "label": "7♭9",
        "intervals": [0, 4, 7, 10, 13],
        "interval_names": ["R", "3", "5", "♭7", "♭9"],
        "quality": "Dominant 7 flat 9",
        "description": "Dark, tense, Spanish. Has a flamenco/jazz feel and creates strong pull to tonic.",
        "use_cases": "Jazz, flamenco-influenced beats, cinematic. Great V chord in minor ii-V-i.",
        "tension": 5,
    },
    # 11th / 13th
    "min11": {
        "label": "Minor 11th",
        "intervals": [0, 3, 7, 10, 14, 17],
        "interval_names": ["R", "♭3", "5", "♭7", "9", "11"],
        "quality": "Minor 11th",
        "description": "Very lush and wide. Stacks all the colour tones above a minor 7th.",
        "use_cases": "Neo-soul, jazz fusion, ambient. Often voiced by dropping the 5th.",
        "tension": 2,
    },
    "13": {
        "label": "Dominant 13th",
        "intervals": [0, 4, 7, 10, 14, 21],
        "interval_names": ["R", "3", "5", "♭7", "9", "13"],
        "quality": "Dominant 13th",
        "description": "Maximum richness from a dominant chord. Funky, gospel, full of character.",
        "use_cases": "Gospel, jazz, funk. G13 is a staple of gospel piano arrangements.",
        "tension": 3,
    },
    # Added-tone chords
    "add9": {
        "label": "Add 9",
        "intervals": [0, 4, 7, 14],
        "interval_names": ["R", "3", "5", "9"],
        "quality": "Added 9th (no 7th)",
        "description": "Bright and open. Like major but with extra colour — simpler than maj9.",
        "use_cases": "Pop, indie, rock. Gadd9 and Dadd9 are staples of indie and pop production.",
        "tension": 1,
    },
    "min_add9": {
        "label": "Minor Add 9",
        "intervals": [0, 3, 7, 14],
        "interval_names": ["R", "♭3", "5", "9"],
        "quality": "Minor added 9th (no 7th)",
        "description": "Melancholic with a touch of brightness. The sadness of minor with added air.",
        "use_cases": "Lo-fi, ambient, indie. Emadd9 is widely used in lo-fi and ambient production.",
        "tension": 1,
    },
    "6": {
        "label": "Major 6th",
        "intervals": [0, 4, 7, 9],
        "interval_names": ["R", "3", "5", "6"],
        "quality": "Major 6th",
        "description": "Sweet, vintage, bossa nova. Bright and upbeat with a classic jazz flavour.",
        "use_cases": "Jazz, bossa nova, vintage pop. C6 = Am7 in different inversions.",
        "tension": 1,
    },
    "min6": {
        "label": "Minor 6th",
        "intervals": [0, 3, 7, 9],
        "interval_names": ["R", "♭3", "5", "6"],
        "quality": "Minor 6th",
        "description": "Melancholic but colourful. The raised 6th adds brightness to a dark chord.",
        "use_cases": "Jazz, bossa nova, neo-soul. Dm6 works beautifully as a ii chord substitute.",
        "tension": 2,
    },
}

# ---------------------------------------------------------------------------
# Scale Types Dictionary
# ---------------------------------------------------------------------------

SCALE_TYPES: dict[str, dict[str, Any]] = {
    "major": {
        "label": "Major (Ionian)",
        "intervals": [0, 2, 4, 5, 7, 9, 11],
        "degrees": ["1", "2", "3", "4", "5", "6", "7"],
        "description": "The foundation of Western music. Bright, happy, stable.",
        "vibe": "Uplifting, bright, happy, triumphant",
        "genre_uses": "Pop, classical, rock, country, jazz",
        "daw_tip": "In Logic, select 'Major' in the Score/Piano Roll scale highlight. In Ableton, use the 'Major' scale in MIDI effects.",
    },
    "natural_minor": {
        "label": "Natural Minor (Aeolian)",
        "intervals": [0, 2, 3, 5, 7, 8, 10],
        "degrees": ["1", "2", "♭3", "4", "5", "♭6", "♭7"],
        "description": "Dark, melancholic, the relative minor of the major scale.",
        "vibe": "Sad, dark, introspective, melancholic",
        "genre_uses": "Lo-fi, trap, R&B, metal, rock, classical",
        "daw_tip": "Most DAW piano rolls have 'Minor' as a scale option. In C natural minor: C D Eb F G Ab Bb.",
    },
    "dorian": {
        "label": "Dorian",
        "intervals": [0, 2, 3, 5, 7, 9, 10],
        "degrees": ["1", "2", "♭3", "4", "5", "6", "♭7"],
        "description": "Minor but with a raised 6th — darker than major, brighter than natural minor.",
        "vibe": "Soulful, funky, mysterious, sophisticated",
        "genre_uses": "Jazz, funk, neo-soul, Latin, modal jazz (Miles Davis)",
        "daw_tip": "D Dorian = C major scale starting on D. Great for neo-soul progressions with a ii-chord feel.",
    },
    "phrygian": {
        "label": "Phrygian",
        "intervals": [0, 1, 3, 5, 7, 8, 10],
        "degrees": ["1", "♭2", "♭3", "4", "5", "♭6", "♭7"],
        "description": "Very dark with a Spanish/flamenco flavour. The ♭2 is its signature.",
        "vibe": "Dark, Spanish, exotic, mysterious, dramatic",
        "genre_uses": "Metal, flamenco, hip-hop (dark trap), Middle Eastern music",
        "daw_tip": "E Phrygian = C major starting on E. Try a ♭II chord (F major in E Phrygian) for the signature sound.",
    },
    "lydian": {
        "label": "Lydian",
        "intervals": [0, 2, 4, 6, 7, 9, 11],
        "degrees": ["1", "2", "3", "#4", "5", "6", "7"],
        "description": "Major with a raised 4th — dreamy, floating, otherworldly.",
        "vibe": "Dreamy, magical, floating, cinematic, ethereal",
        "genre_uses": "Film scores, progressive rock, video game music, ambient",
        "daw_tip": "F Lydian = C major starting on F. The #4 creates tension that resolves beautifully — try it for cinematic pads.",
    },
    "mixolydian": {
        "label": "Mixolydian",
        "intervals": [0, 2, 4, 5, 7, 9, 10],
        "degrees": ["1", "2", "3", "4", "5", "6", "♭7"],
        "description": "Major with a ♭7 — bright but with a bluesy, rock edge.",
        "vibe": "Bluesy, rock, upbeat, slightly bittersweet",
        "genre_uses": "Rock, blues, funk, folk, reggae, classic rock",
        "daw_tip": "G Mixolydian = C major starting on G. The characteristic I-♭VII-IV riff is everywhere in rock.",
    },
    "locrian": {
        "label": "Locrian",
        "intervals": [0, 1, 3, 5, 6, 8, 10],
        "degrees": ["1", "♭2", "♭3", "4", "♭5", "♭6", "♭7"],
        "description": "The darkest mode — diminished tonic triad, extremely unstable and tense.",
        "vibe": "Ominous, tense, unstable, cinematic, horror",
        "genre_uses": "Metal, jazz (half-diminished scales), horror/thriller film scores",
        "daw_tip": "B Locrian = C major starting on B. Almost never used as a tonal centre — better for colour or tension passages.",
    },
    "harmonic_minor": {
        "label": "Harmonic Minor",
        "intervals": [0, 2, 3, 5, 7, 8, 11],
        "degrees": ["1", "2", "♭3", "4", "5", "♭6", "7"],
        "description": "Natural minor with a raised 7th — creates a strong V7 chord for resolution.",
        "vibe": "Dark, exotic, Spanish, classical, dramatic",
        "genre_uses": "Classical, flamenco, metal, jazz, Middle Eastern",
        "daw_tip": "The raised 7th creates an augmented 2nd (♭6-7) — that distinctive Arabic/Spanish sound. Perfect for ii-V7-i in minor.",
    },
    "melodic_minor": {
        "label": "Melodic Minor",
        "intervals": [0, 2, 3, 5, 7, 9, 11],
        "degrees": ["1", "2", "♭3", "4", "5", "6", "7"],
        "description": "Minor scale with raised 6th and 7th. Jazz musicians use this ascending form everywhere.",
        "vibe": "Sophisticated, smooth, jazz, modern",
        "genre_uses": "Jazz, fusion, modern classical, sophisticated R&B",
        "daw_tip": "Also called 'Jazz Minor'. D melodic minor is one of the most used scales in jazz — especially over altered dominant chords.",
    },
    "major_pentatonic": {
        "label": "Major Pentatonic",
        "intervals": [0, 2, 4, 7, 9],
        "degrees": ["1", "2", "3", "5", "6"],
        "description": "5-note major scale — no tension notes. Sounds great over almost anything.",
        "vibe": "Bright, open, uplifting, country, pop",
        "genre_uses": "Country, pop, rock, gospel, folk",
        "daw_tip": "No wrong notes — use it for melodies when you want guaranteed consonance. C major pentatonic = C D E G A.",
    },
    "minor_pentatonic": {
        "label": "Minor Pentatonic",
        "intervals": [0, 3, 5, 7, 10],
        "degrees": ["1", "♭3", "4", "5", "♭7"],
        "description": "5-note minor scale — the backbone of blues, rock, and hip-hop leads.",
        "vibe": "Bluesy, dark, raw, soulful",
        "genre_uses": "Blues, rock, hip-hop, trap, R&B, metal",
        "daw_tip": "The most essential scale for improvisation. Am pentatonic = A C D E G. Every note works over Am, C, Em, and more.",
    },
    "blues": {
        "label": "Blues Scale",
        "intervals": [0, 3, 5, 6, 7, 10],
        "degrees": ["1", "♭3", "4", "♭5", "5", "♭7"],
        "description": "Minor pentatonic + the ♭5 (blue note). Gritty, expressive, raw.",
        "vibe": "Gritty, expressive, emotional, raw, authentic",
        "genre_uses": "Blues, rock, R&B, jazz, hip-hop, soul",
        "daw_tip": "The ♭5 (tritone) is the 'blue note' — use it as a passing tone between 4 and 5 for that authentic blues feel.",
    },
    "whole_tone": {
        "label": "Whole Tone",
        "intervals": [0, 2, 4, 6, 8, 10],
        "degrees": ["1", "2", "3", "#4", "#5", "♭7"],
        "description": "All whole steps — dreamy, floating, with no leading tone. Debussy's favourite.",
        "vibe": "Dreamy, floating, ambiguous, ethereal, impressionist",
        "genre_uses": "Jazz, impressionist classical, film scores, ambient",
        "daw_tip": "Only 2 whole tone scales exist (starting on C or C#). Everything is symmetrical — all chords are augmented.",
    },
    "diminished_hw": {
        "label": "Diminished (Half-Whole)",
        "intervals": [0, 1, 3, 4, 6, 7, 9, 10],
        "degrees": ["1", "♭2", "♭3", "3", "♭5", "5", "6", "♭7"],
        "description": "8-note scale alternating half and whole steps. Very tense and complex.",
        "vibe": "Tense, complex, jazz, cinematic, unpredictable",
        "genre_uses": "Jazz, fusion, horror scores, progressive music",
        "daw_tip": "Used over dominant 7 chords (half-whole starting on the root). Symmetrical — repeats every minor 3rd.",
    },
    "chromatic": {
        "label": "Chromatic",
        "intervals": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        "degrees": ["1", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"],
        "description": "All 12 notes. Used for passing tones and chromatic runs rather than as a key.",
        "vibe": "Chromatic, passing, transitional",
        "genre_uses": "Jazz, classical, bebop, chromatic voice leading",
        "daw_tip": "Use chromatic notes as passing tones between scale tones. Playing an entire chromatic scale suggests bebop or jazz.",
    },
}

# ---------------------------------------------------------------------------
# Interval Reference
# ---------------------------------------------------------------------------

INTERVALS: list[dict[str, Any]] = [
    {"semitones": 0,  "name": "Unison",            "abbreviation": "P1",  "quality": "Perfect",    "example": "C → C",  "description": "Same note. No movement."},
    {"semitones": 1,  "name": "Minor 2nd",          "abbreviation": "m2",  "quality": "Minor",      "example": "C → Db", "description": "Half step. Maximum dissonance. Used as a tension tone."},
    {"semitones": 2,  "name": "Major 2nd",          "abbreviation": "M2",  "quality": "Major",      "example": "C → D",  "description": "Whole step. The 2nd degree of the major scale."},
    {"semitones": 3,  "name": "Minor 3rd",          "abbreviation": "m3",  "quality": "Minor",      "example": "C → Eb", "description": "Defines minor quality in a chord. Dark and melancholic."},
    {"semitones": 4,  "name": "Major 3rd",          "abbreviation": "M3",  "quality": "Major",      "example": "C → E",  "description": "Defines major quality in a chord. Bright and happy."},
    {"semitones": 5,  "name": "Perfect 4th",        "abbreviation": "P4",  "quality": "Perfect",    "example": "C → F",  "description": "Open, powerful. Suspended chords use this instead of the 3rd."},
    {"semitones": 6,  "name": "Tritone (Aug 4th)",  "abbreviation": "TT",  "quality": "Augmented",  "example": "C → F#", "description": "Maximum tension. Divides the octave exactly in half. Historically 'diabolus in musica'."},
    {"semitones": 7,  "name": "Perfect 5th",        "abbreviation": "P5",  "quality": "Perfect",    "example": "C → G",  "description": "The most stable interval after unison/octave. Power chords are root + 5th."},
    {"semitones": 8,  "name": "Minor 6th",          "abbreviation": "m6",  "quality": "Minor",      "example": "C → Ab", "description": "Dark but beautiful. Found in minor key melodies. Inverse of the major 3rd."},
    {"semitones": 9,  "name": "Major 6th",          "abbreviation": "M6",  "quality": "Major",      "example": "C → A",  "description": "Bright, uplifting. Adds sweetness to major chords. Inverse of the minor 3rd."},
    {"semitones": 10, "name": "Minor 7th",          "abbreviation": "m7",  "quality": "Minor",      "example": "C → Bb", "description": "Slightly tense. Defines dominant and minor 7th chords."},
    {"semitones": 11, "name": "Major 7th",          "abbreviation": "M7",  "quality": "Major",      "example": "C → B",  "description": "Dreamy, lush tension one half step below the octave. Defines major 7th chords."},
    {"semitones": 12, "name": "Octave",             "abbreviation": "P8",  "quality": "Perfect",    "example": "C → C'", "description": "Same pitch class, one octave higher. Perfectly consonant."},
    {"semitones": 14, "name": "Major 9th",          "abbreviation": "M9",  "quality": "Major",      "example": "C → D'", "description": "The 2nd an octave up. Extension tone — adds colour and air to a chord."},
    {"semitones": 17, "name": "Perfect 11th",       "abbreviation": "P11", "quality": "Perfect",    "example": "C → F'", "description": "The 4th an octave up. Creates lush, stacked-chord voicings in jazz."},
    {"semitones": 21, "name": "Major 13th",         "abbreviation": "M13", "quality": "Major",      "example": "C → A'", "description": "The 6th two octaves up. The highest extension — adds shimmer to dominant chords."},
]

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def list_chord_types() -> list[dict[str, Any]]:
    """Return all chord types with their metadata (no note computation)."""
    result = []
    for key, data in CHORD_TYPES.items():
        result.append({
            "key": key,
            "label": data["label"],
            "quality": data["quality"],
            "description": data["description"],
            "use_cases": data["use_cases"],
            "tension": data["tension"],
            "interval_names": data["interval_names"],
        })
    return result


def get_chord(root: str, chord_type: str, prefer_flats: bool | None = None) -> dict[str, Any]:
    """
    Return full chord info for a given root and chord type key.
    e.g. get_chord('C', 'maj7')
    """
    if chord_type not in CHORD_TYPES:
        raise ValueError(f"Unknown chord type '{chord_type}'. Valid: {list(CHORD_TYPES.keys())}")

    cd = CHORD_TYPES[chord_type]

    if prefer_flats is None:
        prefer_flats = root in _FLAT_KEYS or root.endswith("b")

    notes = _build_notes(root, cd["intervals"], prefer_flats=prefer_flats)

    return {
        "name": f"{root}{cd['label'].split()[0].replace('Major','maj').replace('Minor','m').replace('Dominant','').replace('th','').replace(' ','') if chord_type not in ('maj','min','dim','aug') else ''}",
        "root": root,
        "chord_type": chord_type,
        "label": cd["label"],
        "quality": cd["quality"],
        "notes": notes,
        "intervals": cd["intervals"],
        "interval_names": cd["interval_names"],
        "description": cd["description"],
        "use_cases": cd["use_cases"],
        "tension": cd["tension"],
    }


def list_scale_types() -> list[dict[str, Any]]:
    """Return all scale types with metadata (no note computation)."""
    result = []
    for key, data in SCALE_TYPES.items():
        result.append({
            "key": key,
            "label": data["label"],
            "description": data["description"],
            "vibe": data["vibe"],
            "genre_uses": data["genre_uses"],
            "note_count": len(data["intervals"]),
        })
    return result


def get_scale(root: str, scale_type: str) -> dict[str, Any]:
    """
    Return full scale info for a given root and scale type key.
    e.g. get_scale('A', 'minor_pentatonic')
    """
    if scale_type not in SCALE_TYPES:
        raise ValueError(f"Unknown scale type '{scale_type}'. Valid: {list(SCALE_TYPES.keys())}")

    sd = SCALE_TYPES[scale_type]

    prefer_flats = root in _FLAT_KEYS or root.endswith("b")
    notes = _build_notes(root, sd["intervals"], prefer_flats=prefer_flats)

    # Build note-degree pairs
    note_degrees = [{"note": n, "degree": d} for n, d in zip(notes, sd["degrees"])]

    return {
        "name": f"{root} {sd['label']}",
        "root": root,
        "scale_type": scale_type,
        "label": sd["label"],
        "notes": notes,
        "note_degrees": note_degrees,
        "intervals": sd["intervals"],
        "degrees": sd["degrees"],
        "description": sd["description"],
        "vibe": sd["vibe"],
        "genre_uses": sd["genre_uses"],
        "daw_tip": sd["daw_tip"],
        "note_count": len(notes),
    }


def get_intervals() -> list[dict[str, Any]]:
    """Return the full interval reference table."""
    return INTERVALS


def get_all_notes() -> list[str]:
    """Return the list of all 12 chromatic note names (sharps)."""
    return CHROMATIC.copy()
