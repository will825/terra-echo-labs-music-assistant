#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Terra Echo Labs — Build the PyInstaller backend binary
# Usage: bash scripts/build-backend.sh
# Output: dist/tel-backend/tel-backend  (bundled into .dmg via extraResources)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PYTHON="python3.11"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "▶  Terra Echo Labs — Backend Build"
echo "   Python: $($PYTHON --version)"
echo "   Root:   $ROOT"
echo ""

# Ensure PyInstaller is available
if ! $PYTHON -m PyInstaller --version &>/dev/null; then
  echo "⚠  PyInstaller not found — installing..."
  $PYTHON -m pip install pyinstaller
fi

# Clean previous build artifacts
echo "🗑  Cleaning old build artifacts..."
rm -rf "$ROOT/dist/tel-backend" "$ROOT/build/work"

# Run PyInstaller
echo "🔨 Running PyInstaller..."
cd "$ROOT"
$PYTHON -m PyInstaller \
  scripts/backend.spec \
  --distpath dist \
  --workpath build/work \
  --noconfirm \
  --clean

# Verify output
BINARY="$ROOT/dist/tel-backend/tel-backend"
if [ -f "$BINARY" ]; then
  SIZE=$(du -sh "$ROOT/dist/tel-backend" | cut -f1)
  echo ""
  echo "✅ Backend binary built successfully!"
  echo "   Location: dist/tel-backend/tel-backend"
  echo "   Bundle size: $SIZE"
  echo ""
  echo "▶  Next: run 'npm run package' to build the full .dmg"
else
  echo "❌ Build failed — binary not found at dist/tel-backend/tel-backend"
  exit 1
fi
