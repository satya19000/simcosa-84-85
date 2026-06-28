import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30',
              'focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
