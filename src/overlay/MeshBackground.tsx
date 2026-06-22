import { useEffect, useState } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'

const THEME_COLORS: Record<string, string[]> = {
  'still-garden': ['#0d1a0d', '#1a3d1f', '#2d6b3a', '#4a8c5a', '#7ab668', '#b8e4a0'],
  'soft-dusk':    ['#0d0718', '#220a40', '#4a1870', '#7b3fa0', '#b06ec4', '#ddb8e8'],
  'morning-mist': ['#040d18', '#0a1f3d', '#1a3f6b', '#2e6b9e', '#5ba3d0', '#a8d4f0'],
}

export function MeshBackground({ theme }: { theme: string }) {
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
        speed={0.3}
        backgroundColor="#050a05"
      />
    </div>
  )
}
