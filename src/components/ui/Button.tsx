import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: [
    'bg-accent text-white',
    'shadow-accent-btn',
    'hover:bg-accent-dark active:bg-accent-dark',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),

  secondary: [
    'bg-transparent border border-accent text-accent-light',
    'hover:bg-accent/10 active:bg-accent/20',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),

  ghost: [
    'bg-transparent text-text-secondary',
    'hover:text-text-primary hover:bg-bg-elevated',
    'disabled:opacity-30 disabled:cursor-not-allowed',
  ].join(' '),

  destructive: [
    'bg-slip/15 border border-slip text-slip',
    'hover:bg-slip/25 active:bg-slip/30',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeStyles = {
  sm: 'h-10 px-4 text-body-sm rounded-xl',
  md: 'h-14 px-6 text-body rounded-xl',
  lg: 'h-16 px-8 text-body-lg rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center font-sans font-medium',
      'transition-all duration-200 cursor-pointer select-none',
      'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  >
    {children}
  </button>
))

Button.displayName = 'Button'
