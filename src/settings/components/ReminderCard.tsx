import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Reminder } from '../../shared/types'
import type { useStrings } from '../../shared/i18n'
import { playSound } from '../../shared/sounds'
import { NumberInput } from './NumberInput'
import styles from './ReminderCard.module.css'

type Strings = ReturnType<typeof useStrings>

function nextWholeHour(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return `${String(d.getHours()).padStart(2, '0')}:00`
}

function plusHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(v => parseInt(v, 10) || 0)
  const total = Math.min(23 * 60 + 59, h * 60 + m + hours * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function formatNextBreakTime(ts: number, t: Strings, timeFormat: '24h' | '12h'): string {
  const diff = ts - Date.now()
  const mins = Math.ceil(diff / 60000)
  const timeStr = new Date(ts).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h',
  })
  if (mins <= 0) return timeStr
  const now = new Date()
  const then = new Date(ts)
  const isToday = then.toDateString() === now.toDateString()
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = then.toDateString() === tomorrow.toDateString()
  if (isToday) return `${t.today} ${timeStr}`
  if (isTomorrow) return `${t.tomorrow} ${timeStr}`
  return timeStr
}

const SOUND_OPTIONS = ['none', 'chime', 'bell', 'soft', 'church-bell', 'echo-flute', 'pan-flute-a', 'pan-flute-b', 'pan-flute-d', 'wind-breeze', 'singing-bowl', 'singing-bowl-deep'] as const
type SoundOption = (typeof SOUND_OPTIONS)[number]

function soundLabel(v: SoundOption, t: Strings): string {
  const map: Record<SoundOption, string> = {
    none: t.soundNone,
    chime: t.soundChime,
    bell: t.soundBell,
    soft: t.soundSoft,
    'church-bell': t.soundChurchBell,
    'echo-flute': t.soundEchoFlute,
    'pan-flute-a': t.soundPanFluteA,
    'pan-flute-b': t.soundPanFluteB,
    'pan-flute-d': t.soundPanFluteD,
    'wind-breeze': t.soundWindBreeze,
    'singing-bowl': t.soundSingingBowl,
    'singing-bowl-deep': t.soundSingingBowlDeep,
  }
  return map[v]
}

interface Props {
  reminder: Reminder
  t: Strings
  timeFormat: '24h' | '12h'
  onChange: (r: Reminder) => void
  onDelete: () => void
  nextBreakAt?: number
}

