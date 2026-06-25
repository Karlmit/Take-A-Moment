import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { invoke } from '@tauri-apps/api/core'
import type { ActiveBreak, AppSettings } from '../shared/types'
import { useStrings, type Language } from '../shared/i18n'
import { playSound, preloadSound } from '../shared/sounds'
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
  const [armed, setArmed] = useState(false)
  const [visible, setVisible] = useState(false)
  const [remainingMs, setRemainingMs] = useState(0)
  const [postponeMinutes, setPostponeMinutes] = useState(5)
  const [language, setLanguage] = useState<Language>('sv')
  const [theme, setTheme] = useState('still-garden')
  const [breakBackground, setBreakBackground] = useState<AppSettings['breakBackground']>('default')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const readyForBreakRef = useRef<string | null>(null)
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

  const prepareBreak = useCallback(async (b: ActiveBreak) => {
    breakDataRef.current = b
    setBreakData(b)
    setArmed(true)
    setVisible(false)
    startTick(b.endsAt)

    await Promise.allSettled([
      preloadSound(b.reminder.soundStart),
      preloadSound(b.reminder.soundEnd),
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    ])

    if (readyForBreakRef.current !== `${b.reminderId}:${b.startedAt}`) {
      readyForBreakRef.current = `${b.reminderId}:${b.startedAt}`
      const label = new URLSearchParams(window.location.search).get('label') ?? 'overlay-0'
      await invoke('overlay_ready', { label })
    }
  }, [startTick])

  useEffect(() => {
    window.api.getSettings().then(applySettings)
    window.api.getTimerStatus().then(status => {
      if (status.activeBreak) prepareBreak(status.activeBreak)
    })

    const offSettings = window.api.onSettingsChanged(applySettings)

    const offStart = window.api.onBreakStart((b) => {
      prepareBreak(b)
    })

    const offPlay = window.api.onBreakPlay(() => {
      setVisible(true)
      const b = breakDataRef.current
      if (b) playSound(b.reminder.soundStart, b.reminder.volume)
    })

    const offEnd = window.api.onBreakEnd(() => {
      if (breakDataRef.current) playSound(breakDataRef.current.reminder.soundEnd, breakDataRef.current.reminder.volume)
      // Unmount the overlay so AnimatePresence plays the radial "exit" variant.
      // Do NOT setVisible(false) first — that collapses the overlay with the
      // clip-path wipe and pre-empts the radial circle exit animation.
      setArmed(false)
      setTimeout(() => {
        setVisible(false)
        setBreakData(null)
        breakDataRef.current = null
        readyForBreakRef.current = null
      }, 600)
      if (tickRef.current) clearInterval(tickRef.current)
    })

    return () => {
      offSettings()
      offStart()
      offPlay()
      offEnd()
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [applySettings, prepareBreak])

  // Let the backend drive the dismissal so onBreakEnd plays the radial exit
  // animation (and the end sound) in one place, instead of collapsing here.
  const handleEndEarly = () => {
    window.api.endBreak()
  }

  const handlePostpone = () => {
    window.api.postponeBreak()
  }

  const isDarkBg = breakBackground !== 'default'

  // These gentle wipe/radial animations are the core of the break experience,
  // so they always play — we deliberately do NOT downgrade them under the OS
  // "reduce motion" setting (which is off by default on many VMs/servers and
  // would otherwise drop them to a plain fade).
  const overlayVariants = {
    hidden: { clipPath: 'inset(0 0 100% 0)', '--hole-pct': -20 } as Record<string, string | number>,
    visible: {
      clipPath: 'inset(0 0 0% 0)',
      '--hole-pct': -20,
      transition: { duration: 1.5, ease: [0.4, 0, 0.9, 0.15] },
    },
    exit: {
      '--hole-pct': [-20, -10, 40, 160],
      transition: {
        '--hole-pct': {
          duration: 2.5,
          times: [0, 0.45, 0.72, 1],
          ease: 'linear',
        },
      },
    } as Record<string, string | number | object>,
  } as Variants

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
    exit: { opacity: 1, transition: { duration: 0 } },
  }

  return (
    <AnimatePresence>
      {armed && breakData && (
        <motion.div
          className={`${styles.overlay} ${isDarkBg ? styles.overlayDark : ''}`}
          variants={overlayVariants}
          initial="hidden"
          animate={visible ? 'visible' : 'hidden'}
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
