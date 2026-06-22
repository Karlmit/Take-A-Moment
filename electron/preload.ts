import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from './ipc'
import type { AppSettings, TimerStatus, ActiveBreak } from '../src/shared/types'
import type { Api } from '../src/shared/api'

const api: Api = {
  getTimerStatus: (): Promise<TimerStatus> => ipcRenderer.invoke(IPC.TIMER_STATUS),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),

  skipNext: (): Promise<void> => ipcRenderer.invoke(IPC.TIMER_SKIP_NEXT),
  pause: (): Promise<void> => ipcRenderer.invoke(IPC.TIMER_PAUSE),
  resume: (): Promise<void> => ipcRenderer.invoke(IPC.TIMER_RESUME),
  endBreak: (): Promise<void> => ipcRenderer.invoke(IPC.TIMER_END_BREAK),
  postponeBreak: (): Promise<void> => ipcRenderer.invoke(IPC.TIMER_POSTPONE),
  previewBreak: (): Promise<void> => ipcRenderer.invoke(IPC.TIMER_PREVIEW),
  saveSettings: (settings: AppSettings): Promise<void> => ipcRenderer.invoke(IPC.SETTINGS_SAVE, settings),
  quit: (): Promise<void> => ipcRenderer.invoke(IPC.APP_QUIT),
  openSettings: (): Promise<void> => ipcRenderer.invoke(IPC.APP_OPEN_SETTINGS),
  setStartup: (enabled: boolean): Promise<void> => ipcRenderer.invoke(IPC.APP_SET_STARTUP, enabled),
  getVersion: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_VERSION),
  openSoundFile: (): Promise<string | null> => ipcRenderer.invoke(IPC.APP_OPEN_SOUND_FILE),

  onBreakStart: (cb: (b: ActiveBreak) => void) => {
    const handler = (_: Electron.IpcRendererEvent, b: ActiveBreak) => cb(b)
    ipcRenderer.on(IPC.BREAK_START, handler)
    return () => ipcRenderer.removeListener(IPC.BREAK_START, handler)
  },
  onBreakEnd: (cb: () => void) => {
    const handler = (_: Electron.IpcRendererEvent) => cb()
    ipcRenderer.on(IPC.BREAK_END, handler)
    return () => ipcRenderer.removeListener(IPC.BREAK_END, handler)
  },
  onStatusChanged: (cb: (status: TimerStatus) => void) => {
    const handler = (_: Electron.IpcRendererEvent, s: TimerStatus) => cb(s)
    ipcRenderer.on(IPC.STATUS_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC.STATUS_CHANGED, handler)
  },
  onSettingsChanged: (cb: (s: AppSettings) => void) => {
    const handler = (_: Electron.IpcRendererEvent, s: AppSettings) => cb(s)
    ipcRenderer.on(IPC.SETTINGS_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC.SETTINGS_CHANGED, handler)
  },
}

contextBridge.exposeInMainWorld('api', api)
