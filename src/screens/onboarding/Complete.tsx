import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../../components/ui/Button'
import { IdentityCard } from '../../components/IdentityCard'

export function Complete() {
  const navigate        = useNavigate()
  const finaliseIdentity = useAppStore(s => s.finaliseIdentity)
  const identity        = useAppStore(s => s.identity)
  const stage3Label     = useAppStore(s => s.stage3Label)
  const stage4Values    = useAppStore(s => s.stage4Values)

  useEffect(() => {
    finaliseIdentity()
  }, [finaliseIdentity])

  const label  = identity?.label  ?? stage3Label  ?? 'Your Best Self'
  const values = identity?.values ?? stage4Values ?? []

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission()
    }
    navigate('/home')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-dvh px-6 text-center gap-8 max-w-lg mx-auto w-full"
    >
      {/* Filled ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="43" fill="none" stroke="#4A4A62" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="43"
            fill="none" stroke="#7C8CF8" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 43} 0`}
            transform="rotate(-90 50 50)"
          />
        </svg>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-display font-light text-text-heading">
          Welcome,
        </h1>
        <h1 className="text-display font-light text-accent-light">
          {label}.
        </h1>
        <p className="text-body text-text-secondary max-w-xs mx-auto mt-2">
          Your identity is set. Your values are clear.
          Now the practice begins.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="w-full"
      >
        <IdentityCard label={label} values={values} pauseScore={null} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="w-full space-y-4"
      >
        <Button fullWidth size="lg" onClick={() => navigate('/home')}>
          Go to my dashboard →
        </Button>

        <div className="space-y-3">
          <p className="text-body-sm text-text-dim">
            Allow notifications? We'll remind you once a day — never about failure.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={requestNotificationPermission}>
              Enable
            </Button>
            <Button variant="ghost" onClick={() => navigate('/home')}>
              Not now
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
