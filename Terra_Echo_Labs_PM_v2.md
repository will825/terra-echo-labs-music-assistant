# Terra Echo Labs — Music Production Intelligence Suite
## Project Management Document  ·  v2.1  ·  Updated March 2026

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Code** | TEL-2026 |
| **Owner** | Will — Terra Echo Studios, Boone NC |
| **Platform** | macOS desktop app |
| **Machine** | Mac Pro 2019 · 16-Core Intel Xeon W · AMD Radeon Pro W5500X 8GB · 32GB RAM |
| **DAWs** | Logic Pro & Ableton Live |
| **Repo** | https://github.com/will825/terra-echo-labs-music-assistant (public) |
| **Status** | ✅ v1.0.0 shipped — March 2026 |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop Shell** | Electron v28+ |
| **Frontend** | React 18 + Tailwind CSS + Vite (electron-vite) |
| **Backend** | Python 3.11 + FastAPI on localhost:8002 |
| **IPC** | Electron contextBridge → `window.api.request(method, path, body)` |
| **AI / LLM** | Groq API — `llama-3.3-70b-versatile` (progression generation) |
| **MIDI** | pretty_midi + mido |
| **Stem Split** | Demucs v4 (htdemucs) — PyTorch MPS backend (Metal GPU) |
| **YouTube** | yt-dlp + ffmpeg |
| **Database** | SQLite via SQLAlchemy (schema at `database/schema.sql`) |
| **Packaging** | electron-builder → macOS .dmg |

---

## 3. Completed Sprints

### Sprint 0 — Environment Setup ✅
- Python 3.11, Node.js 18, Git repo initialized
- Electron + electron-vite scaffold
- FastAPI scaffold, verified Electron IPC → HTTP connection
- SQLite schema defined
- Branch strategy: `main / dev / feature/[name] / fix/[name]`

---

### Sprint 1 — MIDI Chord Engine ✅
**File:** `backend/midi_engine.py`

**Delivered:**
- Chord parser supporting: maj, min/m, 7, maj7, m7, dim, aug, sus2, sus4, add9, m7b5, maj9, m9, 9, 6, m6, mMaj7, 11, 13
- Voicing algorithms: Closed, Open, Drop-2, Drop-3, Spread, Shell
- Octave control + velocity + tempo + beats-per-chord settings
- MIDI file writer (pretty_midi) — exports `.mid` to Downloads folder
- Quick preset progressions: Lo-Fi Chill, Jazz ii-V-I, Pop Anthem, Neo-Soul, Hip Hop Dark, Flamenco
- **Frontend:** `MIDI.jsx` — chord input, progression builder, export button

---

### Sprint 2 — AI Progression Generator + Personalization ✅
**Files:** `backend/progression_gen.py`, `backend/profile_manager.py`

**Delivered:**
- Groq API integration (llama-3.3-70b-versatile) for chord progression generation
- Genre DNA profiles: Lo-Fi, Jazz, Neo-Soul, Hip-Hop, Pop, Electronic, Latin, Classical
- Onboarding quiz → user profile stored in SQLite
- Mood-to-session starter (Session Starter module)
- Prompt caching for common genre+mood combos
- **Frontend:** `Generator.jsx`, personalization quiz flow

---

### Sprint 3 — YouTube→WAV + Stem Splitter ✅
**Files:** `backend/audio_extractor.py`, `backend/stem_splitter.py`

**Delivered:**
- YouTube URL → 24-bit/96kHz WAV via yt-dlp + ffmpeg
  - `noplaylist: True` — prevents playlist downloads on mix URLs
  - Audio-only format preference (no video mux step)
  - Default sample rate: 48kHz (96kHz optional)
- Demucs v4 htdemucs stem separation (4-stem: drums/bass/vocals/other)
- Metal GPU (MPS) acceleration on AMD Radeon W5500X
- Progress tracking + output file browser
- Drag & drop audio file support
- **Frontend:** `AudioTools.jsx` — tabbed UI (Extract / Split)

**Known Risk:** yt-dlp can break when YouTube changes their API (Risk R-01, score 9). Keep yt-dlp updated regularly.

---

### Sprint 4 — Daily Creative Engine + Music Theory Reference ✅
**Files:** `backend/daily_engine.py`, `backend/theory_reference.py`, `backend/routers/daily.py`, `backend/routers/theory.py`

**Daily Creative Engine:**
- 28 rotating chord-of-the-day entries (by day-of-year)
- 30 production tips seeded to SQLite (non-repeating 30-day cycle)
- 25 creative prompts (non-repeating 25-day cycle)
- 21 creative challenges with completion tracking
- `GET /daily/today` → full daily bundle
- `POST /daily/challenge/{id}/complete`
- **Frontend:** `Daily.jsx` — 2×2 card grid

