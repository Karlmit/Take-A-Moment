import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { ActiveBreak, AppSettings, TimerStatus } from './types'
import type { Api } from './api'

const EVENT = {
  BREAK_START: 'break:start',
  BREAK_PLAY: 'break:play',
  BREAK_END: 'break:end',
  STATUS_CHANGED: 'timer:status-changed',
  SETTINGS_CHANGED: 'settings:changed',
} as const

export function installTauriApi(): void {
  const api: Api = {
    getTimerStatus: () => invoke<TimerStatus>('get_timer_status'),
    getSettings: () => invoke<AppSettings>('get_settings'),
    skipNext: () => invoke<void>('skip_next'),
    pause: () => invoke<void>('pause'),
    resume: () => invoke<void>('resume'),
    endBreak: () => invoke<void>('end_break'),
    postponeBreak: () => invoke<void>('postpone_break'),
    previewBreak: () => invoke<void>('preview_break'),
    saveSettings: (settings) => invoke<void>('save_settings', { settings }),
    quit: () => invoke<void>('quit'),
    openSettings: () => invoke<void>('open_settings'),
    setStartup: (enabled) => invoke<void>('set_startup', { enabled }),
    getVersion: () => invoke<string>('get_version'),
    isFirstRun: () => invoke<boolean>('is_first_run'),
    onBreakStart: (cb) => subscribe(EVENT.BREAK_START, cb),
    onBreakPlay: (cb) => subscribe(EVENT.BREAK_PLAY, cb),
    onBreakEnd: (cb) => subscribe(EVENT.BREAK_END, cb),
    onStatusChanged: (cb) => subscribe(EVENT.STATUS_CHANGED, cb),
    onSettingsChanged: (cb) => subscribe(EVENT.SETTINGS_CHANGED, cb),
  }

  window.api = api
}

function subscribe<T>(event: string, cb: (payload: T) => void): () => void {
  let unlisten: (() => void) | null = null
  listen<T>(event, e => cb(e.payload)).then(fn => {
    unlisten = fn
  })
  return () => {
    if (unlisten) unlisten()
  }
}
