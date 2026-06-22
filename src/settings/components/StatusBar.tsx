import type { TimerStatus } from '../../shared/types'
import type { useStrings } from '../../shared/i18n'
import styles from './StatusBar.module.css'

type Strings = ReturnType<typeof useStrings>

interface Props {
  status: TimerStatus
  t: Strings
  onSkip: () => void
  onTogglePause: () => void
}

function formatNextBreak(scheduledAt: number): string {
  const diff = scheduledAt - Date.now()
  const mins = Math.max(0, Math.ceil(diff / 60000))
  if (mins <= 0) return 'now'
  if (mins === 1) return 'in 1 min'
  return `in ${mins} min`
}

export function StatusBar({ status, t, onSkip, onTogglePause }: Props) {
  const isActive = !!status.activeBreak

  return (
    <div className={`${styles.bar} ${isActive ? styles.active : ''}`}>
      <div className={styles.info}>
        {isActive ? (
          <span className={styles.label}>Break in progress</span>
        ) : status.paused ? (
          <span className={styles.label}>{t.paused}</span>
        ) : status.nextBreak ? (
          <span className={styles.label}>
            {status.nextBreak.label} — {formatNextBreak(status.nextBreak.scheduledAt)}
          </span>
        ) : (
          <span className={styles.label}>{t.noBreaks}</span>
        )}
      </div>
      <div className={styles.actions}>
        {!isActive && status.nextBreak && !status.paused && (
          <button className={styles.action} onClick={onSkip} type="button">
            Skip next
          </button>
        )}
        {!isActive && (
          <button className={styles.action} onClick={onTogglePause} type="button">
            {status.paused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>
    </div>
  )
}
