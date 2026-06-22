import { spawn } from 'child_process'

// VK_MEDIA_PLAY_PAUSE — works with Spotify, browsers, Windows Media Player, etc.
const VK_MEDIA_PLAY_PAUSE = 0xB3

// Track whether we triggered the pause so resume only fires if we did.
let pausedByApp = false

function sendMediaPlayPause(): void {
  if (process.platform !== 'win32') return

  // Use powershell + P/Invoke to send a global keybd_event.
  // EncodedCommand avoids all shell quoting issues.
  const script = [
    `Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, int extra);' -Name U32 -Namespace TAM`,
    `[TAM.U32]::keybd_event(${VK_MEDIA_PLAY_PAUSE}, 0, 0, 0)`,
    `[TAM.U32]::keybd_event(${VK_MEDIA_PLAY_PAUSE}, 0, 2, 0)`,
  ].join('\n')

  const encoded = Buffer.from(script, 'utf16le').toString('base64')

  spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], {
    windowsHide: true,
  }).unref()
}

export function pauseSystemMedia(): void {
  if (process.platform !== 'win32') return
  sendMediaPlayPause()
  pausedByApp = true
}

export function resumeSystemMedia(): void {
  if (!pausedByApp) return
  pausedByApp = false
  sendMediaPlayPause()
}
