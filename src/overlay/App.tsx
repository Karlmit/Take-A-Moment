import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { ActiveBreak } from '../shared/types'
import { playSound } from '../shared/sounds'
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
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const startTick = useCallback((endsAt: number) => {
    if (tickRef.current) clearInterval(tickRef.current)
    const update = () => setRemainingMs(endsAt - Date.now())
    update()
    tickRef.current = setInterval(update, 500)
  }, [])

  const breakDataRef = useRef<ActiveBreak | null>(null)

  useEffect(() => {
    window.api.getSettings().then(s => setPostponeMinutes(s.postponeMinutes))

    const offStart = window.api.onBreakStart((b) => {
      breakDataRef.current = b
      setBreakData(b)
      setVisible(true)
      startTick(b.endsAt)
      playSound(b.reminder.soundStart)
    })

    const offEnd = window.api.onBreakEnd(() => {
      if (breakDataRef.current) playSound(breakDataRef.current.reminder.soundEnd)
      setVisible(false)
      setTimeout(() => {
        setBreakData(null)
        breakDataRef.current = null
      }, 600)
      if (tickRef.current) clearInterval(tickRef.current)
    })

    return () => {
      offStart()
      offEnd()
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [startTick])

  const handleEndEarly = () => {
    setVisible(false)
    if (breakData) playSound(breakData.reminder.soundEnd)
    window.api.endBreak()
  }

  const handlePostpone = () => {
    setVisible(false)
    window.api.postponeBreak()
  }

  // Entrance: overlay "rolls" across the screen from top via clip-path
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
          transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
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
      transition: { delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  return (
    <AnimatePresence>
      {visible && breakData && (
        <motion.div
          className={styles.overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key="overlay"
        >
          <motion.div
            className={styles.content}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className={styles.message}>{breakData.reminder.message}</p>

            <div className={styles.countdown}>
              <span className={styles.countdownLabel}>Break ends in</span>
              <span className={styles.countdownTime}>{formatTime(remainingMs)}</span>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.btnSecondary}
                onClick={handleEndEarly}
                type="button"
              >
                End break early
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handlePostpone}
                type="button"
              >
                Postpone {postponeMinutes} min
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
