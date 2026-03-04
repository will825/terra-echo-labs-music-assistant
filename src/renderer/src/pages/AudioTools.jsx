import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const SAMPLE_RATES = [
  { value: 96000, label: '96 kHz (High-res)' },
  { value: 48000, label: '48 kHz (Standard)' },
  { value: 44100, label: '44.1 kHz (CD)' },
]

const BIT_DEPTHS = [
  { value: 24, label: '24-bit' },
  { value: 16, label: '16-bit' },
]

const DEMUCS_MODELS = [
  { id: 'htdemucs',    label: 'HTDemucs 4-stem', desc: 'Vocals · Drums · Bass · Other' },
  { id: 'htdemucs_6s', label: 'HTDemucs 6-stem', desc: 'Vocals · Drums · Bass · Other · Guitar · Piano' },
  { id: 'mdx_extra',   label: 'MDX Extra',        desc: 'Alternative model, strong on vocals' },
]

const STEM_ICONS = {
  vocals: '🎤',
  drums:  '🥁',
  bass:   '🎸',
  other:  '🎹',
  guitar: '🎸',
  piano:  '🎹',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(secs) {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, status }) {
  const color = status === 'error' ? 'bg-red-500'
    : status === 'done' ? 'bg-teal-500'
    : 'bg-indigo-500'
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color} ${
          status !== 'done' && status !== 'error' ? 'animate-pulse' : ''
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, onUseStem }) {
  const statusColor = {
    queued: 'text-gray-400',
    downloading: 'text-indigo-400',
    converting: 'text-yellow-400',
    separating: 'text-indigo-400',
    done: 'text-teal-400',
    error: 'text-red-400',
  }[job.status] || 'text-gray-400'

  const statusLabel = {
    queued: 'Queued…',
    downloading: 'Downloading…',
    converting: 'Converting to WAV…',
    separating: 'Separating stems…',
    done: 'Done',
    error: 'Error',
  }[job.status] || job.status

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-gray-200 font-medium truncate">
            {job.title || job.url || job.audio_path?.split('/').pop() || job.id}
          </p>
          <p className={`text-xs mt-0.5 ${statusColor}`}>
            {statusLabel}
            {job.duration ? ` · ${formatDuration(job.duration)}` : ''}
          </p>
        </div>
        <span className="text-xs font-mono text-gray-600 flex-shrink-0">{job.id}</span>
      </div>

      {job.status !== 'queued' && (
        <ProgressBar value={job.progress} status={job.status} />
      )}

      {job.status === 'error' && job.error && (
        <p className="text-xs text-red-400 bg-red-900/20 rounded px-2 py-1">{job.error}</p>
      )}

      {/* Audio extraction result */}
      {job.status === 'done' && job.filename && (
        <div className="flex items-center gap-2 bg-teal-900/20 rounded-lg px-3 py-2">
          <span className="text-teal-400 text-xs font-mono truncate flex-1">{job.filename}</span>
          {onUseStem && (
            <button
              onClick={() => onUseStem(job.path)}
              className="text-xs text-teal-400 hover:text-teal-300 border border-teal-700
                         hover:border-teal-500 rounded px-2 py-1 transition-colors flex-shrink-0"
            >
              Use for Stems →
            </button>
          )}
        </div>
      )}

      {/* Stem separation result */}
      {job.status === 'done' && job.stems && Object.keys(job.stems).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(job.stems).map(([name, path]) => (
            <div key={name}
              className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2"
            >
              <span className="text-base">{STEM_ICONS[name] || '🎵'}</span>
              <div className="min-w-0">
                <p className="text-xs text-gray-200 font-medium capitalize">{name}</p>
                <p className="text-xs text-gray-500 truncate">{path?.split('/').pop()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── YouTube → WAV Tab ───────────────────────────────────────────────────────

function YouTubeTab({ onJobComplete }) {
  const [url, setUrl]               = useState('')
  const [sampleRate, setSampleRate] = useState(96000)
  const [bitDepth, setBitDepth]     = useState(24)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [jobs, setJobs]             = useState([])
  const pollerRef                   = useRef(null)

  const pollJobs = useCallback(async () => {
    try {
      const res = await window.api.request('get', '/audio/jobs')
      if (res?.success) setJobs(res.data || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    pollJobs()
    pollerRef.current = setInterval(pollJobs, 1500)
    return () => clearInterval(pollerRef.current)
  }, [pollJobs])

  const handleSubmit = async () => {
    const trimmed = url.trim()
    if (!trimmed) { setError('Paste a YouTube URL first'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await window.api.request('post', '/audio/extract', {
        url: trimmed,
        sample_rate: sampleRate,
        bit_depth: bitDepth,
      })
      if (!res.success) setError(res.error || 'Failed to start job')
      else setUrl('')
    } catch {
      setError('Backend unreachable — is the server running?')
    } finally {
      setSubmitting(false)
    }
  }

  const activeJobs = jobs.filter(j => ['queued', 'downloading', 'converting'].includes(j.status))
  const doneJobs   = jobs.filter(j => j.status === 'done' || j.status === 'error')

  return (
    <div className="space-y-5">
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">YouTube URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 rounded-xl
                         px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500
                         placeholder-gray-600"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 disabled:cursor-not-allowed
                         text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm
                         flex items-center gap-2 flex-shrink-0"
            >
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : '⬇️'
              }
              {submitting ? 'Starting…' : 'Extract'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="flex gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Sample Rate</label>
            <select
              value={sampleRate}
              onChange={e => setSampleRate(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 text-gray-200 rounded-lg px-3 py-1.5
                         text-sm focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {SAMPLE_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Bit Depth</label>
            <select
              value={bitDepth}
              onChange={e => setBitDepth(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 text-gray-200 rounded-lg px-3 py-1.5
                         text-sm focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {BIT_DEPTHS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">In Progress</h3>
          {activeJobs.map(j => <JobCard key={j.id} job={j} onUseStem={onJobComplete} />)}
        </div>
      )}

      {doneJobs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</h3>
          {doneJobs.map(j => <JobCard key={j.id} job={j} onUseStem={onJobComplete} />)}
        </div>
      )}

      {jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed
                        border-gray-700 rounded-2xl text-center p-6">
          <div className="text-3xl mb-2">🎵</div>
          <p className="text-gray-400 text-sm">Paste a YouTube URL and hit Extract</p>
          <p className="text-gray-600 text-xs mt-1">Outputs 24-bit / 96 kHz WAV to output/audio/</p>
        </div>
      )}
    </div>
  )
}

// ─── Stem Splitter Tab ────────────────────────────────────────────────────────

function StemTab({ importPath, clearImport }) {
  const [audioPath, setAudioPath]   = useState('')
  const [model, setModel]           = useState('htdemucs')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [jobs, setJobs]             = useState([])
  const pollerRef                   = useRef(null)

  useEffect(() => {
    if (importPath) {
      setAudioPath(importPath)
      clearImport()
    }
  }, [importPath, clearImport])

  const pollJobs = useCallback(async () => {
    try {
      const res = await window.api.request('get', '/stems/jobs')
      if (res?.success) setJobs(res.data || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    pollJobs()
    pollerRef.current = setInterval(pollJobs, 1500)
    return () => clearInterval(pollerRef.current)
  }, [pollJobs])

  const handleSubmit = async () => {
    const trimmed = audioPath.trim()
    if (!trimmed) { setError('Enter a file path first'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await window.api.request('post', '/stems/split', {
        audio_path: trimmed,
        model,
      })
      if (!res.success) setError(res.error || 'Failed to start job')
    } catch {
      setError('Backend unreachable — is the server running?')
    } finally {
      setSubmitting(false)
    }
  }

  const activeJobs = jobs.filter(j => ['queued', 'separating'].includes(j.status))
  const doneJobs   = jobs.filter(j => j.status === 'done' || j.status === 'error')

  return (
    <div className="space-y-5">
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Audio File Path</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={audioPath}
              onChange={e => setAudioPath(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="/Users/will/.../output/audio/track.wav"
              className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 rounded-xl
                         px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500
                         placeholder-gray-600 font-mono"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-700 hover:bg-indigo-600 disabled:bg-indigo-900
                         disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5
                         rounded-xl transition-colors text-sm flex items-center gap-2 flex-shrink-0"
            >
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : '✂️'
              }
              {submitting ? 'Starting…' : 'Split Stems'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <p className="text-gray-600 text-xs">
            Tip: Click "Use for Stems →" in the YouTube tab to auto-fill this path.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Demucs Model</label>
          <div className="grid grid-cols-3 gap-2">
            {DEMUCS_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  model === m.id
                    ? 'bg-indigo-900/60 border-indigo-500 text-indigo-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-xs">{m.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600">
          🖥️ Metal GPU (MPS) · AMD Radeon Pro W5500X · Output saved to output/stems/
        </p>
      </div>

      {activeJobs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Separating… (1–5 min depending on track length)
          </h3>
          {activeJobs.map(j => <JobCard key={j.id} job={j} />)}
        </div>
      )}

      {doneJobs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</h3>
          {doneJobs.map(j => <JobCard key={j.id} job={j} />)}
        </div>
      )}

      {jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed
                        border-gray-700 rounded-2xl text-center p-6">
          <div className="text-3xl mb-2">✂️</div>
          <p className="text-gray-400 text-sm">Enter a WAV file path and hit Split Stems</p>
          <p className="text-gray-600 text-xs mt-1">Demucs v4 htdemucs · Metal GPU acceleration</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AudioTools() {
  const [activeTab, setActiveTab]     = useState('youtube')
  const [stemImportPath, setStemImportPath] = useState('')

  const handleUseStem = (path) => {
    setStemImportPath(path)
    setActiveTab('stems')
  }

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-teal-400">Audio Tools</h1>
        <p className="text-gray-500 text-sm mt-0.5">YouTube → WAV · Stem Splitter (Demucs v4)</p>
      </div>

      <div className="flex gap-1 bg-gray-900/60 border border-gray-700 rounded-xl p-1 flex-shrink-0 w-fit">
        {[
          { id: 'youtube', label: '⬇️  YouTube → WAV' },
          { id: 'stems',   label: '✂️  Stem Splitter'  },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'youtube' ? (
          <YouTubeTab onJobComplete={handleUseStem} />
        ) : (
          <StemTab
            importPath={stemImportPath}
            clearImport={() => setStemImportPath('')}
          />
        )}
      </div>
    </div>
  )
}
