import { useState, type CSSProperties } from 'react'

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
  const [showLoop, setShowLoop] = useState(false)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <video
        src={getVideoUrl('neko1.webm')}
        autoPlay
        muted
        playsInline
        onEnded={() => setShowLoop(true)}
        style={videoStyle(!showLoop)}
      />
      {/* Plays and loops continuously from the start, hidden behind the
          intro — by the time it's revealed it's already mid-motion, so
          there's no fixed "first frame" and no decode gap to hide. */}
      <video
        src={getVideoUrl('neko2.webm')}
        autoPlay
        muted
        playsInline
        loop
        style={videoStyle(showLoop)}
      />
    </div>
  )
}
