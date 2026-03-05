import { useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import MIDI from './pages/MIDI'
import Generator from './pages/Generator'
import AudioTools from './pages/AudioTools'
import Theory from './pages/Theory'
import Daily from './pages/Daily'

/* ── SVG Icons ────────────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
)
const IconMidi = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
  </svg>
)
const IconAI = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
)
const IconAudio = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
  </svg>
)
const IconTheory = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
  </svg>
)
const IconDaily = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
)

/* ── Nav Config ───────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/',            label: 'Home',          Icon: IconHome  },
  { to: '/midi',        label: 'MIDI Engine',   Icon: IconMidi  },
  { to: '/generator',   label: 'AI Generator',  Icon: IconAI    },
  { to: '/audio',       label: 'Audio Tools',   Icon: IconAudio },
  { to: '/theory',      label: 'Theory',        Icon: IconTheory},
  { to: '/daily',       label: 'Daily',         Icon: IconDaily },
]

const PAGE_ROUTES = {
  home:      '/',
  midi:      '/midi',
  generator: '/generator',
  audio:     '/audio',
  theory:    '/theory',
  daily:     '/daily',
}

/* ── App Shell ────────────────────────────────────────────────────────────── */
export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => {
      const route = PAGE_ROUTES[e.detail?.page]
      if (route) navigate(route)
    }
    window.addEventListener('tel:navigate', handler)
    return () => window.removeEventListener('tel:navigate', handler)
  }, [navigate])

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <nav className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">

        {/* Logo / Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-800/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="TEL Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML =
                    '<span class="text-teal-400 text-xl font-bold">T</span>'
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white leading-tight tracking-wide">
                Terra Echo
              </div>
              <div className="text-xs text-teal-400/70 leading-tight tracking-widest uppercase">
                Labs
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
                    : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-100 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    <Icon />
                  </span>
                  <span className="font-medium">{label}</span>
                  {to === '/daily' && (
                    <span className="ml-auto text-xs bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded px-1.5 py-0.5 leading-none">
                      new
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom Accent / Mascot */}
        <div className="px-3 pb-3 flex flex-col items-center gap-2">
          {/* Hummingbird accent image */}
          <div className="w-full h-20 flex items-center justify-center opacity-40 hover:opacity-70 transition-opacity">
            <img
              src="/hummingbird.png"
              alt=""
              className="max-h-full max-w-full object-contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          {/* Version */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800/50 border border-gray-700/50 w-full justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
            <span className="text-xs text-gray-500 tracking-wider">v1.0.0</span>
          </div>
        </div>

      </nav>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/midi"      element={<MIDI />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/audio"     element={<AudioTools />} />
          <Route path="/theory"    element={<Theory />} />
          <Route path="/daily"     element={<Daily />} />
        </Routes>
      </main>
    </div>
  )
}