**Theory Reference:**
- 25 chord types, 15 scale types (with DAW tips), 16 intervals
- Scale Explorer with 2-octave piano keyboard visualization (teal highlights)
- **Scale Finder (bonus):** Enter a chord progression → AI scores all 180 root×scale combinations → returns top 3 scales with per-chord playing tips
  - Scoring: `coverage × 0.75 + efficiency × 0.25` + tonic root bonus (+0.06)
- `GET /theory/chord`, `/theory/scale`, `/theory/intervals`, `/theory/chord-types`, `/theory/scale-types`
- `POST /theory/analyze-progression` — `{ chords: string[] }`
- **Frontend:** `Theory.jsx` — 4 tabs: Chord Reference, Scale Explorer, Scale Finder, Intervals

---

### Sprint 5 — UI Polish + v1.0.0 Release ✅
**Files:** `src/renderer/src/App.jsx`, `src/renderer/src/pages/Home.jsx`

**Delivered:**
- Branded sidebar: Terra Echo Labs logo (ES module import), SVG nav icons, teal active states, "new" badge on Daily, hummingbird accent, v1.0.0 badge
- Home dashboard: animated waveform hero, mascot slot, 5 clickable module cards (teal/violet/blue/amber/rose), Daily snippet preview, tech stack badges
- Brand assets added: `logo.png`, `mascot.png`, `hummingbird.png`
- Uniform `p-6` padding across all pages
- Version bumped: `0.1.0 → 1.0.0`
- electron-builder config finalized: mac category, DMG title, copyright, icon (512px), arch targeting
- **.dmg built:** `release/Terra Echo Labs-1.0.0.dmg` (101MB)
- **GitHub repo created:** https://github.com/will825/terra-echo-labs-music-assistant
- **Git tag:** `v1.0.0`

---

## 4. Current Architecture

```
terra-echo-labs-music-assistant/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # contextBridge → window.api
│   └── renderer/
│       ├── src/
│       │   ├── App.jsx             # Shell, sidebar, routing
│       │   ├── assets/             # logo.png, mascot.png, hummingbird.png
│       │   └── pages/
│       │       ├── Home.jsx        # Dashboard
│       │       ├── MIDI.jsx        # MIDI Chord Engine
│       │       ├── Generator.jsx   # AI Generator
│       │       ├── AudioTools.jsx  # YouTube + Stem Splitter
│       │       ├── Theory.jsx      # Theory Reference + Scale Finder
│       │       └── Daily.jsx       # Daily Engine
│       └── public/                 # Static assets (brand images)
├── backend/
│   ├── main.py                     # FastAPI app, router registration
│   ├── midi_engine.py
│   ├── progression_gen.py
│   ├── profile_manager.py
│   ├── audio_extractor.py
│   ├── stem_splitter.py
│   ├── daily_engine.py
│   ├── theory_reference.py
│   └── routers/
│       ├── midi.py
│       ├── generator.py
│       ├── audio.py
│       ├── daily.py
│       └── theory.py
├── database/
│   └── schema.sql
├── resources/
│   └── icon.png                    # 512×529 macOS app icon
├── package.json                    # v1.0.0, electron-builder config
└── release/                        # .dmg output (gitignored)
```

---

## 5. API Response Shape

All FastAPI endpoints return:
```json
{ "success": true/false, "data": <any>, "error": "string | null" }
```

---

## 6. Code Standards

| Area | Standard |
|------|---------|
| Python | PEP 8, docstrings, type hints on all functions |
| React | Functional components only, no class components |
| Commits | `feat:` `fix:` `docs:` `test:` `refactor:` `chore:` prefixes |
| Branches | `main / dev / feature/[name] / fix/[name]` |

---

## 7. Future Sprints (Post v1.0.0)

### Sprint 6 — Self-Contained Packaging ⬅ Recommended Next
Bundle the Python backend into the .dmg so the app is fully standalone — no terminal, no Python install required.

**Tasks:**
- [ ] Use PyInstaller to compile FastAPI backend into a single standalone binary
- [ ] Electron main process detects + spawns the bundled binary on app launch
- [ ] Add animated loading/splash screen while backend boots (~2–4 seconds)
- [ ] Show live backend status indicator in sidebar or system tray
- [ ] Handle crash/restart of backend process gracefully
- [ ] Test on a clean Mac with zero Python installed
- [ ] Rebuild and validate `.dmg` — confirm fully self-contained

