import { contextBridge, ipcRenderer } from 'electron'

// Expose a clean API object to the renderer via window.api
contextBridge.exposeInMainWorld('api', {
  /**
   * Make a request to the FastAPI backend.
   * @param {string} method - HTTP method (get, post, put, delete)
   * @param {string} path   - API path e.g. '/health' or '/midi/chords'
   * @param {object} [data] - Request body (for POST/PUT)
   * @returns {Promise<{success: boolean, data: any, error: string|null}>}
   */
  request: (method, path, data = null) =>
    ipcRenderer.invoke('api:request', { method, path, data })
})
