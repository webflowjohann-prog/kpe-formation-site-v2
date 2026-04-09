export type BiomarkerStatus = 'optimal' | 'low' | 'high' | 'unknown'

interface BiomarkerPillProps {
  name: string
  value: number | string
  unit?: string
  status?: BiomarkerStatus
  onClick?: () => void
}

const STATUS_CLASSES: Record<BiomarkerStatus, string> = {
  optimal: 'border-gold/30 text-gold',
  low: 'border-t3/20 text-t3',
  high: 'border-t3/20 text-t3',
  unknown: 'border-white/[0.08] text-t4',
}

export function BiomarkerPill({
  name,
  value,
  unit,
  status = 'unknown',
  onClick,
}: BiomarkerPillProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5',
        'bg-surface border rounded-full',
        'transition-all duration-150',
        STATUS_CLASSES[status],
        onClick ? 'hover:bg-card cursor-pointer' : '',
      ].join(' ')}
      onClick={onClick}
    >
      <span className="font-sans font-medium uppercase tracking-[0.12em] text-[8px]">{name}</span>
      <span className="w-px h-3 bg-current opacity-20" aria-hidden="true" />
      <span className="font-sans text-[11px] font-medium tabular-nums">
        {value}
        {unit && (
          <span className="text-[8px] ml-0.5 opacity-50">{unit}</span>
        )}
      </span>
    </Component>
  )
}
