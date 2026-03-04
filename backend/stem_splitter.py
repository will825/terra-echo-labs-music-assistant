"""
Terra Echo Labs — Stem Splitter (Sprint 3)
Splits audio into stems using Demucs v4 (htdemucs model).
Uses PyTorch MPS backend for Metal GPU acceleration on Mac.
Long-running jobs are tracked in a thread-safe in-memory store.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------

OUTPUT_DIR = Path(__file__).parent.parent / "output" / "stems"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Stem model options
# ---------------------------------------------------------------------------

MODELS = {
    "htdemucs": {
        "label": "HTDemucs (4-stem)",
        "stems": ["vocals", "drums", "bass", "other"],
        "description": "High-quality 4-stem separation (vocals, drums, bass, other)",
    },
    "htdemucs_6s": {
        "label": "HTDemucs 6-stem",
        "stems": ["vocals", "drums", "bass", "other", "guitar", "piano"],
        "description": "6-stem separation — adds guitar and piano tracks",
    },
    "mdx_extra": {
        "label": "MDX Extra (4-stem)",
        "stems": ["vocals", "drums", "bass", "other"],
        "description": "Alternative MDX model, strong on vocals",
    },
}

# ---------------------------------------------------------------------------
# Job store
# ---------------------------------------------------------------------------

_jobs: dict[str, dict[str, Any]] = {}
_jobs_lock = threading.Lock()


def _new_job(audio_path: str, model: str) -> str:
    job_id = str(uuid.uuid4())[:8]
    with _jobs_lock:
        _jobs[job_id] = {
            "id": job_id,
            "audio_path": audio_path,
            "model": model,
            "status": "queued",   # queued | separating | done | error
            "progress": 0,
            "stems": {},          # stem_name → file_path
            "error": None,
            "created_at": time.time(),
        }
    return job_id


def _update_job(job_id: str, **kwargs: Any) -> None:
    with _jobs_lock:
        if job_id in _jobs:
            _jobs[job_id].update(kwargs)


def get_job(job_id: str) -> dict[str, Any] | None:
    with _jobs_lock:
        return dict(_jobs[job_id]) if job_id in _jobs else None


def list_jobs() -> list[dict[str, Any]]:
    with _jobs_lock:
        return [dict(j) for j in _jobs.values()]


# ---------------------------------------------------------------------------
# Core separation logic (runs in background thread)
# ---------------------------------------------------------------------------

def _run_separation(job_id: str, audio_path: str, model: str, device: str) -> None:
    """Run Demucs separation as a subprocess so stdout/stderr can be captured."""
    _update_job(job_id, status="separating", progress=10)

    audio = Path(audio_path)
    if not audio.exists():
        _update_job(job_id, status="error", error=f"File not found: {audio_path}")
        return

    stem_output_dir = OUTPUT_DIR / job_id
    stem_output_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable, "-m", "demucs",
        "--two-stems", "vocals",   # removed: gives all 4 stems
        "-n", model,
        "--device", device,
        "-o", str(stem_output_dir),
        str(audio),
    ]

    # For full 4/6 stem split, remove --two-stems
    cmd = [
        sys.executable, "-m", "demucs",
        "-n", model,
        "--device", device,
        "-o", str(stem_output_dir),
        str(audio),
    ]

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )

        # Parse Demucs progress output
        for line in proc.stdout:
            line = line.strip()
            if "%" in line:
                # Demucs prints lines like "  10%|..."
                try:
                    pct_str = line.split("%")[0].strip().split()[-1]
                    pct = int(float(pct_str))
                    _update_job(job_id, progress=10 + int(pct * 0.85))
                except (ValueError, IndexError):
                    pass

        proc.wait()

        if proc.returncode != 0:
            _update_job(job_id, status="error", error=f"Demucs exited with code {proc.returncode}")
            return

        # Locate the stem files Demucs wrote
        # Structure: <stem_output_dir>/<model>/<track_name>/<stem>.wav
        model_dir = stem_output_dir / model
        track_dirs = list(model_dir.glob("*/")) if model_dir.exists() else []

        stems: dict[str, str] = {}
        if track_dirs:
            track_dir = track_dirs[0]  # first (only) track
            for wav in track_dir.glob("*.wav"):
                stems[wav.stem] = str(wav)

        _update_job(
            job_id,
            status="done",
            progress=100,
            stems=stems,
        )

    except Exception as exc:
        _update_job(job_id, status="error", error=str(exc))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def split_stems(
    audio_path: str,
    model: str = "htdemucs",
) -> str:
    """
    Start an async stem separation job and return its job_id immediately.
    Poll get_job(job_id) to check progress.
    Uses MPS (Metal GPU) if available, falls back to CPU.
    """
    if model not in MODELS:
        model = "htdemucs"

    # Detect best available device
    try:
        import torch
        if torch.backends.mps.is_available():
            device = "mps"
        elif torch.cuda.is_available():
            device = "cuda"
        else:
            device = "cpu"
    except ImportError:
        device = "cpu"

    job_id = _new_job(audio_path, model)
    thread = threading.Thread(
        target=_run_separation,
        args=(job_id, audio_path, model, device),
        daemon=True,
    )
    thread.start()
    return job_id


def get_models() -> list[dict[str, Any]]:
    """Return available Demucs model options."""
    return [{"id": k, **v} for k, v in MODELS.items()]
