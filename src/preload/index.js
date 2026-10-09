import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectVideo: () => ipcRenderer.invoke('dialog:openFile'),
  
  // NEW: The bridge for opening audio files!
  openAudio: () => ipcRenderer.invoke('dialog:openAudio'),

  // NEW: Multi-file selection and merge bridge
  selectMultipleVideos: () => ipcRenderer.invoke('dialog:openMultipleFiles'),
  mergeVideos: (data) => ipcRenderer.invoke('video:merge', data),
  
  exportVideo: (data) => ipcRenderer.invoke('video:export', data),
  onExportProgress: (callback) => {
    ipcRenderer.on('export:progress', (_event, value) => callback(value))
    // Return an unsubscribe function to prevent memory leaks in React
    return () => ipcRenderer.removeAllListeners('export:progress')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}