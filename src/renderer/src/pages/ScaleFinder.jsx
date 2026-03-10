import { useState } from 'react'
import PianoKeyboard from '../components/PianoKeyboard'

const MEDALS = ['🥇', '🥈', '🥉']

export default function ScaleFinder() {
  const [input, setInput]           = useState('')
  const [chords, setChords]         = useState([])
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [activeScaleIdx, setActive] = useState(0)

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
      if (res.data.error && !res.data.best_scales?.length) throw new Error(res.data.error)
      setResult(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const activeScale = result?.best_scales?.[activeScaleIdx]

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-teal-400">Scale Finder</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Enter a chord progression — get the best scale to play over it, with a keyboard view and per-chord tips.
        </p>
      </div>

      {/* Input */}
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
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 animate-pulse h-40" />
      )}

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

          {/* Active scale card */}
          {activeScale && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="text-2xl font-bold text-white">{activeScale.full_label}</div>
                  <div className="text-sm text-teal-400 mt-0.5 italic">{activeScale.vibe}</div>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {activeScale.notes.map((n, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg font-mono text-sm font-bold border ${i === 0 ? 'bg-teal-700 text-white border-teal-500' : 'bg-gray-700 text-gray-200 border-gray-600'}`}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">{activeScale.description}</p>

              {/* Piano */}
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
                  <div key={i} className={`rounded-xl p-4 border flex flex-col gap-2 ${tip.in_scale ? 'bg-gray-800/60 border-gray-700' : 'bg-orange-900/20 border-orange-800/50'}`}>
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
