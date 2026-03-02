import { useState, useEffect, useCallback } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const GENRES = [
  'Lo-Fi Hip Hop', 'Trap', 'Drill', 'Boom Bap', 'R&B',
  'Neo-Soul', 'Jazz', 'House', 'Ambient', 'Pop',
]

const MOODS = [
  'chill', 'dark', 'uplifting', 'melancholic',
  'energetic', 'mysterious', 'romantic', 'aggressive',
]

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']

const SCALES = ['minor', 'major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor pentatonic', 'blues', 'whole tone']

const COMPLEXITY_LABELS = { 1: 'Simple', 2: 'Moderate', 3: 'Complex' }
const COMPLEXITY_DESC   = { 1: 'Triads & basic', 2: '7ths & 9ths', 3: 'Extensions & alterations' }

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChordBadge({ chord }) {
  return (
    <span className="inline-block px-3 py-1.5 rounded-lg bg-teal-900/60 border border-teal-600/50
                     text-teal-300 font-mono text-sm font-semibold tracking-wide">
      {chord}
    </span>
  )
}

function SelectRow({ label, value, options, onChange, wide = false }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`bg-gray-800 border border-gray-600 text-gray-200 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:border-teal-500 cursor-pointer
                    ${wide ? 'w-full' : ''}`}
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

function SliderRow({ label, value, min, max, onChange, valueLabel }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
        <span className="text-xs text-teal-400 font-mono">{valueLabel || value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-700 cursor-pointer
                   accent-teal-500"
      />
    </div>
  )
}

// ─── Onboarding Quiz Modal ────────────────────────────────────────────────────

