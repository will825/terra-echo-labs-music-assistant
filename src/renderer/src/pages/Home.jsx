import React, { useEffect, useState } from 'react'

export default function Home() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    window.api.request('get', '/health')
      .then(res => setStatus(res.success ? '✅ Backend online' : `⚠️ ${res.error}`))
      .catch(() => setStatus('❌ Backend unreachable'))
  }, [])

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-teal-400 mb-2">Terra Echo Labs</h1>
      <p className="text-gray-400 mb-6">Music Production Intelligence Suite</p>
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <span className="text-xs text-gray-500 uppercase tracking-widest">Backend status</span>
        <p className="mt-1 text-sm">{status}</p>
      </div>
    </div>
  )
}
