# -*- mode: python ; coding: utf-8 -*-
# Terra Echo Labs — PyInstaller spec for the FastAPI backend
# Build: bash scripts/build-backend.sh   (or: python3.11 -m PyInstaller scripts/backend.spec --distpath dist --workpath build/work)

from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

ROOT = Path(SPECPATH).parent  # project root

# ---------------------------------------------------------------------------
# Hidden imports — packages that use dynamic loading (not auto-traced)
# ---------------------------------------------------------------------------
hidden = [
    # uvicorn uses dynamic imports for loops, protocols, and lifespan
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.protocols.websockets.websockets_impl",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "uvicorn.lifespan.off",
    # starlette / fastapi
    "starlette.routing",
    "starlette.middleware.cors",
    "fastapi.middleware.cors",
    # SQLAlchemy SQLite dialect (loaded dynamically)
    "sqlalchemy.dialects.sqlite",
    "sqlalchemy.dialects.sqlite.pysqlite",
    # anyio async backends
    "anyio._backends._asyncio",
    # python-multipart (form uploads)
    "multipart",
    # backend application modules (belt-and-suspenders)
    "backend.main",
    "backend.midi_engine",
    "backend.progression_gen",
    "backend.profile_manager",
    "backend.audio_extractor",
    "backend.stem_splitter",
    "backend.daily_engine",
    "backend.theory_reference",
    "backend.routers.midi",
    "backend.routers.progression",
    "backend.routers.profile",
    "backend.routers.audio",
    "backend.routers.stems",
    "backend.routers.daily",
    "backend.routers.theory",
    "database.db",
]

# Collect all submodules of these packages (they use lots of lazy loading)
hidden += collect_submodules("uvicorn")
hidden += collect_submodules("starlette")
hidden += collect_submodules("fastapi")

# ---------------------------------------------------------------------------
# Data files — non-Python files that must ship with the bundle
# ---------------------------------------------------------------------------
datas = [
    # Database schema (read-only — actual DB lives in ~/Library/Application Support/)
    (str(ROOT / "database" / "schema.sql"), "database"),
    # Backend package source files (PyInstaller follows imports, but this is explicit)
    (str(ROOT / "backend"), "backend"),
]

# Collect data files from packages that embed their own assets
datas += collect_data_files("demucs")
datas += collect_data_files("julius")   # demucs dependency

# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------
a = Analysis(
    [str(ROOT / "backend" / "run_server.py")],
    pathex=[str(ROOT)],
    binaries=[],
    datas=datas,
    hiddenimports=hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # GUI / notebook / plotting — not needed
        "tkinter",
        "matplotlib",
        "IPython",
        "jupyter",
        "notebook",
        "PIL",
        # Test frameworks
        "pytest",
        "unittest",
        # Unused torch backends (CUDA/ROCm — Mac uses MPS/Metal)
        "torch.cuda",
    ],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="tel-backend",
    debug=False,
    strip=False,
    upx=False,   # UPX can break torch binaries; leave off
    console=True,   # keep True so stderr is visible for debugging
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    name="tel-backend",
)
