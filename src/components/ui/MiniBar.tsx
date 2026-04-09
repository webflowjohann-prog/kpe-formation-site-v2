interface MiniBarProps {
  label: string
  value: number
  max?: number
  unit?: string
  highlight?: boolean
}

export function MiniBar({ label, value, max = 100, unit = '', highlight = false }: MiniBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

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
      <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-700 ease-out',
            highlight ? 'bg-gold' : 'bg-t4',
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
