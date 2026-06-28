import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0E27] disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white focus:ring-[#7C3AED] shadow-lg shadow-violet-500/25',
      secondary: 'bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30 focus:ring-[#06B6D4]',
      ghost: 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white focus:ring-white/20',
      danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 focus:ring-red-500',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
