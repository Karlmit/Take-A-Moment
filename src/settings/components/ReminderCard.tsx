import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Reminder } from '../../shared/types'
import type { useStrings } from '../../shared/i18n'
import styles from './ReminderCard.module.css'

type Strings = ReturnType<typeof useStrings>

const SOUND_OPTIONS = ['none', 'chime', 'bell', 'soft'] as const
type SoundOption = (typeof SOUND_OPTIONS)[number]

function soundLabel(v: SoundOption, t: Strings): string {
  return { none: t.soundNone, chime: t.soundChime, bell: t.soundBell, soft: t.soundSoft }[v]
}

interface Props {
  reminder: Reminder
  t: Strings
  onChange: (r: Reminder) => void
  onDelete: () => void
}

export function ReminderCard({ reminder, t, onChange, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState<Reminder>(reminder)

  const handleToggleExpand = () => {
    if (expanded) {
      // Reset draft if not saved
      setDraft(reminder)
    }
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
                  <input
                    type="number"
                    className={styles.input}
                    min={1}
                    max={480}
                    value={draft.frequencyMinutes}
                    onChange={e => update({ frequencyMinutes: Number(e.target.value) })}
                  />
                </Field>
                <Field label={`${t.duration} (${t.minutes})`}>
                  <input
                    type="number"
                    className={styles.input}
                    min={1}
                    max={60}
                    value={draft.durationMinutes}
                    onChange={e => update({ durationMinutes: Number(e.target.value) })}
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
                <Field label={t.soundAtStart}>
                  <select
                    className={styles.select}
                    value={draft.soundStart}
                    onChange={e => update({ soundStart: e.target.value as SoundOption })}
                  >
                    {SOUND_OPTIONS.map(s => (
                      <option key={s} value={s}>{soundLabel(s, t)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t.soundAtEnd}>
                  <select
                    className={styles.select}
                    value={draft.soundEnd}
                    onChange={e => update({ soundEnd: e.target.value as SoundOption })}
                  >
                    {SOUND_OPTIONS.map(s => (
                      <option key={s} value={s}>{soundLabel(s, t)}</option>
                    ))}
                  </select>
                </Field>
              </div>

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
