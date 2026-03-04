"""
Terra Echo Labs — YouTube → WAV Router (Sprint 3)
Endpoints:
  POST /audio/extract          — start a YouTube download + WAV conversion job
  GET  /audio/jobs             — list all extraction jobs
  GET  /audio/jobs/{job_id}    — get status of a specific job
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.audio_extractor import extract_audio, get_job, list_jobs

router = APIRouter()


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------

class ExtractRequest(BaseModel):
    url: str = Field(..., description="YouTube URL to download")
    sample_rate: int = Field(96000, description="Output sample rate (Hz)")
    bit_depth: int = Field(24, description="Output bit depth (16 or 24)")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/extract")
def start_extraction(req: ExtractRequest) -> dict[str, Any]:
    """Start a YouTube audio extraction job. Returns job_id immediately."""
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=422, detail="URL cannot be empty")

    # Basic sanity check — yt-dlp will validate properly
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=422, detail="URL must start with http:// or https://")

    job_id = extract_audio(
        url=url,
        sample_rate=req.sample_rate,
        bit_depth=req.bit_depth,
    )
    return {
        "success": True,
        "data": {"job_id": job_id, "status": "queued"},
        "error": None,
    }


@router.get("/jobs")
def get_all_jobs() -> dict[str, Any]:
    """Return all audio extraction jobs."""
    return {"success": True, "data": list_jobs(), "error": None}


@router.get("/jobs/{job_id}")
def get_job_status(job_id: str) -> dict[str, Any]:
    """Poll the status of a specific extraction job."""
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return {"success": True, "data": job, "error": None}
