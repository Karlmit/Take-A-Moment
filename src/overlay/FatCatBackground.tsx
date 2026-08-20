import { useEffect, useRef, useState, type CSSProperties } from 'react'

function getVideoUrl(filename: string): string {
  return new URL(`../videos/${filename}`, location.href).href
}

function videoStyle(onTop: boolean): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: onTop ? 1 : 0,
  }
}

export function FatCatBackground() {
  const loopRef = useRef<HTMLVideoElement>(null)
  const [showLoop, setShowLoop] = useState(false)

  useEffect(() => {
    // Warm up the loop video: play-then-pause forces the browser to decode
    // and paint its first frame right away, so it's already sitting behind
    // the intro (never visible yet) instead of blank when we need it.
    const loop = loopRef.current
    if (!loop) return
    loop.play().then(() => loop.pause()).catch(() => {})
  }, [])

  const handleIntroEnded = () => {
    const loop = loopRef.current
    const reveal = () => setShowLoop(true)
    if (!loop) {
      reveal()
      return
    }
    loop.currentTime = 0
    loop.play().catch(() => {}).then(() => {
      // Two rAFs guarantee the loop's frame has actually been painted
      // before we swap it to the front — no gap, no fade, just a hand-off.
      requestAnimationFrame(() => requestAnimationFrame(reveal))
    })
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <video
        src={getVideoUrl('neko1.webm')}
        autoPlay
        muted
        playsInline
        onEnded={handleIntroEnded}
        style={videoStyle(!showLoop)}
      />
      <video
        ref={loopRef}
        src={getVideoUrl('neko2.webm')}
        muted
        playsInline
        loop
        preload="auto"
        style={videoStyle(showLoop)}
      />
    </div>
  )
}
