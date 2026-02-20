import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  shaking?: boolean
}

export function Chip({ selected, shaking, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center px-4 py-2 rounded-full text-body-sm',
        'border transition-all duration-200 cursor-pointer select-none',
        'focus-visible:ring-2 focus-visible:ring-accent',
        selected
          ? 'bg-accent/20 border-accent text-text-heading'
          : 'bg-bg-card border-border-subtle text-text-secondary hover:border-accent/50 hover:text-text-primary',
        shaking && 'animate-shake',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
