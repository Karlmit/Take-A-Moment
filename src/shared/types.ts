export interface Reminder {
  id: string
  label: string
  frequencyMinutes: number
  durationMinutes: number
  message: string
  soundStart: 'chime' | 'bell' | 'soft' | 'none'
  soundEnd: 'chime' | 'bell' | 'soft' | 'none'
  enabled: boolean
  skipOnIdle: boolean
  skipOnMedia: boolean
  volume: number
}

export interface AppSettings {
  reminders: Reminder[]
  theme: 'still-garden' | 'soft-dusk' | 'morning-mist'
  language: 'en' | 'de' | 'fr' | 'es' | 'sv'
  idleThresholdMinutes: number
  pauseMusicOnBreak: boolean
  launchOnStartup: boolean
  postponeMinutes: number
}

export interface ActiveBreak {
  reminderId: string
  reminder: Reminder
  startedAt: number
  endsAt: number
  postponeCount: number
}

export interface NextBreak {
  reminderId: string
  label: string
  scheduledAt: number
}

export interface TimerStatus {
  paused: boolean
  nextBreak: NextBreak | null
  activeBreak: ActiveBreak | null
}

export const DEFAULT_SETTINGS: AppSettings = {
  reminders: [
    {
      id: 'default-take-a-moment',
      label: 'Take A Moment',
      frequencyMinutes: 60,
      durationMinutes: 5,
      message: 'Stanna upp ett tag',
      soundStart: 'chime',
      soundEnd: 'soft',
      enabled: true,
      skipOnIdle: true,
      skipOnMedia: false,
      volume: 80,
    },
  ],
  theme: 'still-garden',
  language: 'sv',
  idleThresholdMinutes: 5,
  pauseMusicOnBreak: false,
  launchOnStartup: false,
  postponeMinutes: 5,
}
