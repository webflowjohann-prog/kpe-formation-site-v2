import { useState, useEffect } from 'react'

interface MiniBarProps {
  label: string
  value: number
  max?: number
  unit?: string
  highlight?: boolean
}

export function MiniBar({ label, value, max = 100, unit = '', highlight = false }: MiniBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  const [displayPct, setDisplayPct] = useState(0)

  // Animation d'entrée : barre part de 0 et monte vers la valeur cible
  useEffect(() => {
    const timer = setTimeout(() => setDisplayPct(pct), 100)
    return () => clearTimeout(timer)
  }, [pct])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-sans font-medium uppercase tracking-[0.15em] text-[9px] text-t3">
          {label}
        </span>
        <span
          className={[
            'font-sans text-xs font-medium tabular-nums',
            highlight ? 'text-gold' : 'text-t2',
          ].join(' ')}
        >
          {value}
          {unit && <span className="text-[10px] text-t4 ml-0.5">{unit}</span>}
        </span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${displayPct}%`,
            background: highlight ? '#c9a96e' : 'rgba(0,0,0,0.18)',
            transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}
