"""
Terra Echo Labs — Stem Splitter Router (Sprint 3)
Endpoints:
  GET  /stems/models           — list available Demucs models
  POST /stems/split            — start a stem separation job
  GET  /stems/jobs             — list all separation jobs
  GET  /stems/jobs/{job_id}    — get status of a specific job
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.stem_splitter import get_job, get_models, list_jobs, split_stems

router = APIRouter()


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------

class SplitRequest(BaseModel):
    audio_path: str = Field(..., description="Absolute path to the local WAV/MP3/FLAC file")
    model: str = Field("htdemucs", description="Demucs model: htdemucs | htdemucs_6s | mdx_extra")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/models")
def list_models() -> dict[str, Any]:
    """Return available Demucs model options."""
    return {"success": True, "data": get_models(), "error": None}


@router.post("/split")
def start_split(req: SplitRequest) -> dict[str, Any]:
    """Start a stem separation job. Returns job_id immediately."""
    path = req.audio_path.strip()
    if not path:
        raise HTTPException(status_code=422, detail="audio_path cannot be empty")

    job_id = split_stems(audio_path=path, model=req.model)
    return {
        "success": True,
        "data": {"job_id": job_id, "status": "queued"},
        "error": None,
    }


@router.get("/jobs")
def get_all_jobs() -> dict[str, Any]:
    """Return all stem separation jobs."""
    return {"success": True, "data": list_jobs(), "error": None}


@router.get("/jobs/{job_id}")
def get_job_status(job_id: str) -> dict[str, Any]:
    """Poll the status of a specific separation job."""
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return {"success": True, "data": job, "error": None}