**New files:** `resources/backend_launcher.js` (Electron main spawn logic), `build/pyinstaller.spec`
**Effort:** ~1 week · **Priority:** 🔴 High — required before sharing with anyone

---

### Sprint 7 — BPM + Key Detector
Standalone tool to analyze any audio file and return its tempo (BPM) and musical key. Works for samples, loops, full songs — anything.

**Tasks:**
- [ ] Backend: `backend/audio_analyzer.py` using `librosa`
  - BPM detection: `librosa.beat.beat_track()` — returns tempo float
  - Key detection: `librosa.feature.chroma_cqt()` → Krumhansl-Schmuckler key profile → returns e.g. `"F# Minor"`
  - Duration, sample rate, channels as bonus metadata
- [ ] New router: `backend/routers/analyzer.py`
  - `POST /analyzer/analyze` — accepts file path or uploaded file
  - Returns `{ bpm, key, duration, sample_rate, confidence }`
- [ ] Frontend: new tab or card in `AudioTools.jsx` (fits naturally beside Extract + Split tabs)
  - Drag & drop or file picker for any audio file (.wav, .aiff, .mp3, .flac, .ogg)
  - Results display: large BPM readout, key badge, waveform thumbnail, metadata row
  - "Copy BPM" and "Copy Key" buttons for quick pasting into DAW
- [ ] Add BPM/key columns to Sample Browser (Sprint 8) — run analyzer on demand per sample
- [ ] Add BPM/key to Stem Splitter output card (auto-analyze extracted audio)

**Dependencies:** `librosa`, `numpy` (already used by demucs)
**Effort:** ~4–5 days · **Priority:** 🟡 Medium-High

---

### Sprint 8 — Sample Browser v1 (Core)
A Splice-style sample browser built into the app. Browse, search, and preview your local sample library with arrow key navigation and instant auto-play. This is the biggest new feature post-v1.

#### How it works — Folder-Based Indexing

> **Short answer to your question:** The app does NOT scan your whole computer.
> You add specific "watch folders" (e.g. `~/Music/Samples`, `/Volumes/SSD/Packs`).
> The app deep-scans and indexes everything inside those folders into SQLite.
> This is exactly how Splice, Ableton's browser, Native Instruments Komplete Kontrol, and Logic Pro all work.
> You can add as many folders as you want — including external drives.

**Why not whole-computer scan?**
- macOS privacy restrictions block many system folders
- Would find thousands of irrelevant `.aiff` system sound effects
- Slow and impractical — millions of files on a typical drive
- Industry standard is watch folders — it's the right UX

---

#### Architecture

**Backend — `backend/sample_browser.py` + `backend/routers/samples.py`**

New DB tables (add to `database/schema.sql`):
```sql
CREATE TABLE watch_folders (
  id INTEGER PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  label TEXT,
  last_scanned TIMESTAMP,
  file_count INTEGER DEFAULT 0
);

CREATE TABLE samples (
  id INTEGER PRIMARY KEY,
  folder_id INTEGER REFERENCES watch_folders(id),
  path TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  extension TEXT,
  category TEXT,          -- auto-detected from folder path
  duration REAL,          -- seconds (from librosa or mutagen)
  bpm REAL,               -- optional, run on demand
  musical_key TEXT,       -- optional, run on demand
  sample_rate INTEGER,
  file_size INTEGER,
  tags TEXT,              -- comma-separated user tags
  is_favorite INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_samples_category ON samples(category);
CREATE INDEX idx_samples_folder ON samples(folder_id);
```

API endpoints:
```
POST   /samples/folders/add           → add watch folder (Electron dialog provides path)
DELETE /samples/folders/{id}          → remove folder + its samples from index
GET    /samples/folders               → list all watch folders with stats
POST   /samples/scan                  → rescan all folders (background job)
GET    /samples/search?q=&category=&folder_id=&sort=   → filtered sample list
GET    /samples/categories            → all unique categories with counts
GET    /samples/favorites             → favorited samples
POST   /samples/{id}/favorite         → toggle favorite
GET    /samples/stats                 → total files, total size, last scan time
```

**Auto-category detection** — derived from folder path segments:
```python
CATEGORY_KEYWORDS = {
  "drums": ["drum", "drums", "percussion", "perc", "kick", "snare", "hat", "cymbal", "clap"],
  "bass": ["bass", "sub", "808"],
  "vocals": ["vocal", "vox", "voice", "chant", "adlib"],
  "synths": ["synth", "lead", "pad", "pluck", "arp"],
  "fx": ["fx", "effect", "riser", "sweep", "transition", "foley"],
  "loops": ["loop", "loops"],
  "one-shots": ["one-shot", "oneshot", "one_shot"],
}
```

