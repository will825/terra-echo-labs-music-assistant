import { useState, useEffect } from 'react'

const api = (path) =>
  window.api.request(path).then((r) => {
    if (!r.success) throw new Error(r.error || 'API error')
    return r.data
  })

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const NOTE_LABELS = {
  'C': 'C', 'C#': 'C# / D♭', 'D': 'D', 'D#': 'D# / E♭', 'E': 'E',
  'F': 'F', 'F#': 'F# / G♭', 'G': 'G', 'G#': 'G# / A♭', 'A': 'A',
  'A#': 'A# / B♭', 'B': 'B',
}

const TENSION_COLORS = [
  '', // 0 unused
  'bg-teal-900/50 text-teal-300',     // 1 — consonant
  'bg-blue-900/50 text-blue-300',     // 2 — mild tension
  'bg-yellow-900/50 text-yellow-300', // 3 — moderate
  'bg-orange-900/50 text-orange-300', // 4 — tense
  'bg-red-900/50 text-red-300',       // 5 — max tension
]

const TENSION_LABEL = ['', 'Consonant', 'Mild', 'Moderate', 'Tense', 'Very Tense']

// ── Chord Reference Tab ───────────────────────────────────────────────────────
function ChordReference({ chordTypes }) {
  const [root, setRoot]           = useState('C')
  const [selected, setSelected]   = useState('maj7')
  const [chord, setChord]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api(`/theory/chord?root=${encodeURIComponent(root)}&type=${encodeURIComponent(selected)}`)
      .then(setChord)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [root, selected])

  const selectedMeta = chordTypes.find((c) => c.key === selected)

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Root selector */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Root Note</label>
          <div className="flex gap-1.5 flex-wrap">
            {NOTES.map((n) => (
              <button
                key={n}
                onClick={() => setRoot(n)}
                className={`px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-colors ${
                  root === n
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chord type grid */}
      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Chord Type</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {chordTypes.map((ct) => (
            <button
              key={ct.key}
              onClick={() => setSelected(ct.key)}
              className={`px-2 py-2 rounded-lg text-xs font-semibold text-center transition-colors leading-tight ${
                selected === ct.key
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result panel */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {loading && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 h-48 animate-pulse" />
      )}

      {chord && !loading && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex flex-col gap-5">
          {/* Chord name + tension */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-4xl font-bold text-white leading-none">
                {root}
                <span className="text-teal-400">{selectedMeta?.label?.replace('Major', 'maj').replace('Minor', 'm').split(' ')[0] === selectedMeta?.label?.split(' ')[0] ? '' : ''}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">{chord.quality}</div>
              {selectedMeta && (
                <div className="text-lg text-teal-300 font-semibold mt-0.5">{selectedMeta.label}</div>
              )}
            </div>
            {selectedMeta && (
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${TENSION_COLORS[selectedMeta.tension]}`}>
                {TENSION_LABEL[selectedMeta.tension]}
              </span>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Notes</div>
            <div className="flex gap-2 flex-wrap">
              {chord.notes.map((note, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="px-3 py-2 rounded-lg bg-teal-900/50 border border-teal-700/60 text-teal-200 font-mono text-base font-bold">
                    {note}
                  </span>
                  <span className="text-xs text-gray-500">{chord.interval_names[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Sound</div>
            <p className="text-gray-200 text-sm leading-relaxed">{chord.description}</p>
          </div>

          {/* Use cases */}
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
    setLoading(true)
    setError(null)
    api(`/theory/scale?root=${encodeURIComponent(root)}&type=${encodeURIComponent(selected)}`)
      .then(setScale)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [root, selected])

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col gap-4">
        {/* Root */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Root Note</label>
          <div className="flex gap-1.5 flex-wrap">
            {NOTES.map((n) => (
              <button
                key={n}
                onClick={() => setRoot(n)}
                className={`px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-colors ${
                  root === n
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Scale type */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Scale Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {scaleTypes.map((st) => (
              <button
                key={st.key}
                onClick={() => setSelected(st.key)}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-colors leading-tight ${
                  selected === st.key
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="font-semibold">{st.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{st.note_count} notes</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 h-64 animate-pulse" />
      )}

      {/* Result */}
      {scale && !loading && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex flex-col gap-5">
          {/* Scale name */}
          <div>
            <div className="text-3xl font-bold text-white">{scale.name}</div>
            <div className="text-sm text-teal-400 mt-1 font-semibold">{scale.note_count} notes</div>
          </div>

          {/* Notes with degrees */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Notes & Degrees</div>
            <div className="flex gap-2 flex-wrap">
              {scale.note_degrees.map((nd, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span
                    className={`px-3 py-2 rounded-lg font-mono text-base font-bold border ${
                      nd.degree === '1'
                        ? 'bg-teal-700/60 border-teal-500 text-white'
                        : 'bg-gray-700/60 border-gray-600 text-gray-200'
                    }`}
                  >
                    {nd.note}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{nd.degree}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Vibe</div>
            <p className="text-gray-200 text-sm">{scale.vibe}</p>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">About</div>
            <p className="text-gray-300 text-sm leading-relaxed">{scale.description}</p>
          </div>

          {/* Genre uses */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Genre Uses</div>
            <p className="text-gray-300 text-sm">{scale.genre_uses}</p>
          </div>

          {/* DAW tip */}
          <div className="bg-teal-900/20 border border-teal-800/50 rounded-lg p-4">
            <div className="text-xs text-teal-400 uppercase tracking-widest mb-1 font-semibold">DAW Tip</div>
            <p className="text-teal-100 text-sm leading-relaxed">{scale.daw_tip}</p>
          </div>
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
      <p className="text-sm text-gray-400">
        All intervals measured in semitones (half steps) from the root note.
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold">Semitones</th>
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold">Name</th>
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold">Abbr.</th>
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold hidden sm:table-cell">Example</th>
              <th className="px-4 py-3 text-xs uppercase tracking-widest text-gray-400 font-semibold hidden md:table-cell">Description</th>
            </tr>
          </thead>
          <tbody>
            {intervals.map((iv, i) => (
              <tr
                key={i}
                className={`border-t border-gray-700/50 ${i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'} hover:bg-gray-700/30 transition-colors`}
              >
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
      .then(([ct, st, iv]) => {
        setChordTypes(ct)
        setScaleTypes(st)
        setIntervals(iv)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-teal-400">Music Theory Reference</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Chord dictionary · Scale explorer · Interval reference
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-8 animate-pulse h-40 flex items-center justify-center text-gray-500">
          Loading theory data…
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'chords'    && <ChordReference chordTypes={chordTypes} />}
            {activeTab === 'scales'    && <ScaleExplorer scaleTypes={scaleTypes} />}
            {activeTab === 'intervals' && <IntervalReference intervals={intervals} />}
          </div>
        </>
      )}
    </div>
  )
}