function OnboardingModal({ onSave, onSkip }) {
  const [answers, setAnswers] = useState({
    genre: 'Lo-Fi Hip Hop',
    mood_tags: [],
    fav_keys: [],
    fav_scales: ['minor'],
    tempo_range: '70-90',
    complexity: 2,
    daw: 'Logic Pro',
  })

  const toggle = (field, val) => {
    setAnswers(prev => {
      const arr = prev[field] || []
      return {
        ...prev,
        [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
      }
    })
  }

  const ToggleChip = ({ field, val }) => {
    const active = (answers[field] || []).includes(val)
    return (
      <button
        onClick={() => toggle(field, val)}
        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
          active
            ? 'bg-teal-600 border-teal-500 text-white'
            : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-teal-600'
        }`}
      >
        {val}
      </button>
    )
  }

  const handleSave = async () => {
    const genre = answers.mood_tags.length > 0
      ? answers.genre
      : 'Lo-Fi Hip Hop'
    await window.api.request('post', '/profile/', {
      genre: answers.genre,
      tempo_range: answers.tempo_range,
      mood_tags: answers.mood_tags,
      fav_keys: answers.fav_keys,
      fav_scales: answers.fav_scales,
      complexity: answers.complexity,
    })
    onSave(answers)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl max-h-[90vh]
                      overflow-y-auto p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-teal-400">Set Up Your Genre DNA 🧬</h2>
          <p className="text-gray-400 text-sm mt-1">
            Tell the AI about your sound so it can generate progressions tailored to you.
          </p>
        </div>

        {/* Primary genre */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Primary Genre</label>
          <select
            value={answers.genre}
            onChange={e => setAnswers(a => ({ ...a, genre: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:border-teal-500"
          >
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        {/* Mood tags */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Mood Tags</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(m => <ToggleChip key={m} field="mood_tags" val={m} />)}
          </div>
        </div>

        {/* Fav keys */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Favourite Keys (optional)</label>
          <div className="flex flex-wrap gap-2">
            {KEYS.slice(0, 12).map(k => <ToggleChip key={k} field="fav_keys" val={k} />)}
          </div>
        </div>

        {/* Fav scales */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Favourite Scales</label>
          <div className="flex flex-wrap gap-2">
            {['minor', 'major', 'dorian', 'phrygian', 'mixolydian', 'minor pentatonic', 'blues'].map(s => (
              <ToggleChip key={s} field="fav_scales" val={s} />
            ))}
          </div>
        </div>

        {/* Tempo range */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Typical Tempo Range</label>
          <select
            value={answers.tempo_range}
            onChange={e => setAnswers(a => ({ ...a, tempo_range: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:border-teal-500"
          >
            {['60-80', '80-100', '100-120', '120-140', '140-160', '160+'].map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Complexity */}
        <SliderRow
          label="Chord Complexity"
          value={answers.complexity}
          min={1}
          max={3}
          onChange={v => setAnswers(a => ({ ...a, complexity: v }))}
          valueLabel={`${COMPLEXITY_LABELS[answers.complexity]} — ${COMPLEXITY_DESC[answers.complexity]}`}
        />

        {/* DAW */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Primary DAW</label>
          <select
            value={answers.daw}
            onChange={e => setAnswers(a => ({ ...a, daw: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:border-teal-500"
          >
            {['Logic Pro', 'Ableton Live', 'Both'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5
                       rounded-xl transition-colors"
          >
            Save My Profile
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2.5 text-gray-400 hover:text-gray-200 border border-gray-700
                       hover:border-gray-500 rounded-xl transition-colors text-sm"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Saved Progressions Panel ─────────────────────────────────────────────────

function SavedPanel({ progressions, onLoad }) {
  if (!progressions.length) {
    return (
      <p className="text-gray-500 text-sm italic">No saved progressions yet.</p>
    )
  }
  return (
    <div className="space-y-2">
      {progressions.map(p => (
        <div key={p.id}
          className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3
                     border border-gray-700 hover:border-gray-600 transition-colors group"
        >
          <div className="min-w-0">
            <p className="text-sm text-gray-200 font-medium truncate">{p.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {p.genre} · {p.key} {p.scale} · {p.tempo} BPM
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(p.chords || []).map((c, i) => (
                <span key={i} className="text-xs font-mono text-teal-400 bg-teal-900/30
                                          border border-teal-800 rounded px-1.5 py-0.5">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => onLoad(p)}
            className="ml-3 flex-shrink-0 text-xs text-teal-400 hover:text-teal-300
                       border border-teal-700 hover:border-teal-500 rounded-lg px-3 py-1.5
                       transition-colors opacity-0 group-hover:opacity-100"
          >
            Load
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Generator() {
  // Controls
  const [genre, setGenre]       = useState('Lo-Fi Hip Hop')
  const [mood, setMood]         = useState('chill')
  const [key, setKey]           = useState('C')
  const [scale, setScale]       = useState('minor')
  const [numChords, setNumChords] = useState(4)
  const [complexity, setComplexity] = useState(2)
  const [tempo, setTempo]       = useState(80)
  const [extraInstructions, setExtraInstructions] = useState('')

  // State
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)    // last AI result
  const [error, setError]       = useState('')
  const [saveMsg, setSaveMsg]   = useState('')

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profileLoaded, setProfileLoaded]   = useState(false)

  // Saved progressions sidebar
  const [savedProgressions, setSavedProgressions] = useState([])
  const [showSaved, setShowSaved] = useState(false)

  // ── Load profile on mount ──
  useEffect(() => {
    const init = async () => {
      try {
        const hasRes = await window.api.request('get', '/profile/has')
        if (hasRes?.data?.has_profile) {
          const profRes = await window.api.request('get', '/profile/')
          if (profRes?.data) {
            applyProfile(profRes.data)
          }
          setProfileLoaded(true)
        } else {
          setShowOnboarding(true)
        }
      } catch {
        // backend may not be ready yet — skip onboarding silently
        setProfileLoaded(true)
      }
    }
    init()
  }, [])

  const applyProfile = (profile) => {
    if (profile.genre)    setGenre(profile.genre)
    if (profile.fav_scales?.length) setScale(profile.fav_scales[0])
    if (profile.fav_keys?.length)   setKey(profile.fav_keys[0])
    if (profile.complexity) setComplexity(profile.complexity)
    if (profile.tempo_range) {
      const [lo] = profile.tempo_range.split('-').map(Number)
      if (lo) setTempo(Math.round((lo + (lo + 20)) / 2))
    }
    setProfileLoaded(true)
  }

  // ── Load saved progressions ──
  const loadSaved = useCallback(async () => {
    try {
      const res = await window.api.request('get', '/profile/progressions')
      if (res?.success) setSavedProgressions(res.data || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadSaved() }, [loadSaved])

  // ── Generate ──
  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await window.api.request('post', '/progression/generate', {
        genre,
        mood,
        key,
        scale,
        num_chords: numChords,
        complexity,
        tempo,
        extra_instructions: extraInstructions,
        bypass_cache: false,
      })

      if (!res.success) {
        setError(res.error || 'Generation failed')
      } else {
        setResult(res.data)
      }
    } catch (err) {
      setError('Backend unreachable — is the server running?')
    } finally {
      setLoading(false)
    }
  }

  // ── Save current result ──
  const handleSave = async () => {
    if (!result) return
    setSaveMsg('')
    const title = `${result.key} ${result.scale} · ${genre} · ${result.tempo} BPM`
    try {
      const res = await window.api.request('post', '/profile/progressions/save', {
        title,
        chords: result.chords,
        key: result.key,
        scale: result.scale,
        genre,
        tempo: result.tempo,
        source: 'ai',
        notes: result.explanation || '',
      })
      if (res.success) {
        setSaveMsg('Saved!')
        loadSaved()
        setTimeout(() => setSaveMsg(''), 2000)
      }
    } catch {
      setSaveMsg('Save failed')
    }
  }

  // ── Load to MIDI page ──
  const handleLoadToMidi = () => {
    if (!result?.chords?.length) return
    // Persist to sessionStorage so MIDI page can pick it up
    sessionStorage.setItem('tel_import_chords', JSON.stringify(result.chords))
    sessionStorage.setItem('tel_import_tempo', String(result.tempo))
    // Navigate programmatically via a custom event the App.jsx router listens for
    window.dispatchEvent(new CustomEvent('tel:navigate', { detail: { page: 'midi' } }))
  }

  // ── Load saved progression into controls ──
  const handleLoadSaved = (prog) => {
    if (prog.genre)  setGenre(prog.genre)
    if (prog.key)    setKey(prog.key)
    if (prog.scale)  setScale(prog.scale)
    if (prog.tempo)  setTempo(prog.tempo)
    setResult({
      chords: prog.chords,
      key: prog.key,
      scale: prog.scale,
      tempo: prog.tempo,
      explanation: prog.notes || '',
      theory_note: '',
      daw_tip: '',
      cached: false,
    })
    setShowSaved(false)
  }

  // ── Regenerate (bypass cache) ──
  const handleRegenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.request('post', '/progression/generate', {
        genre, mood, key, scale,
        num_chords: numChords, complexity, tempo,
        extra_instructions: extraInstructions,
        bypass_cache: true,
      })
      if (!res.success) setError(res.error || 'Regeneration failed')
      else setResult(res.data)
    } catch {
      setError('Backend unreachable')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">

      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal
          onSave={(answers) => { applyProfile(answers); setShowOnboarding(false) }}
          onSkip={() => { setShowOnboarding(false); setProfileLoaded(true) }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-teal-400">AI Progression Generator</h1>
          <p className="text-gray-500 text-sm mt-0.5">Powered by Claude claude-3-5-haiku-20241022</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowSaved(v => !v); if (!showSaved) loadSaved() }}
            className="text-sm text-gray-400 hover:text-gray-200 border border-gray-700
                       hover:border-gray-600 rounded-xl px-4 py-2 transition-colors"
          >
            {showSaved ? 'Hide Saved' : `Saved (${savedProgressions.length})`}
          </button>
          <button
            onClick={() => setShowOnboarding(true)}
            className="text-sm text-gray-400 hover:text-teal-400 border border-gray-700
                       hover:border-teal-700 rounded-xl px-4 py-2 transition-colors"
          >
            🧬 Genre DNA
          </button>
        </div>
      </div>

      {/* Saved progressions panel */}
      {showSaved && (
        <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Saved Progressions</h3>
          <SavedPanel progressions={savedProgressions} onLoad={handleLoadSaved} />
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Controls panel */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4 space-y-4">

            <SelectRow label="Genre" value={genre} options={GENRES} onChange={setGenre} />
            <SelectRow label="Mood"  value={mood}  options={MOODS}  onChange={setMood} />

            <div className="grid grid-cols-2 gap-3">
              <SelectRow label="Key"   value={key}   options={KEYS}   onChange={setKey} />
              <SelectRow label="Scale" value={scale} options={SCALES} onChange={setScale} />
            </div>

            <SliderRow
              label="Chords"
              value={numChords}
              min={2}
              max={8}
              onChange={setNumChords}
              valueLabel={`${numChords} chords`}
            />

            <SliderRow
              label="Complexity"
              value={complexity}
              min={1}
              max={3}
              onChange={setComplexity}
              valueLabel={`${COMPLEXITY_LABELS[complexity]} — ${COMPLEXITY_DESC[complexity]}`}
            />

            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Tempo</label>
                <span className="text-xs text-teal-400 font-mono">{tempo} BPM</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={40}
                  max={200}
                  value={tempo}
                  onChange={e => setTempo(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none bg-gray-700 cursor-pointer accent-teal-500"
                />
              </div>
            </div>

          </div>

          {/* Extra instructions */}
          <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4 space-y-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Extra Instructions</label>
            <textarea
              value={extraInstructions}
              onChange={e => setExtraInstructions(e.target.value)}
              placeholder="e.g. 'use tritone substitution on bar 3' or 'make it sound like Nujabes'"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm
                         rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-teal-500
                         placeholder-gray-600"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900
                       disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl
                       transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                  rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              '✨ Generate Progression'
            )}
          </button>
        </div>

        {/* Result panel */}
        <div className="flex-1 min-w-0">
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-2xl p-4 mb-4">
              <p className="text-red-400 text-sm font-medium">{error}</p>
              {error.includes('ANTHROPIC_API_KEY') && (
                <p className="text-red-300/70 text-xs mt-1">
                  Add <code className="font-mono">ANTHROPIC_API_KEY=sk-ant-…</code> to your <code className="font-mono">.env</code> file and restart the backend.
                </p>
              )}
            </div>
          )}

          {result ? (
            <div className="space-y-4">

              {/* Chord pills */}
              <div className="bg-gray-900/60 border border-teal-800/50 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {result.key} {result.scale}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {genre} · {mood} · {result.tempo} BPM
                      {result.cached && (
                        <span className="ml-2 text-yellow-600/70">(cached)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={loading}
                      title="Generate a different version"
                      className="text-xs text-gray-400 hover:text-teal-400 border border-gray-700
                                 hover:border-teal-700 rounded-lg px-3 py-1.5 transition-colors
                                 disabled:opacity-40"
                    >
                      🔁 Regenerate
                    </button>
                  </div>
                </div>

                {/* Chord progression display */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {result.chords.map((chord, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-600 font-mono">{i + 1}</span>
                      <ChordBadge chord={chord} />
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleLoadToMidi}
                    className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-semibold
                               px-4 py-2 rounded-xl transition-colors"
                  >
                    🎹 Load into MIDI Engine
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold
                               px-4 py-2 rounded-xl transition-colors"
                  >
                    💾 Save Progression
                  </button>
                  {saveMsg && (
                    <span className="self-center text-sm text-teal-400">{saveMsg}</span>
                  )}
                </div>
              </div>

              {/* AI explanation */}
              {result.explanation && (
                <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Harmonic Analysis
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
                </div>
              )}

              {/* Theory note + DAW tip */}
              <div className="grid grid-cols-2 gap-4">
                {result.theory_note && (
                  <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">
                      🎼 Theory Note
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{result.theory_note}</p>
                  </div>
                )}
                {result.daw_tip && (
                  <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                      🖥️ DAW Tip
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{result.daw_tip}</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            !loading && (
              <div className="flex flex-col items-center justify-center h-full min-h-64
                              border-2 border-dashed border-gray-700 rounded-2xl text-center p-8">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-gray-400 font-medium">Configure your settings and hit Generate</p>
                <p className="text-gray-600 text-sm mt-1">
                  Claude will craft a {numChords}-chord {genre.toLowerCase()} progression in {key} {scale}
                </p>
              </div>
            )
          )}

          {loading && !result && (
            <div className="flex flex-col items-center justify-center h-64 rounded-2xl
                            border border-gray-700 text-center p-8 animate-pulse">
              <div className="text-3xl mb-3">🎵</div>
              <p className="text-teal-400 font-medium">Claude is composing…</p>
              <p className="text-gray-600 text-sm mt-1">
                Generating a {numChords}-chord {genre.toLowerCase()} progression
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
