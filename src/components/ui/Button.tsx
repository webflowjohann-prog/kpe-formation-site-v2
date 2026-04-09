import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const VARIANTS = {
  gold: 'bg-gold text-bg hover:bg-gold-hover shadow-none hover:shadow-glow',
  outline: 'bg-transparent text-gold border border-gold/30 hover:border-gold/60 hover:bg-gold/5',
  ghost: 'bg-transparent text-t3 hover:text-t1 hover:bg-white/5',
}

const SIZES = {
  sm: 'h-8 px-4 text-[8px]',
  md: 'h-11 px-6 text-[9px]',
  lg: 'h-12 px-8 text-[10px]',
}

export function Button({
  variant = 'gold',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-[12px]',
        'font-sans font-medium uppercase tracking-[0.15em]',
        'transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
