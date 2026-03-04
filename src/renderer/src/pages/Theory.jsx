import { useState, useEffect } from 'react'

const api = (path) =>
  window.api.request('get', path).then((r) => {
    if (!r.success) throw new Error(r.error || 'API error')
    return r.data
  })

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const TENSION_COLORS = [
  '',
  'bg-teal-900/50 text-teal-300',
  'bg-blue-900/50 text-blue-300',
  'bg-yellow-900/50 text-yellow-300',
  'bg-orange-900/50 text-orange-300',
  'bg-red-900/50 text-red-300',
]
const TENSION_LABEL = ['', 'Consonant', 'Mild', 'Moderate', 'Tense', 'Very Tense']

// ── Piano Keyboard ────────────────────────────────────────────────────────────
const WK_W = 38   // white key width px
const WK_H = 112  // white key height px
const BK_W = 24   // black key width px
const BK_H = 70   // black key height px
const OCTAVES = 2

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
// Black key definitions: note name + center offset (× WK_W from octave left edge)
const BLACK_DEFS = [
  { note: 'C#', off: 0.65 },
  { note: 'D#', off: 1.65 },
  { note: 'F#', off: 3.65 },
  { note: 'G#', off: 4.65 },
  { note: 'A#', off: 5.65 },
]
const TO_SHARP = { Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B' }
const normNote = (n) => TO_SHARP[n] || n

function PianoKeyboard({ scaleNotes = [], rootNote = null }) {
  const hlSet  = new Set(scaleNotes.map(normNote))
  const normRoot = rootNote ? normNote(rootNote) : null
  const isHL   = (n) => hlSet.has(normNote(n))
  const isRoot = (n) => normNote(n) === normRoot

  const totalW = WK_W * WHITE_NOTES.length * OCTAVES

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ position: 'relative', width: totalW, height: WK_H, userSelect: 'none', flexShrink: 0 }}>

        {/* White keys */}
        {Array.from({ length: OCTAVES }, (_, oct) =>
          WHITE_NOTES.map((note, i) => {
            const x  = (oct * WHITE_NOTES.length + i) * WK_W
            const hl = isHL(note)
            const rt = isRoot(note)
            return (
              <div
                key={`w-${oct}-${note}`}
                style={{
                  position: 'absolute', left: x, top: 0,
                  width: WK_W - 1, height: WK_H,
                  backgroundColor: rt ? '#0d9488' : hl ? '#99f6e4' : '#f1f5f9',
                  border: '1px solid #94a3b8',
                  borderRadius: '0 0 5px 5px',
                  zIndex: 0,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-end', alignItems: 'center',
                  paddingBottom: 7,
                }}
              >
                {hl && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, lineHeight: 1,
                    color: rt ? 'white' : '#0f766e',
                  }}>
                    {note}
                  </span>
                )}
              </div>
            )
          })
        )}

        {/* Black keys */}
        {Array.from({ length: OCTAVES }, (_, oct) =>
          BLACK_DEFS.map(({ note, off }) => {
            const x  = (oct * WHITE_NOTES.length + off) * WK_W - BK_W / 2
            const hl = isHL(note)
            const rt = isRoot(note)
            return (
              <div
                key={`b-${oct}-${note}`}
                style={{
                  position: 'absolute', left: x, top: 0,
                  width: BK_W, height: BK_H,
                  backgroundColor: rt ? '#0d9488' : hl ? '#0f766e' : '#1e293b',
                  border: hl ? '1px solid #14b8a6' : '1px solid #334155',
                  borderRadius: '0 0 4px 4px',
                  zIndex: 1,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-end', alignItems: 'center',
                  paddingBottom: 5,
                }}
              >
                {hl && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, lineHeight: 1,
                    color: '#99f6e4', whiteSpace: 'nowrap',
                  }}>
                    {note.replace('#', '♯')}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Chord Reference Tab ───────────────────────────────────────────────────────
function ChordReference({ chordTypes }) {
  const [root, setRoot]         = useState('C')
  const [selected, setSelected] = useState('maj7')
  const [chord, setChord]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    api(`/theory/chord?root=${encodeURIComponent(root)}&type=${encodeURIComponent(selected)}`)
      .then(setChord).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [root, selected])

  const meta = chordTypes.find((c) => c.key === selected)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Root Note</label>
        <div className="flex gap-1.5 flex-wrap">
          {NOTES.map((n) => (
            <button key={n} onClick={() => setRoot(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-colors ${root === n ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Chord Type</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {chordTypes.map((ct) => (
            <button key={ct.key} onClick={() => setSelected(ct.key)}
              className={`px-2 py-2 rounded-lg text-xs font-semibold text-center transition-colors leading-tight ${selected === ct.key ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
      {loading && <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 h-48 animate-pulse" />}

      {chord && !loading && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-4xl font-bold text-white leading-none">{root}</div>
              <div className="text-sm text-gray-400 mt-1">{chord.quality}</div>
              {meta && <div className="text-lg text-teal-300 font-semibold mt-0.5">{meta.label}</div>}
            </div>
            {meta && (
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${TENSION_COLORS[meta.tension]}`}>
                {TENSION_LABEL[meta.tension]}
              </span>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Notes</div>
            <div className="flex gap-2 flex-wrap">
              {chord.notes.map((note, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="px-3 py-2 rounded-lg bg-teal-900/50 border border-teal-700/60 text-teal-200 font-mono text-base font-bold">{note}</span>
                  <span className="text-xs text-gray-500">{chord.interval_names[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Sound</div>
            <p className="text-gray-200 text-sm leading-relaxed">{chord.description}</p>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Use Cases</div>
            <p className="text-gray-300 text-sm leading-relaxed">{chord.use_cases}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Scale Explorer Tab ────────────────────────────────────────────────────────
function ScaleExplorer({ scaleTypes }) {
  const [root, setRoot]         = useState('A')
  const [selected, setSelected] = useState('minor_pentatonic')
  const [scale, setScale]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    api(`/theory/scale?root=${encodeURIComponent(root)}&type=${encodeURIComponent(selected)}`)
      .then(setScale).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [root, selected])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Root Note</label>
        <div className="flex gap-1.5 flex-wrap">
          {NOTES.map((n) => (
            <button key={n} onClick={() => setRoot(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-colors ${root === n ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Scale Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {scaleTypes.map((st) => (
            <button key={st.key} onClick={() => setSelected(st.key)}
              className={`px-3 py-2 rounded-lg text-sm text-left transition-colors leading-tight ${selected === st.key ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              <div className="font-semibold">{st.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{st.note_count} notes</div>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
      {loading && <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 h-64 animate-pulse" />}

      {scale && !loading && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex flex-col gap-5">
          <div>
            <div className="text-3xl font-bold text-white">{scale.name}</div>
            <div className="text-sm text-teal-400 mt-1 font-semibold">{scale.note_count} notes</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Notes & Degrees</div>
            <div className="flex gap-2 flex-wrap">
              {scale.note_degrees.map((nd, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`px-3 py-2 rounded-lg font-mono text-base font-bold border ${nd.degree === '1' ? 'bg-teal-700/60 border-teal-500 text-white' : 'bg-gray-700/60 border-gray-600 text-gray-200'}`}>
                    {nd.note}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{nd.degree}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Piano keyboard */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">On Keyboard</div>
            <PianoKeyboard scaleNotes={scale.notes} rootNote={root} />
          </div>

          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Vibe</div>
            <p className="text-gray-200 text-sm">{scale.vibe}</p>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">About</div>
            <p className="text-gray-300 text-sm leading-relaxed">{scale.description}</p>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Genre Uses</div>
            <p className="text-gray-300 text-sm">{scale.genre_uses}</p>
          </div>
          <div className="bg-teal-900/20 border border-teal-800/50 rounded-lg p-4">
            <div className="text-xs text-teal-400 uppercase tracking-widest mb-1 font-semibold">DAW Tip</div>
            <p className="text-teal-100 text-sm leading-relaxed">{scale.daw_tip}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Scale Finder Tab ──────────────────────────────────────────────────────────
function ScaleFinder() {
  const [input, setInput]             = useState('')
  const [chords, setChords]           = useState([])
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [activeScaleIdx, setActive]   = useState(0)

  const splitInput = (val) =>
    val.split(/[\s,|]+/).map((s) => s.trim()).filter(Boolean)

  const handleChange = (e) => {
    setInput(e.target.value)
    setChords(splitInput(e.target.value))
  }

  const handleAnalyze = async () => {
    if (chords.length === 0) return
    setLoading(true); setError(null); setResult(null); setActive(0)
    try {
      const res = await window.api.request('post', '/theory/analyze-progression', { chords })
      if (!res.success) throw new Error(res.error || 'API error')
      if (res.data.error && !res.data.best_scales?.length)
        throw new Error(res.data.error)
      setResult(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const activeScale = result?.best_scales?.[activeScaleIdx]
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-400">
        Type a chord progression to find the best scale to play over it, visualized on a keyboard with per-chord playing tips.
      </p>

      {/* Input row */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="e.g.   Am  Em  Dm  G   or   Dm7, G7, Cmaj7"
            className="flex-1 bg-gray-700/60 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 font-mono text-sm"
          />
          <button
            onClick={handleAnalyze}
            disabled={chords.length === 0 || loading}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors whitespace-nowrap"
          >
            {loading ? '⟳ Analyzing…' : 'Analyze →'}
          </button>
        </div>

        {/* Chord chips */}
        {chords.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {chords.map((ch, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 font-mono text-sm">
                {ch}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>}
      {loading && <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 animate-pulse h-40" />}

      {/* Results */}
      {result && !loading && (
        <div className="flex flex-col gap-5">

          {/* Top match pills */}
          {result.best_scales.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {result.best_scales.map((scale, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex flex-col items-start ${activeScaleIdx === i ? 'bg-teal-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  <span>{MEDALS[i]} {scale.full_label}</span>
                  <span className={`text-xs mt-0.5 ${activeScaleIdx === i ? 'text-teal-200' : 'text-gray-500'}`}>
                    {Math.round(scale.coverage * 100)}% coverage
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active scale card + piano */}
          {activeScale && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="text-2xl font-bold text-white">{activeScale.full_label}</div>
                  <div className="text-sm text-teal-400 mt-0.5 italic">{activeScale.vibe}</div>
                </div>
                {/* Scale notes */}
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {activeScale.notes.map((n, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg font-mono text-sm font-bold border ${i === 0 ? 'bg-teal-700 text-white border-teal-500' : 'bg-gray-700 text-gray-200 border-gray-600'}`}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">{activeScale.description}</p>

              {/* ── Piano Keyboard ── */}
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                  Scale on Keyboard
                  <span className="ml-2 text-gray-600 normal-case font-normal">
                    (teal = in scale · bright teal = root)
                  </span>
                </div>
                <PianoKeyboard scaleNotes={activeScale.notes} rootNote={activeScale.root} />
              </div>

              <div className="text-xs text-gray-400">
                <span className="font-semibold text-gray-300">Genre uses: </span>{activeScale.genre_uses}
              </div>
              <div className="bg-teal-900/20 border border-teal-800/40 rounded-lg px-4 py-3 text-teal-100 text-sm">
                <span className="font-semibold text-teal-400 mr-1">DAW tip:</span>{activeScale.daw_tip}
              </div>
            </div>
          )}

          {/* Per-chord tips */}
          {activeScale?.per_chord_tips?.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-gray-400 uppercase tracking-widest">What to Play Over Each Chord</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeScale.per_chord_tips.map((tip, i) => (
                  <div key={i}
                    className={`rounded-xl p-4 border flex flex-col gap-2 ${tip.in_scale ? 'bg-gray-800/60 border-gray-700' : 'bg-orange-900/20 border-orange-800/50'}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-white font-bold text-xl font-mono">{tip.chord}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {tip.notes.slice(0, 4).map((n, j) => (
                          <span key={j} className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 font-mono text-xs">{n}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{tip.tip}</p>
                    {!tip.in_scale && (
                      <span className="text-xs text-orange-400 font-semibold">⚠ Chromatic — outside {activeScale.full_label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Interval Reference Tab ────────────────────────────────────────────────────
function IntervalReference({ intervals }) {
  if (!intervals) return null
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-400">All intervals measured in semitones (half steps) from the root note.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-left">
              {['Semitones', 'Name', 'Abbr.', 'Example', 'Description'].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold ${i >= 3 ? 'hidden sm:table-cell' : ''} ${i === 4 ? 'hidden md:table-cell' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {intervals.map((iv, i) => (
              <tr key={i} className={`border-t border-gray-700/50 ${i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'} hover:bg-gray-700/30 transition-colors`}>
                <td className="px-4 py-3 font-mono text-teal-300 font-bold">{iv.semitones}</td>
                <td className="px-4 py-3 text-white font-medium">{iv.name}</td>
                <td className="px-4 py-3 font-mono text-gray-400">{iv.abbreviation}</td>
                <td className="px-4 py-3 font-mono text-gray-300 hidden sm:table-cell">{iv.example}</td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell max-w-xs">{iv.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'chords',    label: '🎹 Chord Reference' },
  { id: 'scales',    label: '🎼 Scale Explorer' },
  { id: 'finder',    label: '🔍 Scale Finder' },
  { id: 'intervals', label: '📐 Intervals' },
]

export default function Theory() {
  const [activeTab, setActiveTab]   = useState('chords')
  const [chordTypes, setChordTypes] = useState([])
  const [scaleTypes, setScaleTypes] = useState([])
  const [intervals, setIntervals]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    Promise.all([
      api('/theory/chord-types'),
      api('/theory/scale-types'),
      api('/theory/intervals'),
    ])
      .then(([ct, st, iv]) => { setChordTypes(ct); setScaleTypes(st); setIntervals(iv) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-400">Music Theory Reference</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Chord dictionary · Scale explorer · Scale finder · Interval reference
        </p>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>}

      {loading && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-8 animate-pulse h-40 flex items-center justify-center text-gray-500">
          Loading theory data…
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Tab bar — wraps on small screens */}
          <div className="flex flex-wrap gap-1 bg-gray-800/60 rounded-xl p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div>
            {activeTab === 'chords'    && <ChordReference chordTypes={chordTypes} />}
            {activeTab === 'scales'    && <ScaleExplorer scaleTypes={scaleTypes} />}
            {activeTab === 'finder'    && <ScaleFinder />}
            {activeTab === 'intervals' && <IntervalReference intervals={intervals} />}
          </div>
        </>
      )}
    </div>
  )
}
