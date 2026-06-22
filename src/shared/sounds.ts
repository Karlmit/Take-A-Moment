/**
 * Generates pleasant notification tones using the Web Audio API.
 * No audio files required — all tones are synthesised in the browser.
 */

type SoundType = 'chime' | 'bell' | 'soft' | 'none'

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function scheduleEnvelope(gain: GainNode, ac: AudioContext, attack: number, decay: number, sustain: number, release: number, duration: number): void {
  const now = ac.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.7, now + attack)
  gain.gain.linearRampToValueAtTime(sustain, now + attack + decay)
  gain.gain.setValueAtTime(sustain, now + duration - release)
  gain.gain.linearRampToValueAtTime(0, now + duration)
}

function playChime(): void {
  const ac = getCtx()
  // Ascending arpeggio: C5 E5 G5
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = ac.currentTime + i * 0.18
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.4, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9)
    osc.start(start)
    osc.stop(start + 0.9)
  })
}

function playBell(): void {
  const ac = getCtx()
  // Single resonant bell: fundamental + overtone
  const freqs = [440, 880, 1320]
  const gains = [0.5, 0.25, 0.12]
  freqs.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    const now = ac.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(gains[i], now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)
    osc.start(now)
    osc.stop(now + 2.0)
  })
}

function playSoft(): void {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = 'sine'
  osc.frequency.value = 528 // "healing frequency" — just a nice mid tone
  scheduleEnvelope(gain, ac, 0.08, 0.1, 0.3, 0.4, 0.9)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.9)
}

export async function playSound(type: SoundType): Promise<void> {
  if (type === 'none') return
  try {
    switch (type) {
      case 'chime': playChime(); break
      case 'bell': playBell(); break
      case 'soft': playSoft(); break
    }
  } catch (e) {
    console.warn('Sound playback failed:', e)
  }
}
