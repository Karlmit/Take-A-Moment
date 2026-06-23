import type { AppSettings, TimerStatus, ActiveBreak } from './types'

export interface Api {
  getTimerStatus: () => Promise<TimerStatus>
  getSettings: () => Promise<AppSettings>
  skipNext: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  endBreak: () => Promise<void>
  postponeBreak: () => Promise<void>
  previewBreak: () => Promise<void>
  saveSettings: (settings: AppSettings) => Promise<void>
  quit: () => Promise<void>
  openSettings: () => Promise<void>
  setStartup: (enabled: boolean) => Promise<void>
  getVersion: () => Promise<string>
  openSoundFile: () => Promise<string | null>
  isFirstRun: () => Promise<boolean>
  onBreakStart: (cb: (b: ActiveBreak) => void) => () => void
  onBreakEnd: (cb: () => void) => () => void
  onStatusChanged: (cb: (status: TimerStatus) => void) => () => void
  onSettingsChanged: (cb: (s: AppSettings) => void) => () => void
}
