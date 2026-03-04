"""
Terra Echo Labs — Music Theory Reference Router (Sprint 4)
Endpoints:
  GET /theory/notes              → All 12 chromatic note names
  GET /theory/chord-types        → All chord types (no root needed)
  GET /theory/chord              → Chord notes for ?root=C&type=maj7
  GET /theory/scale-types        → All scale types (no root needed)
  GET /theory/scale              → Scale notes for ?root=A&type=minor_pentatonic
  GET /theory/intervals          → Full interval reference table
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.theory_reference import (
    analyze_progression,
    get_all_notes,
    get_chord,
    get_intervals,
    get_scale,
    list_chord_types,
    list_scale_types,
)


class ProgressionRequest(BaseModel):
    chords: list[str]

router = APIRouter()


@router.get("/notes")
def notes() -> dict:
    """Return all 12 chromatic note names."""
    return {"success": True, "data": get_all_notes(), "error": None}


@router.get("/chord-types")
def chord_types() -> dict:
    """Return all available chord types with metadata."""
    return {"success": True, "data": list_chord_types(), "error": None}


@router.get("/chord")
def chord(
    root: str = Query(..., description="Root note, e.g. C, F#, Bb"),
    type: str = Query(..., description="Chord type key, e.g. maj7, min9, dim7"),
) -> dict:
    """Return full chord info (notes, intervals, description) for root + type."""
    try:
        data = get_chord(root=root, chord_type=type)
        return {"success": True, "data": data, "error": None}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/scale-types")
def scale_types() -> dict:
    """Return all available scale types with metadata."""
    return {"success": True, "data": list_scale_types(), "error": None}


@router.get("/scale")
def scale(
    root: str = Query(..., description="Root note, e.g. A, C#, F"),
    type: str = Query(..., description="Scale type key, e.g. major, dorian, blues"),
) -> dict:
    """Return full scale info (notes, degrees, description, DAW tip) for root + type."""
    try:
        data = get_scale(root=root, scale_type=type)
        return {"success": True, "data": data, "error": None}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/intervals")
def intervals() -> dict:
    """Return the full interval reference table."""
    return {"success": True, "data": get_intervals(), "error": None}


@router.post("/analyze-progression")
def analyze_progression_endpoint(req: ProgressionRequest) -> dict:
    """
    Analyze a chord progression and return best-fit scales + per-chord playing tips.
    Body: { "chords": ["Am", "Em", "Dm", "G"] }
    """
    try:
        data = analyze_progression(req.chords)
        if data.get("error") and not data.get("best_scales"):
            raise HTTPException(status_code=400, detail=data["error"])
        return {"success": True, "data": data, "error": None}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
