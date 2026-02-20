import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'

export function Welcome() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-dvh px-6 text-center gap-8"
    >
      {/* Pause ring logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Pause ring" role="img">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#4A4A62" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="52"
            fill="none" stroke="#7C8CF8" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52 * 0.7} ${2 * Math.PI * 52 * 0.3}`}
            transform="rotate(-90 60 60)"
            style={{ animation: 'pulse 3s ease-in-out infinite' }}
          />
        </svg>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="text-display font-light text-text-heading tracking-widest uppercase">
          Pause
        </h1>
        <p className="text-body-lg text-text-secondary max-w-xs mx-auto">
          Train the space between impulse and action.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="w-full max-w-xs space-y-3"
      >
        <Button
          fullWidth
          onClick={() => navigate('/onboarding/stage1')}
          size="lg"
        >
          Begin
        </Button>

        <button
          className="w-full text-body-sm text-accent-light hover:text-text-primary transition-colors py-2 cursor-pointer"
          onClick={() => navigate('/home')}
        >
          Already have an account?{' '}
          <span className="underline underline-offset-2">Sign in</span>
        </button>
      </motion.div>
    </motion.div>
  )
}
