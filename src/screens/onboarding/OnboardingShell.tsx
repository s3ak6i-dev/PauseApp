import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'

interface OnboardingShellProps {
  step: number           // 1-5
  totalSteps?: number
  onNext: () => void
  onBack?: () => void
  nextLabel?: string
  children: ReactNode
  skipRoute?: string
}

export function OnboardingShell({
  step,
  totalSteps = 5,
  onNext,
  onBack,
  nextLabel = 'Continue →',
  children,
  skipRoute,
}: OnboardingShellProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col min-h-dvh px-6 py-8 max-w-lg mx-auto w-full"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        {/* Step dots */}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < step ? 'bg-accent' : 'bg-border-subtle'
              }`}
            />
          ))}
        </div>

        {/* Skip */}
        {skipRoute && (
          <button
            onClick={() => navigate(skipRoute)}
            className="text-body-sm text-text-dim hover:text-text-secondary transition-colors cursor-pointer"
          >
            Skip intro
          </button>
        )}
      </div>

      {/* Stage label */}
      <p className="text-body-sm text-text-dim mb-4">Stage {step} of {totalSteps}</p>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="shrink-0">
            ← Back
          </Button>
        )}
        <Button fullWidth onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </motion.div>
  )
}
