import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  selectVideo: () => ipcRenderer.invoke('dialog:openFile'),
  
  // Phase 3: Add export trigger and progress listener
  exportVideo: (exportData) => ipcRenderer.invoke('video:export', exportData),
  onExportProgress: (callback) => {
    const subscription = (_event, percent) => callback(percent)
    ipcRenderer.on('export:progress', subscription)
    return () => ipcRenderer.removeListener('export:progress', subscription)
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