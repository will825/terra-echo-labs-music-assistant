"""
Terra Echo Labs — PyInstaller entry point.
This file is used as the target for PyInstaller bundling.
In production the Electron main process spawns this binary directly.
In development, the backend is started via: npm run backend
"""

from __future__ import annotations

import os
import sys
from pathlib import Path


def _configure_paths() -> None:
    """Set up sys.path and working directory for both frozen and dev contexts."""
    if getattr(sys, "frozen", False):
        # PyInstaller extracts everything to sys._MEIPASS
        base = Path(sys._MEIPASS)  # type: ignore[attr-defined]
        sys.path.insert(0, str(base))
        # Writable data dir is passed via env var from Electron main process
        data_dir = os.environ.get("TEL_DATA_DIR", str(Path.home() / "Library" / "Application Support" / "Terra Echo Labs"))
        os.environ.setdefault("TEL_DATA_DIR", data_dir)
        Path(data_dir).mkdir(parents=True, exist_ok=True)
    else:
        # Dev: project root is two levels up from this file
        root = Path(__file__).parent.parent
        sys.path.insert(0, str(root))


_configure_paths()

import uvicorn  # noqa: E402 — must come after path setup


if __name__ == "__main__":
    port = int(os.environ.get("TEL_PORT", "8002"))
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=port,
        log_level="warning",
        access_log=False,
    )
