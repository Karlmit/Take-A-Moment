import { execSync } from 'child_process'

/**
 * Checks whether the camera or microphone is actively in use by querying
 * the Windows Capability Access Manager registry keys. Windows sets
 * LastUsedTimeStop to 0 while a device is in use and writes a FILETIME
 * when the app releases it. Works for both packaged (Store/MSIX, e.g. new
 * Teams) and non-packaged apps (classic Teams, Zoom, Meet, etc.).
 */
function isDeviceInUse(type: 'microphone' | 'webcam'): boolean {
  if (process.platform !== 'win32') return false
  try {
    const key = `HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\${type}`
    const out = execSync(`reg query "${key}" /s /v LastUsedTimeStop`, {
      encoding: 'utf8',
      timeout: 2000,
      windowsHide: true,
    })
    // A value of 0x0 means the app hasn't released the device yet (still in use)
    return /LastUsedTimeStop\s+REG_QWORD\s+0x0(\s|$)/m.test(out)
  } catch {
    return false
  }
}

export function isCameraInUse(): boolean {
  return isDeviceInUse('webcam')
}

export function isMicrophoneInUse(): boolean {
  return isDeviceInUse('microphone')
}

export function isMediaInUse(): boolean {
  return isCameraInUse() || isMicrophoneInUse()
}