**Frontend — `src/renderer/src/pages/SampleBrowser.jsx`**

Three-panel layout:
```
┌─────────────────────────────────────────────────────┐
│  SEARCH BAR                          [+ Add Folder] │
├────────────────┬────────────────────────────────────┤
│ FOLDERS        │  SAMPLE LIST                       │
│ ─────────────  │  ──────────────────────────────── │
│ 📁 ~/Samples   │  🎵 kick_001.wav        120 BPM    │ ← selected (arrow key)
│ 📁 /SSD/Packs  │  🎵 kick_hard.wav                  │
│                │  🎵 snare_dry.wav       4/4         │
│ CATEGORIES     │  🎵 snare_fat.wav                  │
│ ─────────────  │  🎵 hihat_open.wav                 │
│ 🥁 Drums  142  │  🎵 808_deep.wav        90 BPM     │
│ 🎸 Bass    58  │  ...                               │
│ 🎹 Synths  91  │                                    │
│ 🎤 Vocals  23  │                                    │
│ ✨ FX      37  │                                    │
├────────────────┴────────────────────────────────────┤
│  ▶  kick_001.wav   |████████░░░░|  0:01 / 0:03     │
│     120 BPM · C Minor · 44.1kHz · 16-bit · 192KB   │
└─────────────────────────────────────────────────────┘
```

**Keyboard navigation (the Splice feel):**
```javascript
↑ / ↓        → select previous / next sample
              → auto-plays immediately (100ms debounce)
Space        → pause / resume current sample
Enter        → reveal file in Finder (open folder)
⌘+D          → toggle favorite ♥
Escape       → stop playback
```

**Audio playback** — uses HTML5 Audio API directly with `file://` protocol:
```javascript
const audioRef = useRef(new Audio())

useEffect(() => {
  if (selectedSample) {
    audioRef.current.src = `file://${selectedSample.path}`
    audioRef.current.play()
  }
}, [selectedSample])
```
No streaming server needed — Electron can play local files directly via `file://`.

**Electron integration** — folder picker via IPC:
```javascript
// preload: adds window.api.openFolderDialog()
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.filePaths[0] ?? null
})
```

**Supported formats:** `.wav`, `.aiff`, `.aif`, `.mp3`, `.flac`, `.ogg`, `.m4a`

**Tasks:**
- [ ] Add `watch_folders` + `samples` tables to `database/schema.sql`
- [ ] Build `backend/sample_browser.py` — scanner, indexer, search, categories
- [ ] Build `backend/routers/samples.py` — all 8 endpoints
- [ ] Add IPC handler in `src/main/index.js` for `open-folder-dialog`
- [ ] Build `SampleBrowser.jsx` — three-panel layout
- [ ] Folder picker panel (add/remove watch folders, rescan button)
- [ ] Category sidebar filter
- [ ] Sample list with arrow key selection + auto-play
- [ ] Bottom preview bar (filename, metadata, progress bar)
- [ ] HTML5 Audio playback via `file://` protocol
- [ ] Add `SampleBrowser` route to `App.jsx` sidebar

**New dependencies:** `mutagen` (Python — fast audio metadata without full decode)
**Effort:** ~2 weeks · **Priority:** 🟡 Medium-High — flagship new feature

---

### Sprint 9 — Sample Browser v2 (Enhanced)
Power-user features on top of the Sprint 8 foundation.

**Tasks:**
- [ ] Waveform thumbnail visualization (Canvas + Web Audio API `OfflineAudioContext`)
- [ ] On-demand BPM + key analysis per sample (calls Sprint 7 analyzer)
- [ ] Bulk BPM/key analysis for entire folder (background queue)
- [ ] User tagging system — add custom tags per sample, filter by tag
- [ ] Favorites shelf — pinned samples at top
- [ ] Sort options: A-Z, date added, duration, BPM, key
- [ ] "Reveal in Finder" context menu
- [ ] Drag-to-DAW (advanced — macOS drag-and-drop API)
- [ ] Rescan on folder change (file system watcher via `watchdog` Python library)

**Effort:** ~1.5 weeks · **Priority:** 🟢 Medium

---

### Sprint 10 — Auto-Updates + Distribution
Make updates seamless and the app shareable.

**Tasks:**
- [ ] Add `electron-updater` package — checks GitHub Releases on startup
- [ ] Auto-update flow: notify user → download in background → prompt to restart
- [ ] Set up GitHub Actions CI: auto-build .dmg on push to `main`
- [ ] Code-signing with Apple Developer ID (required for Gatekeeper bypass without warning)
- [ ] Notarization for macOS 13+ compatibility
- [ ] Version bump workflow: update `package.json` → tag → push → CI builds + publishes release
- [ ] Landing page / download page (GitHub Pages)

