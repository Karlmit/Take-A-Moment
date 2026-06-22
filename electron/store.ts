import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { AppSettings } from '../src/shared/types'
import { DEFAULT_SETTINGS } from '../src/shared/types'

export class Store {
  private filePath: string
  private data: AppSettings

  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = join(userDataPath, 'settings.json')
    this.data = this.load()
  }

  private load(): AppSettings {
    if (!existsSync(this.filePath)) {
      return structuredClone(DEFAULT_SETTINGS)
    }
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        // Ensure reminders array is preserved from file if present
        reminders: parsed.reminders ?? DEFAULT_SETTINGS.reminders,
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
