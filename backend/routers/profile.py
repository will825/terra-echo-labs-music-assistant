"""
Terra Echo Labs — Profile / Genre DNA Router (Sprint 2)
Endpoints:
  GET  /profile/quiz               — return onboarding quiz questions
  GET  /profile/has                — check if user has a profile saved
  GET  /profile/                   — get user's active profile
  GET  /profile/all                — get all saved profiles
  POST /profile/                   — create a new profile
  PUT  /profile/{profile_id}       — update an existing profile
  DELETE /profile/{profile_id}     — delete a profile

  GET  /profile/progressions       — list saved AI progressions
  POST /profile/progressions/save  — save an AI-generated progression
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.profile_manager import (
    delete_profile,
    get_all_profiles,
    get_profile,
    get_quiz_questions,
    get_saved_progressions,
    has_profile,
    save_progression,
    upsert_profile,
)

router = APIRouter()

# Hard-coded to user_id=1 for v1.0 single-user app
_USER_ID = 1


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class ProfileBody(BaseModel):
    genre: str = Field("Lo-Fi Hip Hop")
    tempo_range: str = Field("70-90")
    mood_tags: list[str] = Field(default_factory=list)
    fav_keys: list[str] = Field(default_factory=list)
    fav_scales: list[str] = Field(default_factory=list)
    complexity: int = Field(2, ge=1, le=3)


class SaveProgressionBody(BaseModel):
    title: str = Field("Untitled Progression")
    chords: list[str] = Field(default_factory=list)
    key: str = Field("")
    scale: str = Field("")
    genre: str = Field("")
    tempo: int = Field(80, ge=40, le=240)
    source: str = Field("ai")
    midi_path: str = Field("")
    notes: str = Field("")


# ---------------------------------------------------------------------------
# Profile routes
# ---------------------------------------------------------------------------


@router.get("/quiz")
def quiz() -> dict[str, Any]:
    """Return onboarding quiz question definitions."""
    return {"success": True, "data": get_quiz_questions(), "error": None}


@router.get("/has")
def has() -> dict[str, Any]:
    """Check if the current user has completed onboarding."""
    return {"success": True, "data": {"has_profile": has_profile(_USER_ID)}, "error": None}


@router.get("/all")
def all_profiles() -> dict[str, Any]:
    """Return all profiles for the current user."""
    return {"success": True, "data": get_all_profiles(_USER_ID), "error": None}


@router.get("/")
def get_active_profile() -> dict[str, Any]:
    """Return the user's most recently updated profile."""
    profile = get_profile(_USER_ID)
    if profile is None:
        return {"success": True, "data": None, "error": None}
    return {"success": True, "data": profile, "error": None}


@router.post("/")
def create_profile(body: ProfileBody) -> dict[str, Any]:
    """Create a new Genre DNA profile."""
    profile = upsert_profile(
        user_id=_USER_ID,
        genre=body.genre,
        tempo_range=body.tempo_range,
        mood_tags=body.mood_tags,
        fav_keys=body.fav_keys,
        fav_scales=body.fav_scales,
        complexity=body.complexity,
    )
    return {"success": True, "data": profile, "error": None}


@router.put("/{profile_id}")
def update_profile(profile_id: int, body: ProfileBody) -> dict[str, Any]:
    """Update an existing Genre DNA profile."""
    profile = upsert_profile(
        user_id=_USER_ID,
        genre=body.genre,
        tempo_range=body.tempo_range,
        mood_tags=body.mood_tags,
        fav_keys=body.fav_keys,
        fav_scales=body.fav_scales,
        complexity=body.complexity,
        profile_id=profile_id,
    )
    return {"success": True, "data": profile, "error": None}


@router.delete("/{profile_id}")
def remove_profile(profile_id: int) -> dict[str, Any]:
    """Delete a Genre DNA profile."""
    deleted = delete_profile(profile_id, _USER_ID)
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True, "data": {"deleted": True}, "error": None}


# ---------------------------------------------------------------------------
# Saved Progressions routes
# ---------------------------------------------------------------------------


@router.get("/progressions")
def list_progressions() -> dict[str, Any]:
    """Return saved progressions for the current user."""
    progressions = get_saved_progressions(_USER_ID)
    return {"success": True, "data": progressions, "error": None}


@router.post("/progressions/save")
def save(body: SaveProgressionBody) -> dict[str, Any]:
    """Save an AI-generated (or manual) progression to the database."""
    progression = save_progression(
        user_id=_USER_ID,
        title=body.title,
        chords=body.chords,
        key=body.key,
        scale=body.scale,
        genre=body.genre,
        tempo=body.tempo,
        source=body.source,
        midi_path=body.midi_path,
        notes=body.notes,
    )
    return {"success": True, "data": progression, "error": None}
