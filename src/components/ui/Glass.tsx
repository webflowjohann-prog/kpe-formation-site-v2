import type { HTMLAttributes, ReactNode } from 'react'

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Glass({
  children,
  padding = 'md',
  hover = false,
  className = '',
  ...props
}: GlassProps) {
  return (
    <div
      className={[
        'glass',
        PADDING[padding],
        hover && 'transition-all duration-200 hover:border-gold/20 cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
