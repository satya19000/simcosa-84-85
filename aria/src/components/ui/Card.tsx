import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: 'violet' | 'cyan' | 'none'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = 'none', children, ...props }, ref) => {
    const glowStyles = {
      violet: 'shadow-lg shadow-violet-500/10 border-violet-500/20',
      cyan: 'shadow-lg shadow-cyan-500/10 border-cyan-500/20',
      none: 'border-white/10',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'glass rounded-2xl border p-4',
          glowStyles[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
