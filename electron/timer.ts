import { EventEmitter } from 'events'
import type { AppSettings, ActiveBreak, NextBreak, TimerStatus } from '../src/shared/types'
import { isIdle } from './idle'
import { isMediaInUse } from './media-guard'
import { pauseSystemMedia, resumeSystemMedia } from './music'

interface ScheduledReminder {
  reminderId: string
  label: string
  nextAt: number
  skipped: boolean
  timeoutId: ReturnType<typeof setTimeout> | null
}

export class Timer extends EventEmitter {
  private settings: AppSettings
  private scheduled: Map<string, ScheduledReminder> = new Map()
  private paused = false
  private activeBreak: ActiveBreak | null = null
  private breakTimeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(settings: AppSettings) {
    super()
    this.settings = settings
    this.rescheduleAll()
  }

  updateSettings(settings: AppSettings): void {
    this.settings = settings
    this.rescheduleAll()
  }

  private rescheduleAll(): void {
    // Clear existing timers
    for (const entry of this.scheduled.values()) {
      if (entry.timeoutId) clearTimeout(entry.timeoutId)
    }
    this.scheduled.clear()

    if (this.paused || this.activeBreak) return

    for (const reminder of this.settings.reminders) {
      if (!reminder.enabled) continue
      this.schedule(reminder.id, reminder.label, reminder.frequencyMinutes)
    }

    this.emit('status-changed', this.getStatus())
  }

  private schedule(id: string, label: string, frequencyMinutes: number): void {
    const nextAt = Date.now() + frequencyMinutes * 60 * 1000
    const entry: ScheduledReminder = { reminderId: id, label, nextAt, skipped: false, timeoutId: null }
    const delay = nextAt - Date.now()
    entry.timeoutId = setTimeout(() => this.onBreakDue(id), delay)
    this.scheduled.set(id, entry)
  }

  private onBreakDue(id: string): void {
    const reminder = this.settings.reminders.find(r => r.id === id)
    if (!reminder || !reminder.enabled || this.paused || this.activeBreak) return

    const entry = this.scheduled.get(id)
    if (!entry || entry.skipped) {
      // Was skipped — reschedule for next interval
      this.schedule(id, reminder.label, reminder.frequencyMinutes)
      if (entry) entry.skipped = false
      this.emit('status-changed', this.getStatus())
      return
    }

    // Check idle and media guards
    if (reminder.skipOnIdle && isIdle(this.settings.idleThresholdMinutes)) {
      this.schedule(id, reminder.label, reminder.frequencyMinutes)
      this.emit('status-changed', this.getStatus())
      return
    }
    if (reminder.skipOnMedia && isMediaInUse()) {
      this.schedule(id, reminder.label, reminder.frequencyMinutes)
      this.emit('status-changed', this.getStatus())
      return
    }

    this.startBreak(reminder.id)
  }

  private startBreak(reminderId: string, postponeCount = 0): void {
    const reminder = this.settings.reminders.find(r => r.id === reminderId)
    if (!reminder) return

    if (this.settings.pauseMusicOnBreak) pauseSystemMedia()

    const now = Date.now()
    this.activeBreak = {
      reminderId,
      reminder,
      startedAt: now,
      endsAt: now + reminder.durationMinutes * 60 * 1000,
      postponeCount,
    }

    // Clear the scheduled entry (it'll reschedule after the break)
    const entry = this.scheduled.get(reminderId)
    if (entry?.timeoutId) clearTimeout(entry.timeoutId)
    this.scheduled.delete(reminderId)

    this.emit('break-start', this.activeBreak)
    this.emit('status-changed', this.getStatus())

    // Auto-end when duration elapses
    this.breakTimeoutId = setTimeout(
      () => this.endBreak(),
      reminder.durationMinutes * 60 * 1000,
    )
  }

  endBreak(): void {
    if (!this.activeBreak) return
    if (this.breakTimeoutId) {
      clearTimeout(this.breakTimeoutId)
      this.breakTimeoutId = null
    }

    const ended = this.activeBreak
    this.activeBreak = null

    if (this.settings.pauseMusicOnBreak) resumeSystemMedia()

    this.emit('break-end', ended)

    // Reschedule for next interval
    if (!this.paused) {
      const reminder = this.settings.reminders.find(r => r.id === ended.reminderId)
      if (reminder?.enabled) {
        this.schedule(ended.reminderId, reminder.label, reminder.frequencyMinutes)
      }
    }

    this.emit('status-changed', this.getStatus())
  }

  postponeBreak(): void {
    if (!this.activeBreak) return
    const { reminderId, postponeCount } = this.activeBreak
    if (this.breakTimeoutId) clearTimeout(this.breakTimeoutId)
    this.activeBreak = null

    if (this.settings.pauseMusicOnBreak) resumeSystemMedia()

    const delay = this.settings.postponeMinutes * 60 * 1000
    setTimeout(() => this.startBreak(reminderId, postponeCount + 1), delay)

    this.emit('break-end', null)
    this.emit('status-changed', this.getStatus())
  }

  skipNext(): void {
    // Find the soonest scheduled break and mark it skipped
    let earliest: ScheduledReminder | null = null
    for (const entry of this.scheduled.values()) {
      if (!earliest || entry.nextAt < earliest.nextAt) earliest = entry
    }
    if (earliest) earliest.skipped = true
    this.emit('status-changed', this.getStatus())
  }

  pause(): void {
    this.paused = true
    for (const entry of this.scheduled.values()) {
      if (entry.timeoutId) clearTimeout(entry.timeoutId)
      entry.timeoutId = null
    }
    this.emit('status-changed', this.getStatus())
  }

  resume(): void {
    this.paused = false
    if (!this.activeBreak) {
      this.rescheduleAll()
    }
    this.emit('status-changed', this.getStatus())
  }

  preview(): void {
    const first = this.settings.reminders.find(r => r.enabled)
    if (first) this.startBreak(first.id)
  }

  getStatus(): TimerStatus {
    let nextBreak: NextBreak | null = null
    let earliestAt = Infinity
    for (const entry of this.scheduled.values()) {
      if (entry.nextAt < earliestAt) {
        earliestAt = entry.nextAt
        nextBreak = {
          reminderId: entry.reminderId,
          label: entry.label,
          scheduledAt: entry.nextAt,
        }
      }
    }
    return {
      paused: this.paused,
      nextBreak,
      activeBreak: this.activeBreak,
    }
  }
}
