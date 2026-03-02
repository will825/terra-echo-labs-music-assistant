import React, { useState, useCallback, useEffect } from 'react'

const VOICING_OPTIONS = [
  { value: 'closed', label: 'Closed' },
  { value: 'open',   label: 'Open' },
  { value: 'drop2',  label: 'Drop 2' },
  { value: 'inv1',   label: '1st Inversion' },
  { value: 'inv2',   label: '2nd Inversion' },
  { value: 'inv3',   label: '3rd Inversion' },
]

const PRESETS = [
  { label: 'Lo-Fi Chill',  chords: 'Cm7, Fm7, Ab, Bb' },
  { label: 'Jazz ii-V-I',  chords: 'Dm7, G7, Cmaj7, Cmaj7' },
  { label: 'Pop Anthem',   chords: 'C, G, Am, F' },
  { label: 'Neo-Soul',     chords: 'Fm9, Bbm7, Ebmaj7, Abmaj7' },
  { label: 'Hip Hop Dark', chords: 'Cm7, Dm7b5, Ebmaj7, Dm7b5' },
  { label: 'Flamenco',     chords: 'Am, G, F, E' },
]

function ChordPill({ data, onRemove }) {
  return (
    <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded px-2 py-1">
      <div>
        <span className="text-teal-300 font-bold text-sm">{data.chord}</span>
        <span className="text-gray-500 text-xs ml-2">{data.note_names.join(' ')}</span>
      </div>
      <button
        onClick={onRemove}
        className="ml-2 text-gray-600 hover:text-red-400 text-xs leading-none"
        title="Remove chord"
      >
        ✕
      </button>
    </div>
  )
}

function StatusBadge({ type, children }) {
  const colors = {
    success: 'bg-teal-900 border-teal-700 text-teal-300',
    error:   'bg-red-900 border-red-700 text-red-300',
    info:    'bg-gray-800 border-gray-700 text-gray-300',
  }
  return (
    <div className={`border rounded px-3 py-2 text-xs ${colors[type] || colors.info}`}>
      {children}
    </div>
  )
}

