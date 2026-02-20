import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type CardVariant = 'default' | 'elevated' | 'warm' | 'insight' | 'challenge' | 'recovery' | 'urge'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  urgencyColor?: 'low' | 'mid' | 'high'   // for urge event cards
}

const variantStyles: Record<CardVariant, string> = {
  default:   'bg-bg-elevated border border-border-subtle/50',
  elevated:  'bg-bg-card border border-border-subtle/30',
  warm:      'bg-bg-warm border-l-4 border-l-text-secondary border-y border-r border-border-subtle/20',
  insight:   'bg-gradient-to-br from-bg-elevated to-bg-base border border-accent-light/30 shadow-accent-glow',
  challenge: 'bg-bg-elevated border-t-4 border-t-success/60 border-b border-x border-border-subtle/30',
  recovery:  'bg-bg-warm border-l-4 border-l-text-secondary border-y border-r border-border-subtle/20',
  urge:      'bg-bg-card border-l-4 border-y border-r border-border-subtle/30',
}

const urgencyBorder: Record<'low' | 'mid' | 'high', string> = {
  low:  'border-l-accent',
  mid:  'border-l-warning',
  high: 'border-l-slip',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  urgencyColor,
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl2 p-6 transition-all duration-300',
      variantStyles[variant],
      variant === 'urge' && urgencyColor && urgencyBorder[urgencyColor],
      className
    )}
    {...props}
  >
    {children}
  </div>
))

Card.displayName = 'Card'
