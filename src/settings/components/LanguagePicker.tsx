import { motion } from 'framer-motion'
import type { Language } from '../../shared/i18n'
import styles from './LanguagePicker.module.css'

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'sv', label: 'Svenska',    flag: '🇸🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'da', label: 'Dansk',      flag: '🇩🇰' },
]

interface Props {
  onPick: (language: Language) => void
}

export function LanguagePicker({ onPick }: Props) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className={styles.card}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Take A Moment</h1>
          <p className={styles.subtitle}>Choose your language</p>
        </div>

        <div className={styles.grid}>
          {LANGUAGES.map(({ code, label, flag }, i) => (
            <motion.button
              key={code}
              className={styles.langBtn}
              onClick={() => onPick(code)}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04, duration: 0.2 }}
            >
              <span className={styles.flag}>{flag}</span>
              <span className={styles.langName}>{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
