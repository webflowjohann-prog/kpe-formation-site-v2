interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
}

export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
}: ScoreRingProps) {
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.min(score, 100) / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Track */}
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
          className="absolute inset-0"
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#c9a96e"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        {/* Valeur centrale */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-serif text-gold leading-none"
            style={{ fontSize: size * 0.28, fontWeight: 300 }}
          >
            {Math.round(score)}
          </span>
          {label && (
            <span
              className="font-sans font-medium uppercase tracking-[0.15em] text-t3 mt-1"
              style={{ fontSize: 8 }}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {sublabel && (
        <span className="font-sans text-xs text-t3 text-center">{sublabel}</span>
      )}
    </div>
  )
}
