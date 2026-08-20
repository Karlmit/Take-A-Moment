import { useRef, useState, type CSSProperties } from 'react'

function getVideoUrl(filename: string): string {
  return new URL(`../videos/${filename}`, location.href).href
}

const CROSSFADE_MS = 400

function videoStyle(visible: boolean): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: visible ? 1 : 0,
    transition: `opacity ${CROSSFADE_MS}ms linear`,
  }
}

export function FatCatBackground() {
  const loopRef = useRef<HTMLVideoElement>(null)
  const [showLoop, setShowLoop] = useState(false)

  const handleIntroEnded = () => {
    const loop = loopRef.current
    if (loop) {
      loop.currentTime = 0
      void loop.play()
    }
    setShowLoop(true)
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
