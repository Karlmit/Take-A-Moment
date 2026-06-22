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

  return (
    <input
      type="number"
      className={className}
      min={min}
      max={max}
      value={raw}
      onChange={e => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
    />
  )
}
