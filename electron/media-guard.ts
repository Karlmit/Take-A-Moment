/**
 * Camera and microphone in-use detection on Windows.
 *
 * Full implementation requires native bindings to the Windows Core Audio
 * Session API (camera) and Windows.Devices.Enumeration (microphone).
 * For now, this module provides a stub that always returns false, so
 * breaks are never suppressed by media. Replace with a native addon
 * (e.g. node-addon-api + Windows Runtime APIs) to enable this feature.
 */

export function isCameraInUse(): boolean {
  // TODO: query Windows camera access APIs via native binding
  return false
}

export function isMicrophoneInUse(): boolean {
  // TODO: query Windows Core Audio active capture sessions via native binding
  return false
}

export function isMediaInUse(): boolean {
  return isCameraInUse() || isMicrophoneInUse()
}
