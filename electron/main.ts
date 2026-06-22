import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  dialog,
} from 'electron'
import { join } from 'path'
import { Store } from './store'
import { Timer } from './timer'
import { IPC } from './ipc'
import type { AppSettings, ActiveBreak, TimerStatus } from '../src/shared/types'

// Enforce single instance
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let tray: Tray | null = null
let overlayWin: BrowserWindow | null = null
let settingsWin: BrowserWindow | null = null
let store: Store
let timer: Timer

// ─── Icon paths ──────────────────────────────────────────────────────────────

function iconPath(file: string): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icons', file)
  }
  return join(__dirname, '../../assets/icons', file)
}

// ─── Window factories ───────────────────────────────────────────────────────

function createOverlayWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    fullscreen: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.setAlwaysOnTop(true, 'screen-saver')

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay/index.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/overlay/index.html'))
  }

  return win
}

function createSettingsWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 680,
    height: 760,
    show: false,
    frame: true,
    titleBarStyle: 'default',
    resizable: true,
    minWidth: 560,
    minHeight: 600,
    icon: iconPath('app.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setMenuBarVisibility(false)

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings/index.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/settings/index.html'))
  }

  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
  })

  return win
}

// ─── Tray ───────────────────────────────────────────────────────────────────

function buildTrayMenu(status: TimerStatus): Electron.MenuItemConstructorOptions[] {
  const nextLabel = status.paused
    ? 'Breaks paused'
    : status.nextBreak
      ? `Next: ${status.nextBreak.label} at ${new Date(status.nextBreak.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'No breaks scheduled'

  return [
    { label: nextLabel, enabled: false },
    { type: 'separator' },
    {
      label: 'Skip next break',
      enabled: !status.paused && !!status.nextBreak,
      click: () => timer.skipNext(),
    },
    {
      label: status.paused ? 'Resume breaks' : 'Pause breaks',
      click: () => (status.paused ? timer.resume() : timer.pause()),
    },
    { type: 'separator' },
    { label: 'Settings', click: () => showSettings() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.exit(0) },
  ]
}

function updateTray(status: TimerStatus): void {
  if (!tray) return
  const icon = nativeImage.createFromPath(iconPath('tray.png'))
  tray.setImage(icon)
  const contextMenu = Menu.buildFromTemplate(buildTrayMenu(status))
  tray.setContextMenu(contextMenu)
  const tooltip = status.paused
    ? 'Take A Moment — paused'
    : status.nextBreak
      ? `Next: ${status.nextBreak.label}`
      : 'Take A Moment'
  tray.setToolTip(tooltip)
}

function createTray(): void {
  const icon = nativeImage.createFromPath(iconPath('tray.png'))
  tray = new Tray(icon)
  tray.setToolTip('Take A Moment')
  tray.on('click', () => showSettings())
  updateTray(timer.getStatus())
}

// ─── Break overlay management ────────────────────────────────────────────────

function showOverlay(breakData: ActiveBreak): void {
  if (!overlayWin || overlayWin.isDestroyed()) {
    overlayWin = createOverlayWindow()
  }

  const send = () => {
    if (!overlayWin || overlayWin.isDestroyed()) return
    overlayWin.webContents.send(IPC.BREAK_START, breakData)
    overlayWin.show()
    overlayWin.focus()
  }

  if (overlayWin.webContents.isLoading()) {
    overlayWin.webContents.once('did-finish-load', send)
  } else {
    send()
  }
}

function hideOverlay(): void {
  if (overlayWin?.isVisible()) {
    overlayWin.hide()
  }
}

function showSettings(): void {
  if (!settingsWin) settingsWin = createSettingsWindow()
  settingsWin.show()
  settingsWin.focus()
}

// ─── IPC handlers ────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  ipcMain.handle(IPC.TIMER_STATUS, () => timer.getStatus())
  ipcMain.handle(IPC.SETTINGS_GET, () => store.get())

  ipcMain.handle(IPC.TIMER_SKIP_NEXT, () => timer.skipNext())
  ipcMain.handle(IPC.TIMER_PAUSE, () => timer.pause())
  ipcMain.handle(IPC.TIMER_RESUME, () => timer.resume())
  ipcMain.handle(IPC.TIMER_END_BREAK, () => {
    timer.endBreak()
    hideOverlay()
  })
  ipcMain.handle(IPC.TIMER_POSTPONE, () => {
    timer.postponeBreak()
    hideOverlay()
  })
  ipcMain.handle(IPC.TIMER_PREVIEW, () => timer.preview())

  ipcMain.handle(IPC.SETTINGS_SAVE, (_e, settings: AppSettings) => {
    store.save(settings)
    timer.updateSettings(settings)
  })

  ipcMain.handle(IPC.APP_QUIT, () => app.exit(0))
  ipcMain.handle(IPC.APP_OPEN_SETTINGS, () => showSettings())

  ipcMain.handle(IPC.APP_SET_STARTUP, (_e, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
  })

  ipcMain.handle(IPC.APP_OPEN_SOUND_FILE, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }],
    })
    return result.canceled ? null : result.filePaths[0]
  })
}

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(() => {
  app.setAppUserModelId('app.take-a-moment')

  store = new Store()
  timer = new Timer(store.get())

  registerIpcHandlers()

  timer.on('break-start', (b: ActiveBreak) => {
    showOverlay(b)
    settingsWin?.webContents.send(IPC.STATUS_CHANGED, timer.getStatus())
  })

  timer.on('break-end', () => {
    overlayWin?.webContents.send(IPC.BREAK_END)
    settingsWin?.webContents.send(IPC.STATUS_CHANGED, timer.getStatus())
    setTimeout(() => hideOverlay(), 1000)
  })

  timer.on('status-changed', (status: TimerStatus) => {
    updateTray(status)
    settingsWin?.webContents.send(IPC.STATUS_CHANGED, status)
  })

  overlayWin = createOverlayWindow()
  createTray()

  if (store.isFirstRun()) showSettings()

  app.on('second-instance', () => showSettings())
})

app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})
