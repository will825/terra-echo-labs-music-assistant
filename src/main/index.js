import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readdirSync, existsSync } from 'fs'
import { spawn } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import axios from 'axios'

const BACKEND_URL        = 'http://127.0.0.1:8002'
const BACKEND_TIMEOUT_MS = 45_000   // max wait for backend to boot
const HEALTH_POLL_MS     = 600      // poll /health every 600ms

let backendProcess = null
let loadingWindow  = null
let mainWindow     = null

// ─────────────────────────────────────────────────────────────────────────────
// Backend management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Path to the PyInstaller binary bundled inside the .app, or null in dev mode.
 * electron-builder extraResources puts it at Contents/Resources/tel-backend/
 */
function getBackendBinary() {
  if (!app.isPackaged) return null
  return join(process.resourcesPath, 'tel-backend', 'tel-backend')
}

function startBackend() {
  const binary = getBackendBinary()
  if (!binary) return  // dev: backend started by `npm run backend`

  if (!existsSync(binary)) {
    console.error(`[main] Backend binary not found: ${binary}`)
    return
  }

  console.log(`[main] Spawning backend: ${binary}`)
  backendProcess = spawn(binary, [], {
    env: { ...process.env, TEL_DATA_DIR: app.getPath('userData'), TEL_PORT: '8002' },
    detached: false,
  })

  backendProcess.stdout.on('data', (d) => process.stdout.write(`[backend] ${d}`))
  backendProcess.stderr.on('data', (d) => process.stderr.write(`[backend] ${d}`))
  backendProcess.on('exit', (code, signal) => {
    console.log(`[main] Backend exited — code: ${code}, signal: ${signal}`)
    backendProcess = null
  })
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill('SIGTERM')
    backendProcess = null
  }
}

async function waitForBackend() {
  const deadline = Date.now() + BACKEND_TIMEOUT_MS
  let attempts = 0
  while (Date.now() < deadline) {
    attempts++
    try {
      const res = await axios.get(`${BACKEND_URL}/health`, { timeout: 1500 })
      if (res.data?.success) {
        console.log(`[main] Backend ready (${attempts} polls)`)
        return true
      }
    } catch { /* not ready yet */ }
    await new Promise((r) => setTimeout(r, HEALTH_POLL_MS))
  }
  console.error('[main] Backend timed out')
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading (splash) window
// ─────────────────────────────────────────────────────────────────────────────

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 320,
    resizable: false,
    frame: false,
    center: true,
    show: false,
    title: 'Terra Echo Labs',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: join(__dirname, 'loading-preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  loadingWindow.loadFile(join(__dirname, 'loading.html'))
  loadingWindow.once('ready-to-show', () => loadingWindow?.show())
  loadingWindow.on('closed', () => { loadingWindow = null })
}

function sendLoadingStatus(message, error = false) {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send('loading:status', { message, error })
  }
}

function closeLoadingWindow() {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.close()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main window
// ─────────────────────────────────────────────────────────────────────────────

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'Terra Echo Labs',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Close loading window only once main window is fully ready to show
  mainWindow.once('ready-to-show', () => {
    closeLoadingWindow()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IPC handlers
// ─────────────────────────────────────────────────────────────────────────────

function registerIPC() {
  // Logo path for the loading splash screen
  ipcMain.handle('loading:getLogoPath', () => {
    const candidates = [
      join(__dirname, '../renderer/assets'),
      join(app.getAppPath(), 'out/renderer/assets'),
    ]
    for (const dir of candidates) {
      try {
        const logo = readdirSync(dir).find((f) => f.startsWith('logo') && f.endsWith('.png'))
        if (logo) return `file://${join(dir, logo)}`
      } catch { /* skip */ }
    }
    return null
  })

  // Native file open dialog
  ipcMain.handle('dialog:openFile', async (_event, { filters } = {}) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters || [
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'flac', 'aiff', 'aif', 'ogg', 'm4a'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (result.canceled || !result.filePaths.length) return null
    return result.filePaths[0]
  })

  // Generic API proxy — renderer calls window.api.request(method, path, data)
  ipcMain.handle('api:request', async (_event, { method, path, data }) => {
    try {
      const res = await axios({ method, url: `${BACKEND_URL}${path}`, data })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.detail || err.message
      return { success: false, data: null, error: msg }
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.terraechostudios.musicassistant')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  registerIPC()

  if (app.isPackaged) {
    // ── Packaged: show splash, spawn backend, wait, open main window ──────
    createLoadingWindow()
    sendLoadingStatus('Starting audio engine...')
    startBackend()

    await new Promise((r) => setTimeout(r, 800))   // let binary exec start
    sendLoadingStatus('Initializing services...')

    const ready = await waitForBackend()
    if (ready) {
      sendLoadingStatus('Ready!')
      createMainWindow()
    } else {
      sendLoadingStatus('Backend failed to start. Please quit and reopen the app.', true)
    }
  } else {
    // ── Dev: backend is started externally — open main window directly ───
    createMainWindow()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('before-quit', stopBackend)
app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') app.quit()
})
