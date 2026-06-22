import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import type { AppSettings } from '../src/shared/types'
import { DEFAULT_SETTINGS, getDefaultSettingsForLanguage } from '../src/shared/types'

export class Store {
  private filePath: string
  private data: AppSettings
  private firstRun: boolean

  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = join(userDataPath, 'settings.json')
    this.firstRun = !existsSync(this.filePath)
    this.data = this.load()
  }

  isFirstRun(): boolean {
    return this.firstRun
  }

  private readInstallConfig(): { language?: string } | null {
    try {
      const configPath = join(process.resourcesPath, 'install-config.json')
      if (!existsSync(configPath)) return null
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      try { unlinkSync(configPath) } catch { /* ignore */ }
      return config
    } catch {
      return null
    }
  }

  private load(): AppSettings {
    if (!existsSync(this.filePath)) {
      const installConfig = this.readInstallConfig()
      if (installConfig?.language) {
        return getDefaultSettingsForLanguage(installConfig.language)
      }
      return structuredClone(DEFAULT_SETTINGS)
    }
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        // Ensure reminders array is preserved from file if present, with defaults merged in
        reminders: (parsed.reminders ?? DEFAULT_SETTINGS.reminders).map(r => ({
          volume: 80,
          startTime: null,
          ...r,
        })),
      }
    } catch {
      return structuredClone(DEFAULT_SETTINGS)
    }
  }

  save(settings: AppSettings): void {
    this.data = settings
    writeFileSync(this.filePath, JSON.stringify(settings, null, 2), 'utf-8')
  }

  get(): AppSettings {
    return this.data
  }
}
