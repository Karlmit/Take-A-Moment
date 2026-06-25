import { useState, useEffect } from 'react'

export function NumberInput({ value, min, max, onChange, className }: {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  className?: string
}) {
  const [raw, setRaw] = useState(String(value))

  useEffect(() => { setRaw(String(value)) }, [value])

  const commit = () => {
    const n = parseInt(raw, 10)
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(n, min ?? 1), max ?? Infinity)
      onChange(clamped)
      setRaw(String(clamped))
    } else {
      setRaw(String(value))
    }
  }

  const updateRaw = (next: string) => {
    setRaw(next)
    const n = parseInt(next, 10)
    if (!isNaN(n)) {
      onChange(Math.min(Math.max(n, min ?? 1), max ?? Infinity))
    }
  }

  return (
    <input
      type="number"
      className={className}
      min={min}
      max={max}
      value={raw}
      onChange={e => updateRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
    />
  )
}
