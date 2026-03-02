import { useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import MIDI from './pages/MIDI'
import Generator from './pages/Generator'
import AudioTools from './pages/AudioTools'
import Theory from './pages/Theory'
import Daily from './pages/Daily'

const NAV_ITEMS = [
  { to: '/',            label: 'Home' },
  { to: '/midi',        label: 'MIDI Engine' },
  { to: '/generator',   label: 'AI Generator' },
  { to: '/audio',       label: 'Audio Tools' },
  { to: '/theory',      label: 'Theory' },
  { to: '/daily',       label: 'Daily' }
]

// Page-name → route map for the tel:navigate custom event
const PAGE_ROUTES = {
  home:      '/',
  midi:      '/midi',
  generator: '/generator',
  audio:     '/audio',
  theory:    '/theory',
  daily:     '/daily',
}

export default function App() {
  const navigate = useNavigate()

  // Listen for cross-component navigation events (e.g. Generator → MIDI)
  useEffect(() => {
    const handler = (e) => {
      const route = PAGE_ROUTES[e.detail?.page]
      if (route) navigate(route)
    }
    window.addEventListener('tel:navigate', handler)
    return () => window.removeEventListener('tel:navigate', handler)
  }, [navigate])

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-mono">
      {/* Sidebar Nav */}
      <nav className="w-48 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-3 gap-1">
        <div className="text-xs font-bold text-teal-400 tracking-widest uppercase mb-6 px-2">
          Terra Echo
        </div>
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
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
