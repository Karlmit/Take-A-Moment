import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppSettings, Reminder, TimerStatus } from '../shared/types'
import { DEFAULT_SETTINGS } from '../shared/types'
import { useStrings } from '../shared/i18n'
import { ReminderCard } from './components/ReminderCard'
import { GeneralSettings } from './components/GeneralSettings'
import { StatusBar } from './components/StatusBar'
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
  }
}

export function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [status, setStatus] = useState<TimerStatus | null>(null)
  const [version, setVersion] = useState('')
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'reminders' | 'general'>('reminders')
  const t = useStrings(settings.language)

  useEffect(() => {
    window.api.getSettings().then(setSettings)
    window.api.getTimerStatus().then(setStatus)
    window.api.getVersion().then(setVersion)

    const off = window.api.onStatusChanged(setStatus)
    return off
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const save = async (next: AppSettings) => {
    setSettings(next)
    await window.api.saveSettings(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
          <button className={styles.previewBtn} onClick={() => window.api.previewBreak()} type="button">
            {t.preview}
          </button>
        </div>
      </header>

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
