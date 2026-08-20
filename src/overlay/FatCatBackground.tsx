import { useRef, useState, type CSSProperties } from 'react'

function getVideoUrl(filename: string): string {
  return new URL(`../videos/${filename}`, location.href).href
}

function videoStyle(visible: boolean): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    // display:none (not opacity/z-index) — these videos have transparent
    // backgrounds, so anything merely "behind" or faded would still show
    // through the intro's transparent pixels. Fully absent from the render
    // tree is the only way to hide it.
    display: visible ? 'block' : 'none',
  }
}

export function FatCatBackground() {
  const loopRef = useRef<HTMLVideoElement>(null)
  const [showLoop, setShowLoop] = useState(false)
  const [hideIntro, setHideIntro] = useState(false)

  const handleIntroEnded = () => {
    const loop = loopRef.current
    if (loop) {
      loop.currentTime = 0
      void loop.play()
    }
    setShowLoop(true)
    // One frame of overlap (imperceptible) before removing the intro —
    // this is the original cat-gatekeeper's own handover technique.
    requestAnimationFrame(() => setHideIntro(true))
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <video
        src={getVideoUrl('neko1.webm')}
        autoPlay
        muted
        playsInline
        onEnded={handleIntroEnded}
        style={videoStyle(!hideIntro)}
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
