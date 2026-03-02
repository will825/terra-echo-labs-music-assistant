"""
MIDI Chord Engine — FastAPI router
Endpoints:
  GET  /midi/chords          — list all supported chord types
  GET  /midi/voicings        — list all voicing styles
  POST /midi/parse           — parse a chord name → MIDI notes + note names
  POST /midi/progression     — build a chord progression → download .mid file
"""

from __future__ import annotations
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.midi_engine import (
    parse_chord,
    get_voicing,
    progression_to_midi,
    list_chord_types,
    list_voicing_styles,
    midi_notes_to_names,
)

router = APIRouter()

VoicingStyle = Literal["closed", "open", "drop2", "inv1", "inv2", "inv3"]


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ParseChordRequest(BaseModel):
    chord: str = Field(..., example="Cm7", description="Chord name to parse")
    octave: int = Field(4, ge=0, le=8, description="Root octave (default 4 = middle C)")
    voicing: VoicingStyle = Field("closed", description="Voicing style to apply")


class ParseChordResponse(BaseModel):
    chord: str
    quality: str
    midi_notes: list[int]
    note_names: list[str]
    voicing: str


class ProgressionRequest(BaseModel):
    chords: list[str] = Field(..., min_length=1, example=["Cm7", "Fm7", "Ab", "Bb"])
    tempo: int = Field(80, ge=20, le=300, description="BPM")
    beats_per_chord: int = Field(4, ge=1, le=16)
    octave: int = Field(4, ge=0, le=8)
    voicing: VoicingStyle = Field("closed")
    velocity: int = Field(80, ge=1, le=127)
    instrument_program: int = Field(0, ge=0, le=127, description="GM instrument program (0 = Grand Piano)")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/chords")
def get_chord_types() -> dict:
    """Return all supported chord qualities and their interval sets."""
    return {
        "success": True,
        "data": list_chord_types(),
        "error": None
    }


@router.get("/voicings")
def get_voicing_styles() -> dict:
    """Return all supported voicing style names."""
    return {
        "success": True,
        "data": list_voicing_styles(),
        "error": None
    }


@router.post("/parse")
def parse_chord_endpoint(req: ParseChordRequest) -> dict:
    """
    Parse a chord name and return MIDI notes with optional voicing applied.
    """
    try:
        raw_notes = parse_chord(req.chord, octave=req.octave)
        voiced_notes = get_voicing(raw_notes, style=req.voicing)

        from backend.midi_engine import _split_chord_name
        _root, quality = _split_chord_name(req.chord)

        return {
            "success": True,
            "data": ParseChordResponse(
                chord=req.chord,
                quality=quality,
                midi_notes=voiced_notes,
                note_names=midi_notes_to_names(voiced_notes),
                voicing=req.voicing,
            ).model_dump(),
            "error": None
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/progression")
def build_progression(req: ProgressionRequest) -> dict:
    """
    Convert a chord progression to a MIDI file.
    Returns JSON with the saved file path (desktop app — file is written locally).
    """
    try:
        midi_path = progression_to_midi(
            chords=req.chords,
            tempo=req.tempo,
            beats_per_chord=req.beats_per_chord,
            octave=req.octave,
            voicing=req.voicing,
            velocity=req.velocity,
            instrument_program=req.instrument_program,
        )
        return {
            "success": True,
            "data": {
                "path": midi_path,
                "filename": midi_path.split("/")[-1],
                "chords": req.chords,
                "tempo": req.tempo,
            },
            "error": None,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/preview")
def preview_progression(req: ProgressionRequest) -> dict:
    """
    Parse all chords in a progression and return their note data (no file written).
    Useful for the UI to display chord notes before exporting.
    """
    results = []
    try:
        for chord_name in req.chords:
            raw = parse_chord(chord_name, octave=req.octave)
            voiced = get_voicing(raw, style=req.voicing)
            results.append({
                "chord": chord_name,
                "midi_notes": voiced,
                "note_names": midi_notes_to_names(voiced),
            })
        return {"success": True, "data": results, "error": None}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
