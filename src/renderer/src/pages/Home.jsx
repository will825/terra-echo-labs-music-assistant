import { useEffect, useState } from 'react'
import mascotSrc from '../assets/mascot.png'
import logoSrc from '../assets/logo.png'

/* ── Module card config ──────────────────────────────────────────────────── */
const MODULES = [
  {
    page:  'midi',
    label: 'MIDI Engine',
    icon:  '♬',
    grad:  'from-teal-500/20 to-teal-600/5',
    border:'border-teal-500/25 hover:border-teal-400/50',
    dot:   'bg-teal-400',
    tag:   null,
    desc:  'Generate chord voicings, arpeggios & export .mid files',
  },
  {
    page:  'generator',
    label: 'AI Generator',
    icon:  '✦',
    grad:  'from-violet-500/20 to-violet-600/5',
    border:'border-violet-500/25 hover:border-violet-400/50',
    dot:   'bg-violet-400',
    tag:   'AI',
    desc:  'Claude-powered progression generation matched to your genre DNA',
  },
  {
    page:  'audio',
    label: 'Audio Tools',
    icon:  '◉',
    grad:  'from-blue-500/20 to-blue-600/5',
    border:'border-blue-500/25 hover:border-blue-400/50',
    dot:   'bg-blue-400',
    tag:   null,
    desc:  'YouTube → 96k WAV extractor + Demucs 4-stem splitter',
  },
  {
    page:  'theory',
    label: 'Theory Reference',
    icon:  '♩',
    grad:  'from-amber-500/20 to-amber-600/5',
    border:'border-amber-500/25 hover:border-amber-400/50',
    dot:   'bg-amber-400',
    tag:   null,
    desc:  'Chord & scale explorer, progression analyzer with piano view',
  },
  {
    page:  'daily',
    label: 'Daily Engine',
    icon:  '✺',
    grad:  'from-rose-500/20 to-rose-600/5',
    border:'border-rose-500/25 hover:border-rose-400/50',
    dot:   'bg-rose-400',
    tag:   'New',
    desc:  'Daily chord, production tip, creative prompt & challenge',
  },
]

/* ── Waveform SVG ────────────────────────────────────────────────────────── */
function WaveformBg() {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const heights = [20, 35, 55, 40, 70, 85, 60, 45, 90, 65, 50, 80, 30, 55, 75,
                     40, 95, 60, 35, 70, 85, 50, 65, 45, 80, 25, 55, 90, 40, 70,
                     60, 35, 80, 55, 45, 70, 90, 50, 65, 30, 75, 85, 40, 60, 55,
                     70, 45, 35]
    return heights[i] ?? 40
  })
  return (
    <div className="absolute inset-0 flex items-center justify-end pr-4 overflow-hidden pointer-events-none">
      <div className="flex items-center gap-0.5 h-full opacity-[0.07]">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-teal-400"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Status Badge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  if (status === 'online')
    return (
      <span className="flex items-center gap-1.5 text-xs text-teal-400">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        Backend online
      </span>
    )
  if (status === 'checking')
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse" />
        Connecting…
      </span>
    )
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Backend offline
    </span>
  )
}

/* ── Module Card ─────────────────────────────────────────────────────────── */
function ModuleCard({ mod, onClick }) {
  return (
    <button
      onClick={() => onClick(mod.page)}
      className={`relative text-left bg-gradient-to-br ${mod.grad} border ${mod.border} rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 group`}
    >
      {/* Tag */}
      {mod.tag && (
        <span className="absolute top-3 right-3 text-xs px-1.5 py-0.5 rounded bg-gray-800/80 border border-gray-700/60 text-gray-400">
          {mod.tag}
        </span>
      )}
      {/* Icon */}
      <div className="text-3xl mb-3 select-none">{mod.icon}</div>
      {/* Label */}
      <div className="text-sm font-bold text-gray-100 mb-1 group-hover:text-white transition-colors">
        {mod.label}
      </div>
      {/* Desc */}
      <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
        {mod.desc}
      </p>
    </button>
  )
}

/* ── Daily Quick-View ────────────────────────────────────────────────────── */
function DailySnippet() {
  const [daily, setDaily] = useState(null)

  useEffect(() => {
    if (!window.api) return
    window.api.request('get', '/daily/today')
      .then(r => { if (r.success) setDaily(r.data) })
      .catch(() => {})
  }, [])

  if (!daily) return null

  return (
    <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Today's Daily</span>
        <span className="text-xs text-gray-600">{daily.date}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Chord of the Day</div>
          <div className="text-base font-bold text-teal-400">{daily.chord_of_day?.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{daily.chord_of_day?.notes?.join(' – ')}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 col-span-2">
          <div className="text-xs text-gray-500 mb-1">Tip</div>
          <div className="text-xs text-gray-300 leading-relaxed line-clamp-3">{daily.tip?.content}</div>
        </div>
      </div>
    </div>
  )
}

/* ── Home Page ───────────────────────────────────────────────────────────── */
export default function Home() {
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    if (!window.api) { setBackendStatus('error'); return }
    window.api.request('get', '/health')
      .then(r => setBackendStatus(r.success ? 'online' : 'error'))
      .catch(() => setBackendStatus('error'))
  }, [])

  const navigate = (page) => {
    window.dispatchEvent(new CustomEvent('tel:navigate', { detail: { page } }))
  }

  return (
    <div className="min-h-full flex flex-col gap-6 max-w-4xl mx-auto">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-gray-900/80 border border-gray-800/80 rounded-2xl overflow-hidden">
        <WaveformBg />
        <div className="relative flex items-center gap-6 p-6 pr-8">

          {/* Mascot */}
          <div className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-gray-800/60 border border-gray-700/40 flex items-center justify-center">
            <img
              src={logoSrc}
              alt="TEL Logo"
              className="w-full h-full object-contain p-1"
            />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Terra Echo Labs
              </h1>
              <StatusBadge status={backendStatus} />
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Music Production Intelligence Suite — v1.0.0
            </p>
            <div className="flex flex-wrap gap-2">
              {['MIDI Engine', 'AI Generator', 'Stem Splitter', 'Theory Reference', 'Daily Engine'].map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700/60 text-gray-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Module Grid ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Modules</h2>
        <div className="grid grid-cols-3 gap-3">
          {MODULES.map(mod => (
            <ModuleCard key={mod.page} mod={mod} onClick={navigate} />
          ))}
        </div>
      </div>

      {/* ── Daily Snippet ─────────────────────────────────────────────────── */}
      <DailySnippet />

      {/* ── Stack Info ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Electron', value: 'v28+' },
          { label: 'React', value: '18' },
          { label: 'FastAPI', value: 'Py 3.11' },
          { label: 'AI', value: 'Claude' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900/50 border border-gray-800/50 rounded-lg px-3 py-2 text-center">
            <div className="text-xs text-gray-600 mb-0.5">{label}</div>
            <div className="text-xs font-bold text-gray-400">{value}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
