// Shared 2-octave piano keyboard visualization used by ScaleExplorer and ScaleFinder

const WK_W = 38   // white key width px
const WK_H = 112  // white key height px
const BK_W = 24   // black key width px
const BK_H = 70   // black key height px
const OCTAVES = 2

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_DEFS = [
  { note: 'C#', off: 0.65 },
  { note: 'D#', off: 1.65 },
  { note: 'F#', off: 3.65 },
  { note: 'G#', off: 4.65 },
  { note: 'A#', off: 5.65 },
]
const TO_SHARP = { Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B' }
const normNote = (n) => TO_SHARP[n] || n

export default function PianoKeyboard({ scaleNotes = [], rootNote = null }) {
  const hlSet    = new Set(scaleNotes.map(normNote))
  const normRoot = rootNote ? normNote(rootNote) : null
  const isHL     = (n) => hlSet.has(normNote(n))
  const isRoot   = (n) => normNote(n) === normRoot
  const totalW   = WK_W * WHITE_NOTES.length * OCTAVES

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
                  <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1, color: rt ? 'white' : '#0f766e' }}>
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
                  <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, color: '#99f6e4', whiteSpace: 'nowrap' }}>
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
