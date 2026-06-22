import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { ActiveBreak, AppSettings } from '../shared/types'
import { useStrings, type Language } from '../shared/i18n'
import { playSound } from '../shared/sounds'
import { MeshBackground } from './MeshBackground'
import { AuroraBackground } from './AuroraBackground'
import { ShadwayBackground } from './ShadwayBackground'
import styles from './App.module.css'

declare global {
  interface Window {
    api: import('../shared/api').Api
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function App() {
  const [breakData, setBreakData] = useState<ActiveBreak | null>(null)
  const [visible, setVisible] = useState(false)
  const [remainingMs, setRemainingMs] = useState(0)
  const [postponeMinutes, setPostponeMinutes] = useState(5)
  const [language, setLanguage] = useState<Language>('sv')
  const [theme, setTheme] = useState('still-garden')
  const [breakBackground, setBreakBackground] = useState<AppSettings['breakBackground']>('default')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const t = useStrings(language)

  const startTick = useCallback((endsAt: number) => {
    if (tickRef.current) clearInterval(tickRef.current)
    const update = () => setRemainingMs(endsAt - Date.now())
    update()
    tickRef.current = setInterval(update, 500)
  }, [])

  const breakDataRef = useRef<ActiveBreak | null>(null)

  const applySettings = useCallback((s: {
    postponeMinutes: number
    language: Language
    theme: string
    breakBackground?: AppSettings['breakBackground']
  }) => {
    setPostponeMinutes(s.postponeMinutes)
    setLanguage(s.language as Language)
    setTheme(s.theme)
    setBreakBackground(s.breakBackground ?? 'default')
    document.documentElement.setAttribute('data-theme', s.theme)
  }, [])

  useEffect(() => {
    window.api.getSettings().then(applySettings)

    const offSettings = window.api.onSettingsChanged(applySettings)

    const offStart = window.api.onBreakStart((b) => {
      breakDataRef.current = b
      setBreakData(b)
      setVisible(true)
      startTick(b.endsAt)
      playSound(b.reminder.soundStart, b.reminder.volume)
    })

    const offEnd = window.api.onBreakEnd(() => {
      if (breakDataRef.current) playSound(breakDataRef.current.reminder.soundEnd, breakDataRef.current.reminder.volume)
      setVisible(false)
      setTimeout(() => {
        setBreakData(null)
        breakDataRef.current = null
      }, 600)
      if (tickRef.current) clearInterval(tickRef.current)
    })

    return () => {
      offSettings()
      offStart()
      offEnd()
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [startTick, applySettings])

  const handleEndEarly = () => {
    setVisible(false)
    if (breakData) playSound(breakData.reminder.soundEnd, breakData.reminder.volume)
    window.api.endBreak()
  }

  const handlePostpone = () => {
    setVisible(false)
    window.api.postponeBreak()
  }

  const isDarkBg = breakBackground !== 'default'

  const overlayVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.3 } },
      }
    : {
        hidden: { clipPath: 'inset(0 0 100% 0)' },
        visible: {
          clipPath: 'inset(0 0 0% 0)',
          transition: { duration: 1.5, ease: [0.4, 0, 0.9, 0.15] },
        },
        exit: {
          opacity: 0,
          transition: { duration: 0.5, ease: 'easeInOut' },
        },
      }

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  return (
    <AnimatePresence>
      {visible && breakData && (
        <motion.div
          className={`${styles.overlay} ${isDarkBg ? styles.overlayDark : ''}`}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key="overlay"
        >
          {isDarkBg && (
            <div className={styles.bgLayer}>
              {breakBackground === 'mesh' && <MeshBackground theme={theme} />}
              {breakBackground === 'aurora' && <AuroraBackground theme={theme} />}
              {breakBackground === 'shadway' && <ShadwayBackground theme={theme} />}
              <div className={styles.bgVeil} />
            </div>
          )}

          <motion.div
            className={styles.content}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className={styles.message}>{breakData.reminder.message}</p>

            <div className={styles.countdown}>
              <span className={styles.countdownLabel}>{t.breakEndsIn}</span>
              <span className={styles.countdownTime}>{formatTime(remainingMs)}</span>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.btnSecondary}
                onClick={handleEndEarly}
                type="button"
              >
                {t.endBreakEarly}
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handlePostpone}
                type="button"
              >
                {t.postpone(postponeMinutes)}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
