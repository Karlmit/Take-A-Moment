import { motion } from 'framer-motion'

interface ThemePalette {
  bg: string
  blob1: string
  blob2: string
  blob3: string
  gradA: string
  gradB: string
}

const THEME: Record<string, ThemePalette> = {
  'still-garden': {
    bg: '#020d04',
    blob1: '#14532d',
    blob2: '#15803d',
    blob3: '#166534',
    gradA: 'rgba(20, 83, 45, 0.3)',
    gradB: 'rgba(22, 101, 52, 0.25)',
  },
  'soft-dusk': {
    bg: '#06020f',
    blob1: '#581c87',
    blob2: '#7e22ce',
    blob3: '#3730a3',
    gradA: 'rgba(88, 28, 135, 0.3)',
    gradB: 'rgba(55, 48, 163, 0.25)',
  },
  'morning-mist': {
    bg: '#020810',
    blob1: '#1e3a8a',
    blob2: '#155e75',
    blob3: '#1d4ed8',
    gradA: 'rgba(30, 58, 138, 0.3)',
    gradB: 'rgba(21, 94, 117, 0.25)',
  },
}

const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left: ((i * 37 + 13) % 100).toFixed(1) + '%',
  top:  ((i * 53 + 7)  % 100).toFixed(1) + '%',
  dur:  2 + (i % 4),
  delay: (i * 0.13) % 5,
  opacity: 0.3 + ((i * 0.17) % 0.6),
}))

export function AuroraBackground({ theme }: { theme: string }) {
  const p = THEME[theme] ?? THEME['still-garden']

  return (
    <div style={{ position: 'absolute', inset: 0, background: p.bg, overflow: 'hidden' }}>
      {/* Pulsing radial gradient base */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle at 30% 70%, ${p.gradA} 0%, transparent 60%),
                          radial-gradient(circle at 70% 30%, ${p.gradB} 0%, transparent 60%)`,
        animation: 'aurora-pulse 10s ease-in-out infinite',
      }} />

      {/* Blob 1 — top-left, slow */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-25%', left: '-25%',
          width: '50%', height: '50%',
          background: p.blob1,
          borderRadius: '50%',
          filter: 'blur(64px)',
          opacity: 0.4,
        }}
        animate={{ x: [-50, 50, -50], y: [-20, 20, -20], scale: [1, 1.2, 1] }}
        transition={{ duration: 30, repeat: Infinity, repeatType: 'mirror' }}
      />

      {/* Blob 2 — bottom-right, medium */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-25%', right: '-25%',
          width: '50%', height: '50%',
          background: p.blob2,
          borderRadius: '50%',
          filter: 'blur(64px)',
          opacity: 0.4,
        }}
        animate={{ x: [50, -50, 50], y: [20, -20, 20], scale: [1, 1.3, 1] }}
        transition={{ duration: 40, repeat: Infinity, repeatType: 'mirror' }}
      />

      {/* Blob 3 — center, very slow */}
      <motion.div
        style={{
          position: 'absolute',
          top: '33%', left: '33%',
          width: '33%', height: '33%',
          background: p.blob3,
          borderRadius: '50%',
          filter: 'blur(64px)',
          opacity: 0.3,
        }}
        animate={{ x: [20, -20, 20], y: [-30, 30, -30] }}
        transition={{ duration: 50, repeat: Infinity, repeatType: 'mirror' }}
      />

      {/* Stars */}
      {STARS.map(s => (
        <motion.div
          key={s.id}
          style={{
            position: 'absolute',
            left: s.left, top: s.top,
            width: 2, height: 2,
            background: 'white',
            borderRadius: '50%',
          }}
          animate={{ opacity: [0, s.opacity, 0] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </div>
  )
}
