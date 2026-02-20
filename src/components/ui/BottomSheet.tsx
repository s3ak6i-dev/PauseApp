import { useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  variant?: 'default' | 'warm' | 'slow'
  className?: string
  maxHeight?: string
}

const DURATION = { default: 0.3, warm: 0.45, slow: 0.45 }

export function BottomSheet({
  open,
  onClose,
  children,
  variant = 'default',
  className,
  maxHeight = '85vh',
}: BottomSheetProps) {
  const duration = DURATION[variant]
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration, ease: [0, 0, 0.2, 1] }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'rounded-t-3xl overflow-hidden',
              variant === 'warm' ? 'bg-bg-warm' : 'bg-bg-elevated',
              className
            )}
            style={{ maxHeight }}
            role="dialog"
            aria-modal="true"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-text-dim/50" />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - 20px)` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
