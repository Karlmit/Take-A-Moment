import { spawn } from 'child_process'

// Queries SMTC (Windows System Media Transport Controls) to check if media is
// actively playing, then sends VK_MEDIA_PLAY_PAUSE only if it is.
// Exit code 0 = we paused something. Exit code 1 = nothing was playing.
//
// SMTC is the same API Windows uses for the taskbar / lock screen media widget.
// It covers Spotify, browsers, Windows Media Player, Groove Music, etc.
//
// The script avoids the VK_MEDIA_PLAY_PAUSE toggle problem: if Spotify (or any
// other app) was already paused, we do NOT send the key and do NOT set
// pausedByApp, so resume will also not fire.
const PAUSE_SCRIPT = `
Add-Type -AssemblyName 'System.Runtime.WindowsRuntime'
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 })[0]
$mgrTask = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
$mgr = $asTask.MakeGenericMethod($mgrTask.GetType().GenericTypeArguments[0]).Invoke($null, @($mgrTask)).GetAwaiter().GetResult()
$session = $mgr.GetCurrentSession()
if ($null -eq $session) { exit 1 }
$status = $session.GetPlaybackInfo().PlaybackStatus
if ($status -ne [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) { exit 1 }
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, int extra);' -Name U32 -Namespace TAM
[TAM.U32]::keybd_event(0xB3, 0, 0, 0)
[TAM.U32]::keybd_event(0xB3, 0, 2, 0)
exit 0
`.trim()

// Resume just sends the key unconditionally — we only call this if we know
// we paused (pausedByApp), so the state is known-paused and toggling is safe.
const RESUME_SCRIPT = `
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, int extra);' -Name U32 -Namespace TAM
[TAM.U32]::keybd_event(0xB3, 0, 0, 0)
[TAM.U32]::keybd_event(0xB3, 0, 2, 0)
`.trim()

let pausedByApp = false

function runPowerShell(script: string, onExit?: (code: number) => void): void {
  // Buffer.from with 'utf16le' produces the UTF-16 LE encoding that
  // PowerShell's -EncodedCommand expects — no shell quoting needed.
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  const proc = spawn('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-EncodedCommand', encoded,
  ], { windowsHide: true })
  if (onExit) proc.on('exit', (code) => onExit(code ?? 1))
  proc.unref()
}

export function pauseSystemMedia(): void {
  if (process.platform !== 'win32') return
  runPowerShell(PAUSE_SCRIPT, (code) => {
    pausedByApp = code === 0
  })
}

export function resumeSystemMedia(): void {
  if (!pausedByApp) return
  pausedByApp = false
  runPowerShell(RESUME_SCRIPT)
}