export default function MIDI() {
  const [chordInput, setChordInput]       = useState('')
  const [octave, setOctave]               = useState(4)
  const [voicing, setVoicing]             = useState('closed')
  const [tempo, setTempo]                 = useState(80)
  const [beatsPerChord, setBeatsPerChord] = useState(4)
  const [velocity, setVelocity]           = useState(80)

  const [progression, setProgression]   = useState([])
  const [parseError, setParseError]     = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [loading, setLoading]           = useState(false)

  // Import chords from Generator page (via sessionStorage + tel:navigate event)
  useEffect(() => {
    const raw = sessionStorage.getItem('tel_import_chords')
    if (!raw) return
    sessionStorage.removeItem('tel_import_chords')
    try {
      const imported = JSON.parse(raw)
      const importedTempo = parseInt(sessionStorage.getItem('tel_import_tempo') || '80')
      sessionStorage.removeItem('tel_import_tempo')
      if (Array.isArray(imported) && imported.length) {
        setProgression([])
        setParseError('')
        setExportStatus('')
        if (!isNaN(importedTempo)) setTempo(importedTempo)
        // Parse each chord via backend
        const parseAll = async () => {
          for (const name of imported) {
            try {
              const res = await window.api.request('post', '/midi/parse', {
                chord: name, octave: 4, voicing: 'closed',
              })
              if (res.success) setProgression(prev => [...prev, res.data])
            } catch { /* skip unrecognised chord */ }
          }
        }
        parseAll()
      }
    } catch { /* ignore malformed data */ }
  }, []) // runs once on mount

  const addChord = useCallback(async (name) => {
    const chord = name.trim()
    if (!chord) return
    setParseError('')
    try {
      const res = await window.api.request('post', '/midi/parse', {
        chord,
        octave: parseInt(octave),
        voicing,
      })
      if (!res.success) {
        setParseError(res.error || 'Unknown chord name')
        return
      }
      setProgression(prev => [...prev, res.data])
      setChordInput('')
    } catch (err) {
      setParseError('Backend unreachable — is the server running on port 8002?')
    }
  }, [octave, voicing])

  const handleInputKey = (e) => {
    if (e.key === 'Enter') addChord(chordInput)
    if (e.key === ',' || e.key === ' ') {
      const trimmed = chordInput.replace(/[, ]/g, '')
      if (trimmed) addChord(trimmed)
    }
  }

  const removeChord = (idx) => {
    setProgression(prev => prev.filter((_, i) => i !== idx))
  }

  const loadPreset = async (presetChords) => {
    setProgression([])
    setParseError('')
    setExportStatus('')
    const names = presetChords.split(',').map(s => s.trim()).filter(Boolean)
    try {
      for (const name of names) {
        const res = await window.api.request('post', '/midi/parse', {
          chord: name, octave: parseInt(octave), voicing,
        })
        if (res.success) {
          setProgression(prev => [...prev, res.data])
        }
      }
    } catch (err) {
      setParseError('Backend unreachable — is the server running on port 8002?')
    }
  }

  const exportMidi = async () => {
    if (progression.length === 0) {
      setExportStatus('error:Add at least one chord first.')
      return
    }
    setLoading(true)
    setExportStatus('')

    try {
      const res = await window.api.request('post', '/midi/progression', {
        chords: progression.map(p => p.chord),
        tempo: parseInt(tempo),
        beats_per_chord: parseInt(beatsPerChord),
        octave: parseInt(octave),
        voicing,
        velocity: parseInt(velocity),
        instrument_program: 0,
      })
      setLoading(false)
      if (!res.success) {
        setExportStatus(`error:${res.error}`)
      } else {
        setExportStatus(`success:Saved → ${res.data.filename}  (output/midi/)`)
      }
    } catch (err) {
      setLoading(false)
      setExportStatus('error:Backend unreachable — is the server running on port 8002?')
    }
  }

  const [statusType, statusMsg] = exportStatus.startsWith('error:')
    ? ['error', exportStatus.slice(6)]
    : exportStatus.startsWith('success:')
    ? ['success', exportStatus.slice(8)]
    : [null, '']

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-400">MIDI Chord Engine</h1>
        <p className="text-gray-500 text-sm mt-1">Build progressions, choose voicings, export .mid</p>
      </div>

      {/* Settings row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Voicing</span>
          <select
            value={voicing}
            onChange={e => setVoicing(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-teal-500"
          >
            {VOICING_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Octave</span>
          <input
            type="number" min={0} max={8} value={octave}
            onChange={e => setOctave(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-teal-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Tempo (BPM)</span>
          <input
            type="number" min={20} max={300} value={tempo}
            onChange={e => setTempo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-teal-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Beats/Chord</span>
          <input
            type="number" min={1} max={16} value={beatsPerChord}
            onChange={e => setBeatsPerChord(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-teal-500"
          />
        </label>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Quick Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => loadPreset(p.chords)}
              className="text-xs px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:border-teal-500 hover:text-teal-300 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chord input */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Add Chord</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={chordInput}
            onChange={e => setChordInput(e.target.value)}
            onKeyDown={handleInputKey}
            placeholder="e.g. Cm7  —  press Enter or comma to add"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={() => addChord(chordInput)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded transition-colors"
          >
            Add
          </button>
        </div>
        {parseError && (
          <p className="text-red-400 text-xs mt-1">{parseError}</p>
        )}
        <p className="text-gray-600 text-xs mt-1">
          Supports: maj · min/m · 7 · maj7 · m7 · dim · aug · sus2 · sus4 · add9 · m7b5 · maj9 · m9 · 9 · 6 · m6 · mMaj7 · 11 · 13
        </p>
      </div>

      {/* Progression display */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Progression ({progression.length} chord{progression.length !== 1 ? 's' : ''})
          </p>
          {progression.length > 0 && (
            <button
              onClick={() => setProgression([])}
              className="text-xs text-gray-600 hover:text-red-400"
            >
              Clear all
            </button>
          )}
        </div>

        {progression.length === 0 ? (
          <p className="text-gray-600 text-sm italic">No chords yet — add some above or pick a preset.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {progression.map((item, idx) => (
              <ChordPill key={idx} data={item} onRemove={() => removeChord(idx)} />
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Velocity</span>
            <input
              type="number" min={1} max={127} value={velocity}
              onChange={e => setVelocity(e.target.value)}
              className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-teal-500"
            />
          </label>

          <button
            onClick={exportMidi}
            disabled={loading || progression.length === 0}
            className="mt-4 px-6 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold transition-colors"
          >
            {loading ? 'Exporting…' : 'Export MIDI'}
          </button>
        </div>

        {statusMsg && (
          <StatusBadge type={statusType}>{statusMsg}</StatusBadge>
        )}
      </div>
    </div>
  )
}
