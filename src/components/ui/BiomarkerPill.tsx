export type BiomarkerStatus = 'optimal' | 'normal' | 'low' | 'high' | 'unknown'

interface BiomarkerPillProps {
  name: string
  value: number | string
  unit?: string
  status?: BiomarkerStatus
  onClick?: () => void
}

// Styles contrastés sur fond blanc — badge avec fond coloré + border visible
const STATUS_STYLES: Record<BiomarkerStatus, { wrapper: string; dot: string }> = {
  optimal: {
    wrapper: 'badge-optimal cursor-pointer',
    dot: 'bg-gold',
  },
  normal: {
    wrapper: 'badge-normal',
    dot: 'bg-success',
  },
  low: {
    wrapper: 'badge-alert',
    dot: 'bg-alert-red',
  },
  high: {
    wrapper: 'badge-warning',
    dot: 'bg-alert-orange',
  },
  unknown: {
    wrapper: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-t2',
    dot: 'bg-t3',
  },
}

export function BiomarkerPill({
  name,
  value,
  unit,
  status = 'unknown',
  onClick,
}: BiomarkerPillProps) {
  const Component = onClick ? 'button' : 'div'
  const styles = STATUS_STYLES[status]

  return (
    <Component
      className={[styles.wrapper, 'transition-all duration-150'].join(' ')}
      onClick={onClick}
    >
      <span className={['w-1.5 h-1.5 rounded-full shrink-0', styles.dot].join(' ')} />
      <span className="font-sans font-medium uppercase tracking-[0.10em] text-[9px]">{name}</span>
      <span className="font-sans text-[11px] font-bold tabular-nums ml-0.5">
        {value}
        {unit && (
          <span className="text-[9px] font-normal opacity-60 ml-0.5">{unit}</span>
        )}
      </span>
    </Component>
  )
}
