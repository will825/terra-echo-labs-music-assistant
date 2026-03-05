<img src="src/renderer/src/assets/logo.png" width="80" alt="Terra Echo Labs Logo" />

# Terra Echo Labs
### Music Production Intelligence Suite

> A macOS desktop app for music producers — AI-powered chord progressions, stem splitting, music theory reference, and daily creative tools. Built with Electron + React + FastAPI.

![Version](https://img.shields.io/badge/version-1.0.0-teal) ![Platform](https://img.shields.io/badge/platform-macOS-lightgrey) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

| Module | Description |
|--------|-------------|
| 🎹 **MIDI Chord Engine** | Build chord progressions, choose voicings (Closed/Open/Drop-2/Drop-3), export `.mid` files |
| ✦ **AI Generator** | Generate progressions using Groq LLM matched to your Genre DNA profile |
| 🎵 **Audio Tools** | YouTube → 24-bit WAV extractor + Demucs v4 4-stem splitter (drums/bass/vocals/other) |
| 📖 **Theory Reference** | Chord & scale explorer, interval reference, progression → scale analyzer with piano view |
| ✺ **Daily Engine** | Rotating chord of the day, production tips, creative prompts & challenges |

---

## Screenshots

> Coming soon

---

## Tech Stack

- **Shell** — Electron v28 + electron-vite
- **Frontend** — React 18 + Tailwind CSS
- **Backend** — Python 3.11 + FastAPI (localhost:8002)
- **AI** — Groq API (`llama-3.3-70b-versatile`)
- **MIDI** — pretty_midi + mido
- **Stem Splitting** — Demucs v4 htdemucs (Metal GPU via PyTorch MPS)
- **YouTube** — yt-dlp + ffmpeg
- **Database** — SQLite via SQLAlchemy

---

## Requirements

- macOS (Intel x64 — Apple Silicon support coming)
- Python 3.11
- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) + [ffmpeg](https://ffmpeg.org/)
- [Groq API key](https://console.groq.com/keys) (free tier)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/will825/terra-echo-labs-music-assistant.git
cd terra-echo-labs-music-assistant
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Add your Groq API key to .env
```

### 3. Install dependencies

```bash
# Node
npm install

# Python
pip install fastapi uvicorn sqlalchemy pretty_midi mido
pip install yt-dlp ffmpeg-python
pip install demucs torch   # PyTorch with Metal GPU (macOS)
```

### 4. Run in development mode

```bash
npm run start
# Starts the FastAPI backend + Electron app together
```

---

## Building a .dmg

```bash
npm run package
# Output: release/Terra Echo Labs-1.0.0.dmg
```

> **Note:** The app is not code-signed. On first launch, right-click the app → **Open** to bypass Gatekeeper.

---

## Project Structure

```
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # contextBridge API bridge
│   └── renderer/
│       └── src/
│           ├── App.jsx             # Shell + sidebar routing
│           ├── assets/             # Brand images
│           └── pages/              # MIDI, Generator, AudioTools, Theory, Daily, Home
├── backend/
│   ├── main.py                     # FastAPI app
│   ├── midi_engine.py
│   ├── progression_gen.py
│   ├── audio_extractor.py
│   ├── stem_splitter.py
│   ├── daily_engine.py
│   ├── theory_reference.py
│   └── routers/                    # API route handlers
├── database/
│   └── schema.sql
└── resources/
    └── icon.png                    # macOS app icon
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start backend + Electron (recommended for dev) |
| `npm run dev` | Electron + renderer only (no backend) |
| `npm run backend` | FastAPI backend only |
| `npm run package` | Build production `.dmg` |

---

## Roadmap

- [ ] Bundle Python backend into `.dmg` (fully standalone app)
- [ ] Session history + star ratings
- [ ] Arpeggio pattern generator
- [ ] 6-stem Demucs mode (guitar + piano)
- [ ] BPM + key detection on extracted audio
- [ ] Auto-update via GitHub Releases
- [ ] Apple Silicon (arm64) support

---

## Built by

**Will** · [Terra Echo Studios](https://github.com/will825) · Boone, NC
*March 2026*
