import { powerMonitor } from 'electron'

/**
 * Returns the number of seconds the system has been idle.
 * Uses Electron's powerMonitor.getSystemIdleTime() which internally
 * calls GetLastInputInfo on Windows.
 */
export function getIdleSeconds(): number {
  try {
    return powerMonitor.getSystemIdleTime()
  } catch {
    return 0
  }
}

export function isIdle(thresholdMinutes: number): boolean {
  return getIdleSeconds() >= thresholdMinutes * 60
}
