export interface Reminder {
  id: string
  label: string
  frequencyMinutes: number
  durationMinutes: number
  message: string
  soundStart: 'chime' | 'bell' | 'soft' | 'church-bell' | 'echo-flute' | 'pan-flute-a' | 'pan-flute-b' | 'pan-flute-d' | 'wind-breeze' | 'singing-bowl' | 'singing-bowl-deep' | 'none'
  soundEnd: 'chime' | 'bell' | 'soft' | 'church-bell' | 'echo-flute' | 'pan-flute-a' | 'pan-flute-b' | 'pan-flute-d' | 'wind-breeze' | 'singing-bowl' | 'singing-bowl-deep' | 'none'
  enabled: boolean
  skipOnIdle: boolean
  skipOnMedia: boolean
  volume: number
  startTime: string | null
  endTime: string | null
}

export interface AppSettings {
  reminders: Reminder[]
  theme: 'still-garden' | 'soft-dusk' | 'morning-mist'
  language: 'en' | 'de' | 'fr' | 'es' | 'sv' | 'nl' | 'da'
  idleThresholdMinutes: number
  pauseMusicOnBreak: boolean
  launchOnStartup: boolean
  postponeMinutes: number
  coverAllDisplays: boolean
  timeFormat: '24h' | '12h'
  breakBackground: 'default' | 'mesh' | 'aurora' | 'shadway' | 'fatcat'
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
  nextBreaks: Record<string, number>
}

export const DEFAULT_SETTINGS: AppSettings = {
  reminders: [
    {
      id: 'default-take-a-moment',
      label: 'Stanna upp ett tag',
      frequencyMinutes: 60,
      durationMinutes: 5,
      message: 'Stanna upp ett tag',
      soundStart: 'singing-bowl',
      soundEnd: 'singing-bowl-deep',
      enabled: true,
      skipOnIdle: true,
      skipOnMedia: false,
      volume: 80,
      startTime: null,
      endTime: null,
    },
  ],
  theme: 'still-garden',
  language: 'sv',
  idleThresholdMinutes: 5,
  pauseMusicOnBreak: false,
  launchOnStartup: false,
  postponeMinutes: 5,
  coverAllDisplays: true,
  timeFormat: '24h',
  breakBackground: 'default',
}

const REMINDER_LABELS: Record<AppSettings['language'], string> = {
  en: 'Take A Moment',
  de: 'Einen Moment',
  fr: 'Un moment',
  es: 'Un momento',
  sv: 'Stanna upp ett tag',
  nl: 'Neem even een moment',
  da: 'Tag et øjeblik',
}

const REMINDER_MESSAGES: Record<AppSettings['language'], string> = {
  en: 'Take A Moment',
  de: 'Nimm dir einen Moment',
  fr: 'Prenez un moment',
  es: 'Tómate un momento',
  sv: 'Stanna upp ett tag',
  nl: 'Neem even een moment',
  da: 'Tag et øjeblik',
}

export function getDefaultSettingsForLanguage(lang: string): AppSettings {
  const validLangs = ['en', 'de', 'fr', 'es', 'sv', 'nl', 'da'] as const
  const safeLang: AppSettings['language'] = (validLangs as readonly string[]).includes(lang)
    ? (lang as AppSettings['language'])
    : 'sv'
  return {
    ...DEFAULT_SETTINGS,
    language: safeLang,
    reminders: [{
      ...DEFAULT_SETTINGS.reminders[0],
      label: REMINDER_LABELS[safeLang],
      message: REMINDER_MESSAGES[safeLang],
    }],
  }
}
