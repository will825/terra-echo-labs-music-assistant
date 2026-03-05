import { useState, useEffect, useCallback } from 'react'

const api = (path, method = 'get') =>
  window.api.request(method, path).then((r) => {
    if (!r.success) throw new Error(r.error || 'API error')
    return r.data
  })

const DIFFICULTY_STYLES = {
  easy:   'bg-teal-900/50 text-teal-300 border border-teal-700',
  medium: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
  hard:   'bg-red-900/50 text-red-300 border border-red-700',
}

const CATEGORY_STYLES = {
  mixing:  'bg-blue-900/40 text-blue-300',
  theory:  'bg-purple-900/40 text-purple-300',
  midi:    'bg-teal-900/40 text-teal-300',
  general: 'bg-gray-700/60 text-gray-300',
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// ── Chord of the Day ─────────────────────────────────────────────────────────
function ChordCard({ chord }) {
  if (!chord) return null
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🎵</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Chord of the Day</span>
      </div>

      <div className="flex items-end gap-4">
        <span className="text-5xl font-bold text-teal-300 leading-none">{chord.name}</span>
        <span className="text-sm text-gray-400 pb-1">{chord.quality}</span>
      </div>

      {/* Notes */}
      <div className="flex gap-2 flex-wrap">
        {chord.notes.map((note, i) => (
          <span
            key={i}
            className="px-3 py-1.5 rounded-lg bg-teal-900/40 border border-teal-700/50 text-teal-200 font-mono text-sm font-semibold"
          >
            {note}
          </span>
        ))}
      </div>

      <p className="text-gray-300 text-sm leading-relaxed">
        <span className="font-semibold text-gray-200">Vibe: </span>{chord.vibe}
      </p>

      <p className="text-xs text-gray-500 italic mt-auto">
        Try playing this chord first today — see where it takes you.
      </p>
    </div>
  )
}

// ── Daily Tip ────────────────────────────────────────────────────────────────
function TipCard({ tip }) {
  if (!tip) return null
  const catStyle = CATEGORY_STYLES[tip.category] || CATEGORY_STYLES.general
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Daily Tip</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${catStyle}`}>
          {tip.category}
        </span>
      </div>
      <p className="text-gray-200 text-sm leading-relaxed">{tip.content}</p>
    </div>
  )
}

// ── Creative Prompt ──────────────────────────────────────────────────────────
function PromptCard({ prompt }) {
  if (!prompt) return null
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Creative Prompt</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-900/40 text-purple-300">
          {prompt.category}
        </span>
      </div>
      <p className="text-gray-200 text-sm leading-relaxed italic">"{prompt.prompt}"</p>
    </div>
  )
}

// ── Daily Challenge ──────────────────────────────────────────────────────────
function ChallengeCard({ challenge, onComplete }) {
  if (!challenge) return null
  const diffStyle = DIFFICULTY_STYLES[challenge.difficulty] || DIFFICULTY_STYLES.medium
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Daily Challenge</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diffStyle}`}>
          {challenge.difficulty}
        </span>
      </div>

      <p className="text-white font-semibold text-base">{challenge.title}</p>
      <p className="text-gray-300 text-sm leading-relaxed">{challenge.description}</p>

      {challenge.completed ? (
        <div className="mt-2 flex items-center gap-2 text-teal-400 text-sm font-semibold">
          <span>✅</span> Completed — great work!
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="mt-2 self-start px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
        >
          Mark Complete
        </button>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Daily() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api('/daily/today')
      setContent(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleComplete = async () => {
    if (!content?.challenge?.id) return
    try {
      await api(`/daily/challenge/${content.challenge.id}/complete`, 'post')
      setContent((prev) => ({
        ...prev,
        challenge: { ...prev.challenge, completed: true },
      }))
    } catch (e) {
      console.error('Complete challenge error:', e)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-400">Daily Creative Engine</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {content?.date ? formatDate(content.date) : 'Loading…'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          {loading ? '⟳ Loading…' : '⟳ Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !content && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 h-40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Content grid */}
      {content && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChordCard chord={content.chord_of_day} />
          <TipCard tip={content.tip} />
          <PromptCard prompt={content.prompt} />
          <ChallengeCard challenge={content.challenge} onComplete={handleComplete} />
        </div>
      )}

      {/* Footer note */}
      {content && (
        <p className="text-center text-xs text-gray-600 mt-2">
          Content rotates daily · Tips and challenges avoid repeating for 30 days
        </p>
      )}
    </div>
  )
}
