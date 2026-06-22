export const IPC = {
  // Queries (renderer → main, returns value)
  TIMER_STATUS: 'timer:status',
  SETTINGS_GET: 'settings:get',

  // Commands (renderer → main, fire-and-forget or returns void)
  TIMER_SKIP_NEXT: 'timer:skip-next',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_END_BREAK: 'timer:end-break',
  TIMER_POSTPONE: 'timer:postpone',
  TIMER_PREVIEW: 'timer:preview',
  SETTINGS_SAVE: 'settings:save',
  APP_QUIT: 'app:quit',
  APP_OPEN_SETTINGS: 'app:open-settings',
  APP_SET_STARTUP: 'app:set-startup',
  APP_OPEN_SOUND_FILE: 'app:open-sound-file',

  // Events (main → renderer, push)
  BREAK_START: 'break:start',
  BREAK_END: 'break:end',
  STATUS_CHANGED: 'timer:status-changed',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
