"""
Terra Echo Labs — FastAPI Backend
Runs on http://127.0.0.1:8002
Electron communicates via IPC → HTTP proxy in main/index.js
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Sprint router imports (uncomment as each sprint completes)
# ---------------------------------------------------------------------------

# Sprint 1
from backend.routers import midi

# Sprint 2
# from backend.routers import progression, profile

# Sprint 3
# from backend.routers import audio, stems

# Sprint 4
# from backend.routers import daily, theory

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Terra Echo Labs API",
    description="Music Production Intelligence Suite backend",
    version="0.1.0"
)

# Allow requests from Electron renderer (dev server + file protocol)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "app://.", "file://", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(midi.router, prefix="/midi", tags=["MIDI"])

# Sprint 2
# app.include_router(progression.router, prefix="/progression", tags=["AI Generator"])
# app.include_router(profile.router, prefix="/profile", tags=["Profile"])

# Sprint 3
# app.include_router(audio.router, prefix="/audio", tags=["Audio"])
# app.include_router(stems.router, prefix="/stems", tags=["Stems"])

# Sprint 4
# app.include_router(daily.router, prefix="/daily", tags=["Daily"])
# app.include_router(theory.router, prefix="/theory", tags=["Theory"])

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict:
    """Returns backend status. Called by Home page on launch."""
    return {"success": True, "data": {"status": "ok", "version": "0.1.0"}, "error": None}