**Effort:** ~1 week · **Priority:** 🟢 Medium (needed before wider distribution)

---

### Sprint 11 — Session Starter + History
Full session-starter flow with saved history and rating system.

**Tasks:**
- [ ] Mood picker → generates full session brief (key, tempo, scale, chord prog, vibe description)
- [ ] Save sessions to SQLite with timestamp
- [ ] Session history page — browse past sessions, rate them (1–5 stars)
- [ ] "Continue session" reloads previous brief into context
- [ ] Export session brief as PDF or .txt

**Effort:** ~1 week · **Priority:** 🟢 Medium

---

### Sprint 12 — MIDI Improvements
Enhanced MIDI features based on real-world use.

**Tasks:**
- [ ] Arpeggio pattern generator (up, down, up-down, random, as-played)
- [ ] Melody over chord progression (AI-generated note suggestions per chord)
- [ ] Scale-aware note constraint for melody
- [ ] MIDI playback preview inside the app (Web MIDI API)
- [ ] Export chord sheet as PDF (chord name + voicing diagram)

**Effort:** ~1.5 weeks · **Priority:** 🟢 Medium

---

### Sprint 13 — Audio Tools Enhancements
More power in the audio extraction and stem pipeline.

**Tasks:**
- [ ] Batch YouTube download (multiple URLs at once)
- [ ] 6-stem mode in Demucs (htdemucs_6s: drums/bass/vocals/guitar/piano/other)
- [ ] Auto-normalize stems to -14 LUFS on export
- [ ] Waveform preview of extracted/split audio

**Effort:** ~1 week · **Priority:** 🟢 Medium · **Risk:** yt-dlp API changes (R-01)

---

### Sprint 14 — Cloud Sync + Multi-Device (Future)
Optional cloud layer for syncing profiles and progressions.

**Tasks:**
- [ ] Supabase (free tier) for user profile + progression sync
- [ ] Login with email (magic link)
- [ ] Sync Genre DNA profile across machines
- [ ] Shared progression library (public/private toggle)

**Effort:** ~2 weeks · **Priority:** 🔵 Low · **Budget:** Supabase free tier ($0)

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Score | Mitigation |
|----|------|-----------|--------|-------|-----------|
| R-01 | yt-dlp breaks with YouTube API changes | High | High | 9 | Keep yt-dlp updated; wrap in try/catch with user-friendly error |
| R-02 | Groq API rate limits or pricing changes | Medium | Medium | 6 | Cache common combos; switch to Claude API (already integrated) |
| R-03 | Demucs slow on large files (>10min) | Medium | Low | 4 | Show progress bar; process in chunks for long files |
| R-04 | macOS Gatekeeper blocks unsigned .dmg | Low | Medium | 4 | Document right-click → Open workaround; plan code signing in Sprint 11 |
| R-05 | Python not installed on target machine | High | High | 9 | Sprint 6 PyInstaller bundling eliminates this |
| R-06 | macOS privacy blocks folder access for Sample Browser | Medium | Medium | 6 | Use `dialog.showOpenDialog` — user explicitly grants access; no entitlement needed |
| R-07 | librosa BPM/key detection slow on large audio files | Medium | Low | 4 | Analyze in background thread; cache results in SQLite; show spinner |

---

## 9. Key Commands

```bash
# Development
npm run start           # Start backend + Electron app together
npm run dev             # Electron + renderer only (no backend)
npm run backend         # FastAPI backend only (port 8002)

# Building
npm run build           # electron-vite production build
npm run package         # Build + create .dmg → release/

# Git
git push origin main    # Push to GitHub
git tag -a v1.1.0 -m "..." && git push origin --tags  # Tag a release

# Python
pip install -r requirements.txt   # Install Python dependencies
```

---

## 10. Dependencies Summary

### Python (requirements.txt)
- fastapi, uvicorn, sqlalchemy
- pretty_midi, mido
- yt-dlp, ffmpeg-python
- demucs, torch (MPS/Metal)
- librosa, numpy (Sprint 7 — BPM + key detection)
- mutagen (Sprint 8 — fast audio metadata for sample browser)
- watchdog (Sprint 9 — file system watcher for auto-rescan)
- anthropic (Claude API — available for future use)

### Node.js (package.json)
- electron v28, electron-vite, electron-builder
- react 18, react-router-dom, react-dom
- tailwindcss, vite, postcss
- concurrently, axios

---

*Document generated March 2026 · Terra Echo Studios · Boone, NC*
