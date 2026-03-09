/**
 * Preload script for the loading/splash window.
 * Exposes a minimal API for the splash screen to receive status updates.
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('loadingAPI', {
  /** Listen for status messages from the main process */
  onStatus: (cb) => ipcRenderer.on('loading:status', (_event, data) => cb(data)),

  /** Get the logo image path from the main process */
  getLogoPath: () => ipcRenderer.invoke('loading:getLogoPath'),
})
