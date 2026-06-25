import { useEffect, useState } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'

const THEME_COLORS: Record<string, string[]> = {
  'still-garden': ['#4a7c59', '#7ab648', '#b8e4a0', '#d4f5d0', '#2d6b3a', '#a8d8a8'],
  'soft-dusk':    ['#7b3fa0', '#b06ec4', '#ddb8e8', '#f0d8f5', '#4a1870', '#c8a0d8'],
  'morning-mist': ['#2e6b9e', '#5ba3d0', '#a8d4f0', '#d0ebf8', '#1a3f6b', '#7ac0e8'],
}

export function ShadwayBackground({ theme }: { theme: string }) {
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const colors = THEME_COLORS[theme] ?? THEME_COLORS['still-garden']

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <MeshGradient
        width={dims.w}
        height={dims.h}
        colors={colors}
        distortion={0.8}
        swirl={0.6}
        grainMixer={0}
        grainOverlay={0}
        speed={0.12}
        offsetX={0.08}
      />
    </div>
  )
}