function TimeOfDayInput({ value, onChange, disabled }: {
  value: string | null
  onChange: (v: string) => void
  disabled: boolean
}) {
  const parts = (value ?? '00:00').split(':')
  const hh = Math.min(23, Math.max(0, parseInt(parts[0] ?? '0', 10) || 0))
  const mm = Math.min(59, Math.max(0, parseInt(parts[1] ?? '0', 10) || 0))

  const commitH = (raw: string) => {
    const n = Math.min(23, Math.max(0, parseInt(raw, 10) || 0))
    onChange(`${String(n).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }
  const commitM = (raw: string) => {
    const n = Math.min(59, Math.max(0, parseInt(raw, 10) || 0))
    onChange(`${String(hh).padStart(2, '0')}:${String(n).padStart(2, '0')}`)
  }

  return (
    <div className={`${styles.timeCustom} ${disabled ? styles.timeInputDisabled : ''}`}>
      <input
        type="number"
        min={0}
        max={23}
        value={hh}
        disabled={disabled}
        className={styles.timeUnit}
        onFocus={e => e.target.select()}
        onChange={e => commitH(e.target.value)}
      />
      <span className={styles.timeSep}>:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={mm}
        disabled={disabled}
        className={styles.timeUnit}
        onFocus={e => e.target.select()}
        onChange={e => commitM(e.target.value)}
      />
    </div>
  )
}

function SoundField({ label, value, onChange, onPlay, t }: {
  label: string
  value: SoundOption
  onChange: (v: SoundOption) => void
  onPlay: () => void
  t: Strings
}) {
  return (
    <Field label={label}>
      <div className={styles.soundRow}>
        <select
          className={styles.select}
          value={value}
          onChange={e => onChange(e.target.value as SoundOption)}
        >
          {SOUND_OPTIONS.map(s => (
            <option key={s} value={s}>{soundLabel(s, t)}</option>
          ))}
        </select>
        <button
          className={styles.playBtn}
          type="button"
          onClick={onPlay}
          disabled={value === 'none'}
          title="Preview sound"
        >▶</button>
      </div>
    </Field>
  )
}

export function ReminderCard({ reminder, t, timeFormat, onChange, onDelete, nextBreakAt }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState<Reminder>(reminder)
  const [startTimeLocked, setStartTimeLocked] = useState(reminder.startTime !== null)

  // Settings load asynchronously (and change when saved), so keep the draft in
  // sync with the latest reminder whenever the card isn't open for editing.
  // Without this the draft stays frozen on the initial default values, showing
  // stale fields (e.g. "Every 60 min") and overwriting real settings on save.
  useEffect(() => {
    if (!expanded) {
      setDraft(reminder)
      setStartTimeLocked(reminder.startTime !== null)
    }
  }, [reminder, expanded])

  const handleToggleExpand = () => {
    setExpanded(v => !v)
  }

  const update = (patch: Partial<Reminder>) => {
    setDraft(d => ({ ...d, ...patch }))
  }

  const save = () => {
    onChange(draft)
    setExpanded(false)
  }

  const cancel = () => {
    setDraft(reminder)
    setExpanded(false)
  }

  return (
    <div className={`${styles.card} ${expanded ? styles.expanded : ''}`}>
      {/* Collapsed header — always visible */}
      <div className={styles.header} onClick={handleToggleExpand} role="button" tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleToggleExpand()}
        aria-expanded={expanded}>
        <div className={styles.headerLeft}>
          <label className={styles.toggle} onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={reminder.enabled}
              onChange={e => onChange({ ...reminder, enabled: e.target.checked })}
            />
            <span className={styles.toggleTrack} />
          </label>
          <div>
            <p className={styles.reminderLabel}>{reminder.label}</p>
            <p className={styles.reminderMeta}>
              {t.frequency} {reminder.frequencyMinutes} {t.minutes} · {reminder.durationMinutes} {t.minutes}
              {reminder.enabled && nextBreakAt && nextBreakAt > 0 && (
                <> · {formatNextBreakTime(nextBreakAt, t, timeFormat)}</>
              )}
            </p>
          </div>
        </div>
        <span className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`}>›</span>
      </div>

      {/* Expanded edit form */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.form}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
          >
            <div className={styles.fields}>
              <Field label={t.reminderLabel}>
                <input
                  type="text"
                  className={styles.input}
                  value={draft.label}
                  onChange={e => update({ label: e.target.value })}
                />
              </Field>

              <div className={styles.row}>
                <Field label={`${t.frequency} (${t.minutes})`}>
                  <NumberInput
                    className={styles.input}
                    min={1}
                    max={480}
                    value={draft.frequencyMinutes}
                    onChange={v => update({ frequencyMinutes: v })}
                  />
                </Field>
                <Field label={`${t.duration} (${t.minutes})`}>
                  <NumberInput
                    className={styles.input}
                    min={1}
                    max={60}
                    value={draft.durationMinutes}
                    onChange={v => update({ durationMinutes: v })}
                  />
                </Field>
              </div>

              <Field label={t.message}>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={draft.message}
                  rows={2}
                  onChange={e => update({ message: e.target.value })}
                />
              </Field>

              <div className={styles.row}>
                <SoundField
                  label={t.soundAtStart}
                  value={draft.soundStart}
                  onChange={v => update({ soundStart: v })}
                  onPlay={() => playSound(draft.soundStart, draft.volume ?? 80)}
                  t={t}
                />
                <SoundField
                  label={t.soundAtEnd}
                  value={draft.soundEnd}
                  onChange={v => update({ soundEnd: v })}
                  onPlay={() => playSound(draft.soundEnd, draft.volume ?? 80)}
                  t={t}
                />
              </div>

              <Field label={t.volume}>
                <div className={styles.volumeRow}>
                  <input
                    type="range"
                    className={styles.volumeSlider}
                    min={0}
                    max={100}
                    value={draft.volume ?? 80}
                    onChange={e => update({ volume: Number(e.target.value) })}
                  />
                  <span className={styles.volumeValue}>{draft.volume ?? 80}%</span>
                </div>
              </Field>

              <div className={styles.row}>
                <Field label={t.startTime}>
                  <div className={styles.startTimeRow}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkboxInput}
                        checked={draft.startTime !== null}
                        onChange={e => {
                          if (e.target.checked) {
                            update({ startTime: nextWholeHour() })
                            setStartTimeLocked(false)
                          } else {
                            update({ startTime: null, endTime: null })
                            setStartTimeLocked(false)
                          }
                        }}
                      />
                    </label>
                    <TimeOfDayInput
                      value={draft.startTime}
                      disabled={draft.startTime === null || startTimeLocked}
                      onChange={v => update({ startTime: v })}
                    />
                    {draft.startTime !== null && (
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={!startTimeLocked}
                          onChange={e => setStartTimeLocked(!e.target.checked)}
                        />
                        <span className={styles.rescheduleLabel}>{t.reschedule}</span>
                      </label>
                    )}
                  </div>
                </Field>

                {nextBreakAt !== undefined && nextBreakAt > 0 && (
                  <Field label={t.nextBreak}>
                    <span className={styles.nextBreakValue}>
                      {formatNextBreakTime(nextBreakAt, t, timeFormat)}
                    </span>
                  </Field>
                )}
              </div>

              {draft.startTime !== null && (
                <div className={styles.row}>
                  <Field label={t.endTime}>
                    <div className={styles.startTimeRow}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={draft.endTime !== null}
                          onChange={e => {
                            update({
                              endTime: e.target.checked ? plusHours(draft.startTime as string, 4) : null,
                            })
                          }}
                        />
                      </label>
                      <TimeOfDayInput
                        value={draft.endTime}
                        disabled={draft.endTime === null || startTimeLocked}
                        onChange={v => update({ endTime: v })}
                      />
                    </div>
                  </Field>
                </div>
              )}

              <div className={styles.checkboxRow}>
                <Checkbox
                  label={t.skipWhenIdle}
                  checked={draft.skipOnIdle}
                  onChange={v => update({ skipOnIdle: v })}
                />
                <Checkbox
                  label={t.skipWhenMedia}
                  checked={draft.skipOnMedia}
                  onChange={v => update({ skipOnMedia: v })}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.deleteBtn} onClick={onDelete} type="button">
                {t.deleteReminder}
              </button>
              <div className={styles.formActionsRight}>
                <button className={styles.cancelBtn} onClick={cancel} type="button">
                  {t.cancel}
                </button>
                <button className={styles.saveBtn} onClick={save} type="button">
                  {t.save}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className={styles.checkboxInput}
      />
      <span>{label}</span>
    </label>
  )
}
