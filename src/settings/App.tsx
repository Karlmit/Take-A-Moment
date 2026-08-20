import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppSettings, Reminder, TimerStatus } from '../shared/types'
import { DEFAULT_SETTINGS, getDefaultSettingsForLanguage } from '../shared/types'
import type { Language } from '../shared/i18n'
import { useStrings } from '../shared/i18n'
import { ReminderCard } from './components/ReminderCard'
import { GeneralSettings } from './components/GeneralSettings'
import { StatusBar } from './components/StatusBar'
import { LanguagePicker } from './components/LanguagePicker'
import styles from './App.module.css'

declare global {
  interface Window {
    api: import('../shared/api').Api
  }
}

function newReminder(): Reminder {
  return {
    id: `reminder-${Date.now()}`,
    label: 'Break',
    frequencyMinutes: 30,
    durationMinutes: 2,
    message: 'Time to breathe.',
    soundStart: 'chime',
    soundEnd: 'soft',
    enabled: true,
    skipOnIdle: true,
    skipOnMedia: true,
    volume: 80,
    startTime: null,
    endTime: null,
  }
}

export function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [status, setStatus] = useState<TimerStatus | null>(null)
  const [version, setVersion] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'reminders' | 'general'>('reminders')
  const [showLanguagePicker, setShowLanguagePicker] = useState(false)
  const t = useStrings(settings.language)

  useEffect(() => {
    window.api.getSettings().then(setSettings)
    window.api.getTimerStatus().then(setStatus)
    window.api.getVersion().then(setVersion)
    window.api.isFirstRun().then(first => { if (first) setShowLanguagePicker(true) })

    const off = window.api.onStatusChanged(setStatus)
    return off
  }, [])

  const pickLanguage = async (language: Language) => {
    const next = getDefaultSettingsForLanguage(language)
    try {
      await window.api.saveSettings(next)
      setSettings(next)
      setStatus(await window.api.getTimerStatus())
      setShowLanguagePicker(false)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const save = async (next: AppSettings) => {
    try {
      await window.api.saveSettings(next)
      setSettings(next)
      // The backend reschedules on save; pull the authoritative status back so
      // the status bar and per-reminder "next break" times reflect the new
      // schedule immediately instead of waiting on an event.
      setStatus(await window.api.getTimerStatus())
      setError('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const preview = async () => {
    try {
      setError('')
      await window.api.previewBreak()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const addReminder = () => {
    save({ ...settings, reminders: [...settings.reminders, newReminder()] })
  }

  const updateReminder = (reminder: Reminder) => {
    save({
      ...settings,
      reminders: settings.reminders.map(r => r.id === reminder.id ? reminder : r),
    })
  }

  const deleteReminder = (id: string) => {
    save({ ...settings, reminders: settings.reminders.filter(r => r.id !== id) })
  }

  return (
    <div className={styles.root} data-theme={settings.theme}>
      {showLanguagePicker && <LanguagePicker onPick={pickLanguage} />}
      <header className={styles.header}>
        <h1 className={styles.appName}>{t.appName}</h1>
        <div className={styles.headerActions}>
          <AnimatePresence>
            {saved && (
              <motion.span
                className={styles.savedBadge}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Saved
              </motion.span>
            )}
          </AnimatePresence>
          <button className={styles.previewBtn} onClick={preview} type="button">
            {t.preview}
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      {status && <StatusBar status={status} t={t} onSkip={() => window.api.skipNext()} onTogglePause={() => status.paused ? window.api.resume() : window.api.pause()} />}

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'reminders' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reminders')}
          type="button"
        >
          {t.reminders}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('general')}
          type="button"
        >
          {t.generalSettings}
        </button>
      </nav>

      <main className={styles.main}>
        {activeTab === 'reminders' && (
          <div className={styles.reminderList}>
            {settings.reminders.map(r => (
              <ReminderCard
                key={r.id}
                reminder={r}
                t={t}
                timeFormat={settings.timeFormat}
                onChange={updateReminder}
                onDelete={() => deleteReminder(r.id)}
                nextBreakAt={status?.nextBreaks?.[r.id]}
              />
            ))}
            <button className={styles.addBtn} onClick={addReminder} type="button">
              + {t.addReminder}
            </button>
          </div>
        )}

        {activeTab === 'general' && (
          <GeneralSettings
            settings={settings}
            t={t}
            version={version}
            onChange={save}
          />
        )}
      </main>
    </div>
  )
}
