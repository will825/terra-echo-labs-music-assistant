"""
Terra Echo Labs — AI Progression Generator Router (Sprint 2)
Endpoints:
  POST /progression/generate      — generate a progression via Claude Haiku
  GET  /progression/genres        — list available genre presets
  GET  /progression/moods         — list available moods
  GET  /progression/cache/stats   — cache utilisation
  POST /progression/cache/clear   — flush cache
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.progression_gen import (
    GENRE_PRESETS,
    MOOD_DESCRIPTORS,
    clear_cache,
    generate_progression,
    get_cache_stats,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class GenerateRequest(BaseModel):
    genre: str = Field("Lo-Fi Hip Hop", description="Music genre")
    mood: str = Field("chill", description="Emotional mood")
    key: str = Field("C", description="Root key, e.g. 'C', 'F#', 'Bb'")
    scale: str = Field("minor", description="Scale/mode, e.g. 'minor', 'dorian'")
    num_chords: int = Field(4, ge=2, le=12, description="Number of chords to generate")
    complexity: int = Field(2, ge=1, le=3, description="1=simple, 2=moderate, 3=complex")
    tempo: int = Field(80, ge=40, le=240, description="BPM")
    extra_instructions: str = Field("", description="Optional freeform instructions for the AI")
    bypass_cache: bool = Field(False, description="Force a fresh API call, ignoring cache")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/generate")
def generate(req: GenerateRequest) -> dict[str, Any]:
    """Generate a chord progression using Claude claude-3-5-haiku-20241022."""
    try:
        result = generate_progression(
            genre=req.genre,
            mood=req.mood,
            key=req.key,
            scale=req.scale,
            num_chords=req.num_chords,
            complexity=req.complexity,
            tempo=req.tempo,
            extra_instructions=req.extra_instructions,
            bypass_cache=req.bypass_cache,
        )
        return {"success": True, "data": result, "error": None}
    except ValueError as exc:
        # Missing API key — user-facing message
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/genres")
def list_genres() -> dict[str, Any]:
    """Return available genre presets and their metadata."""
    genres = [
        {
            "name": name,
            "tempo_range": meta.get("tempo_range", ""),
            "feel": meta.get("feel", ""),
            "common_chords": meta.get("common_chords", []),
        }
        for name, meta in GENRE_PRESETS.items()
    ]
    return {"success": True, "data": genres, "error": None}


@router.get("/moods")
def list_moods() -> dict[str, Any]:
    """Return available moods and their descriptions."""
    moods = [{"name": name, "description": desc} for name, desc in MOOD_DESCRIPTORS.items()]
    return {"success": True, "data": moods, "error": None}


@router.get("/cache/stats")
def cache_stats() -> dict[str, Any]:
    """Return in-memory cache utilisation stats."""
    return {"success": True, "data": get_cache_stats(), "error": None}


@router.post("/cache/clear")
def cache_clear() -> dict[str, Any]:
    """Flush the in-memory progression cache."""
    clear_cache()
    return {"success": True, "data": {"message": "Cache cleared"}, "error": None}
