"""
Terra Echo Labs — Daily Creative Engine Router (Sprint 4)
Endpoints:
  GET  /daily/today           → Full daily content bundle
  POST /daily/challenge/{id}/complete → Mark a challenge as done
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.daily_engine import get_daily_content, mark_challenge_complete

router = APIRouter()


@router.get("/today")
def get_today() -> dict:
    """Return the full daily content: chord, tip, prompt, challenge."""
    try:
        data = get_daily_content()
        return {"success": True, "data": data, "error": None}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/challenge/{challenge_id}/complete")
def complete_challenge(challenge_id: int) -> dict:
    """Mark a daily challenge as completed."""
    ok = mark_challenge_complete(challenge_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Challenge {challenge_id} not found")
    return {"success": True, "data": {"completed": True, "id": challenge_id}, "error": None}
