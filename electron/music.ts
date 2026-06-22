/**
 * Pause and resume system media playback via Windows SMTC
 * (GlobalSystemMediaTransportControls API).
 *
 * Full implementation requires winrt or a native addon that calls
 * GlobalSystemMediaTransportControlsSessionManager.RequestCurrentSessionAsync().
 * This module provides no-op stubs so the app works without media control
 * until the native addon is wired up.
 */

export function pauseSystemMedia(): void {
  // TODO: call SMTC via native binding / WinRT projection
}

export function resumeSystemMedia(): void {
  // TODO: call SMTC via native binding / WinRT projection
}
