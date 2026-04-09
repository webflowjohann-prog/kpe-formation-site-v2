interface ProgressBarProps {
  current: number
  total: number
  category: string
}

export default function ProgressBar({ current, total, category }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <span className="font-sans text-xs text-gold tracking-widest uppercase">{category}</span>
        <span className="font-sans text-xs text-t4">{current} / {total}</span>
      </div>
      <div className="w-full h-px bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
