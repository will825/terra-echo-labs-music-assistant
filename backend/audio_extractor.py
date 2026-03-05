"""
Terra Echo Labs — YouTube → WAV Extractor (Sprint 3)
Downloads audio from a YouTube URL and converts to 24-bit / 48 kHz WAV
using yt-dlp + ffmpeg.  Long-running jobs are tracked in a thread-safe
in-memory store so the API can return immediately and be polled for status.
"""

from __future__ import annotations

import threading
import time
import uuid
from pathlib import Path
from typing import Any, Callable

import yt_dlp

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------

OUTPUT_DIR = Path(__file__).parent.parent / "output" / "audio"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Job store  (job_id → dict)
# ---------------------------------------------------------------------------

_jobs: dict[str, dict[str, Any]] = {}
_jobs_lock = threading.Lock()


def _new_job(url: str) -> str:
    job_id = str(uuid.uuid4())[:8]
    with _jobs_lock:
        _jobs[job_id] = {
            "id": job_id,
            "url": url,
            "status": "queued",   # queued | downloading | converting | done | error
            "progress": 0,
            "title": "",
            "filename": "",
            "path": "",
            "duration": 0,
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
# Core extraction logic (runs in background thread)
# ---------------------------------------------------------------------------

def _run_extraction(job_id: str, url: str, sample_rate: int, bit_depth: int) -> None:
    """Download best audio from YouTube and convert to WAV via ffmpeg post-processor."""
    _update_job(job_id, status="downloading", progress=5)

    # yt-dlp progress hook
    def ydl_progress_hook(d: dict) -> None:
        if d.get("status") == "downloading":
            pct = d.get("downloaded_bytes", 0) / max(d.get("total_bytes") or d.get("total_bytes_estimate") or 1, 1)
            _update_job(job_id, progress=int(5 + pct * 60))
        elif d.get("status") == "finished":
            _update_job(job_id, status="converting", progress=70)

    sample_fmt = "s32" if bit_depth >= 24 else "s16"

    ydl_opts: dict[str, Any] = {
        # Prefer native audio-only streams (m4a/opus/webm) to avoid downloading
        # a video+audio muxed file which is much larger and slower.
        "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio[ext=opus]/bestaudio/best[vcodec=none]/best",
        "outtmpl": str(OUTPUT_DIR / "%(title)s.%(ext)s"),
        "progress_hooks": [ydl_progress_hook],
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,   # only download the single video, ignore playlist params
        # Only FFmpegExtractAudio — FFmpegAudioConvertor does not exist in yt-dlp
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
            },
        ],
        # Target sample rate + bit depth via ffmpeg args on the extract step
        "postprocessor_args": {
            "ffmpegextractaudio": [
                "-ar", str(sample_rate),
                "-sample_fmt", sample_fmt,
            ],
        },
        "prefer_ffmpeg": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title", "audio")
            duration = info.get("duration", 0)

        # Find the .wav file yt-dlp wrote
        safe_title = yt_dlp.utils.sanitize_filename(title)
        wav_path = OUTPUT_DIR / f"{safe_title}.wav"

        # Fallback: find newest .wav in output dir
        if not wav_path.exists():
            wavs = sorted(OUTPUT_DIR.glob("*.wav"), key=lambda p: p.stat().st_mtime, reverse=True)
            if wavs:
                wav_path = wavs[0]

        _update_job(
            job_id,
            status="done",
            progress=100,
            title=title,
            filename=wav_path.name,
            path=str(wav_path),
            duration=duration,
        )

    except Exception as exc:
        _update_job(job_id, status="error", error=str(exc))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_audio(
    url: str,
    sample_rate: int = 48000,
    bit_depth: int = 24,
) -> str:
    """
    Start an async extraction job and return its job_id immediately.
    Poll get_job(job_id) to check progress.
    """
    job_id = _new_job(url)
    thread = threading.Thread(
        target=_run_extraction,
        args=(job_id, url, sample_rate, bit_depth),
        daemon=True,
    )
    thread.start()
    return job_id
