import { EventEmitter } from 'events'
import type { AppSettings, ActiveBreak, NextBreak, TimerStatus } from '../src/shared/types'
import { isIdle } from './idle'
import { isMediaInUse } from './media-guard'
import { pauseSystemMedia, resumeSystemMedia } from './music'

function nextOccurrenceFromAnchor(startTimeStr: string, frequencyMinutes: number): number {
  const [h, m] = startTimeStr.split(':').map(Number)
  const anchor = new Date()
  anchor.setHours(h, m, 0, 0)
  const anchorMs = anchor.getTime()
  const now = Date.now()
  if (anchorMs > now) return anchorMs
  const intervalMs = frequencyMinutes * 60 * 1000
  const periods = Math.floor((now - anchorMs) / intervalMs)
  return anchorMs + (periods + 1) * intervalMs
}

interface ScheduledReminder {
  reminderId: string
  label: string
  nextAt: number
  skipped: boolean
}

export class Timer extends EventEmitter {
  private settings: AppSettings
  private scheduled: Map<string, ScheduledReminder> = new Map()
  private paused = false
  private activeBreak: ActiveBreak | null = null
  private breakTimeoutId: ReturnType<typeof setTimeout> | null = null
  private tickInterval: ReturnType<typeof setInterval> | null = null

  constructor(settings: AppSettings) {
    super()
    this.settings = settings
    this.rescheduleAll()
  }

  updateSettings(settings: AppSettings): void {
    this.settings = settings
    this.rescheduleAll()
  }

  private startTick(): void {
    if (this.tickInterval) return
    this.tickInterval = setInterval(() => this.tick(), 10_000)
  }

  private stopTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
  }

  private tick(): void {
    if (this.paused || this.activeBreak) return
    const now = Date.now()
    for (const [id, entry] of this.scheduled.entries()) {
      if (entry.nextAt <= now) {
        this.onBreakDue(id)
      }
    }
  }

  private rescheduleAll(): void {
    this.scheduled.clear()

    if (this.paused || this.activeBreak) {
      this.stopTick()
      return
    }

    for (const reminder of this.settings.reminders) {
      if (!reminder.enabled) continue
      this.schedule(reminder.id, reminder.label, reminder.frequencyMinutes, reminder.startTime ?? null)
    }

    this.startTick()
    this.emit('status-changed', this.getStatus())
  }

  private schedule(id: string, label: string, frequencyMinutes: number, startTime: string | null = null): void {
    const nextAt = startTime
      ? nextOccurrenceFromAnchor(startTime, frequencyMinutes)
      : Date.now() + frequencyMinutes * 60 * 1000
    this.scheduled.set(id, { reminderId: id, label, nextAt, skipped: false })
  }

  private onBreakDue(id: string): void {
    const reminder = this.settings.reminders.find(r => r.id === id)
    if (!reminder || !reminder.enabled || this.paused || this.activeBreak) return

    const entry = this.scheduled.get(id)
    if (!entry || entry.skipped) {
      // Was skipped — reschedule for next interval
      this.schedule(id, reminder.label, reminder.frequencyMinutes, reminder.startTime ?? null)
      if (entry) entry.skipped = false
      this.emit('status-changed', this.getStatus())
      return
    }

    // Check idle and media guards
    if (reminder.skipOnIdle && isIdle(this.settings.idleThresholdMinutes)) {
      this.schedule(id, reminder.label, reminder.frequencyMinutes, reminder.startTime ?? null)
      this.emit('status-changed', this.getStatus())
      return
    }
    if (reminder.skipOnMedia && isMediaInUse()) {
      this.schedule(id, reminder.label, reminder.frequencyMinutes, reminder.startTime ?? null)
      this.emit('status-changed', this.getStatus())
      return
    }

    this.scheduled.delete(id)
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
        this.schedule(ended.reminderId, reminder.label, reminder.frequencyMinutes, reminder.startTime ?? null)
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
    this.stopTick()
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
    const nextBreaks: Record<string, number> = {}
    for (const entry of this.scheduled.values()) {
      nextBreaks[entry.reminderId] = entry.nextAt
      if (entry.nextAt < earliestAt) {
        earliestAt = entry.nextAt
        nextBreak = { reminderId: entry.reminderId, label: entry.label, scheduledAt: entry.nextAt }
      }
    }
    return { paused: this.paused, nextBreak, activeBreak: this.activeBreak, nextBreaks }
  }
}
