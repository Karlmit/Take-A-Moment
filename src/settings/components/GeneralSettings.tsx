import type { AppSettings } from '../../shared/types'
import type { useStrings } from '../../shared/i18n'
import { NumberInput } from './NumberInput'
import styles from './GeneralSettings.module.css'

type Strings = ReturnType<typeof useStrings>

interface Props {
  settings: AppSettings
  t: Strings
  version: string
  onChange: (s: AppSettings) => void
}

export function GeneralSettings({ settings, t, version, onChange }: Props) {
  const update = (patch: Partial<AppSettings>) => onChange({ ...settings, ...patch })

  return (
    <div className={styles.root}>
      <Section title={t.theme}>
        <div className={styles.themeGrid}>
          {(['still-garden', 'soft-dusk', 'morning-mist'] as const).map(theme => (
            <button
              key={theme}
              type="button"
              className={`${styles.themeOption} ${settings.theme === theme ? styles.themeSelected : ''}`}
              onClick={() => update({ theme })}
              data-theme={theme}
            >
              <span className={styles.themePreview} />
              <span className={styles.themeLabel}>
                {{
                  'still-garden': t.themeStillGarden,
                  'soft-dusk': t.themeSoftDusk,
                  'morning-mist': t.themeMorningMist,
                }[theme]}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.breakBackground}>
        <div className={styles.bgGrid}>
          {(['default', 'mesh', 'aurora', 'shadway', 'fatcat'] as const).map(bg => (
            <button
              key={bg}
              type="button"
              className={`${styles.bgOption} ${settings.breakBackground === bg ? styles.bgSelected : ''}`}
              onClick={() => update({ breakBackground: bg })}
            >
              <span className={`${styles.bgPreview} ${styles[`bgPreview_${bg}`]}`} />
              <span className={styles.bgLabel}>
                {{ default: t.bgDefault, mesh: t.bgMesh, aurora: t.bgAurora, shadway: t.bgShadway, fatcat: t.bgFatcat }[bg]}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.language}>
        <select
          className={styles.select}
          value={settings.language}
          onChange={e => update({ language: e.target.value as AppSettings['language'] })}
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="sv">Svenska</option>
          <option value="nl">Nederlands</option>
          <option value="da">Dansk</option>
        </select>
      </Section>

      <Section title={t.behaviour}>
        <div className={styles.fieldGroup}>
          <Row label={t.idleThreshold}>
            <div className={styles.inputWithUnit}>
              <NumberInput
                className={styles.numberInput}
                min={1}
                max={60}
                value={settings.idleThresholdMinutes}
                onChange={v => update({ idleThresholdMinutes: v })}
              />
              <span className={styles.unit}>{t.minutes}</span>
            </div>
          </Row>

          <Row label={t.postponeDuration}>
            <div className={styles.inputWithUnit}>
              <NumberInput
                className={styles.numberInput}
                min={1}
                max={60}
                value={settings.postponeMinutes}
                onChange={v => update({ postponeMinutes: v })}
              />
              <span className={styles.unit}>{t.minutes}</span>
            </div>
          </Row>

          <ToggleRow
            label={t.pauseMusic}
            description={t.pauseMusicDescription}
            checked={settings.pauseMusicOnBreak}
            onChange={v => update({ pauseMusicOnBreak: v })}
          />

          <ToggleRow
            label={t.launchOnStartup}
            description={t.startupDescription}
            checked={settings.launchOnStartup}
            onChange={v => update({ launchOnStartup: v })}
          />

          <ToggleRow
            label={t.coverAllDisplays}
            description={t.coverAllDisplaysDescription}
            checked={settings.coverAllDisplays}
            onChange={v => update({ coverAllDisplays: v })}
          />

          <Row label={t.timeFormat}>
            <select
              className={styles.select}
              value={settings.timeFormat}
              onChange={e => update({ timeFormat: e.target.value as '24h' | '12h' })}
            >
              <option value="24h">{t.timeFormat24h}</option>
              <option value="12h">{t.timeFormat12h}</option>
            </select>
          </Row>
        </div>
      </Section>

      {version && <p className={styles.versionTag}>v{version}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      {children}
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleInfo}>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowDescription}>{description}</span>
      </div>
      <label className={styles.toggle}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className={styles.toggleTrack} />
      </label>
    </div>
  )
}
