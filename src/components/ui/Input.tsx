import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-sans font-medium text-[9px] uppercase tracking-[0.15em] text-t3"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full h-11 px-4',
            'bg-card border rounded-[12px]',
            'font-sans text-sm text-t1',
            'placeholder:text-t4',
            'outline-none transition-all duration-200',
            error
              ? 'border-red-500/40 focus:border-red-500/60'
              : 'border-white/[0.06] focus:border-gold/40 focus:bg-surface',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <span className="font-sans text-[10px] text-red-400 leading-tight">{error}</span>
        )}
        {hint && !error && (
          <span className="font-sans text-[10px] text-t4 leading-tight">{hint}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
