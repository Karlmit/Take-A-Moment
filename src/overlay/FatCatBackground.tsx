import { useState } from 'react'

function getVideoUrl(filename: string): string {
  return new URL(`../videos/${filename}`, location.href).href
}

export function FatCatBackground() {
  const [phase, setPhase] = useState<'intro' | 'loop'>('intro')

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <video
        key={phase}
        src={getVideoUrl(phase === 'intro' ? 'neko1.webm' : 'neko2.webm')}
        autoPlay
        muted
        playsInline
        loop={phase === 'loop'}
        onEnded={() => setPhase('loop')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  )
}
