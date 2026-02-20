import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'

type Outcome = 'paused' | 'continued' | 'still-in-it'

interface OutcomeScreenProps {
  outcome: Outcome
  durationSeconds: number
  onHome: () => void
  onRestart: () => void
}

const OUTCOME_CONFIG = {
  paused: {
    title: 'You stayed with it.',
    subtitle: 'That was real.',
    color: 'text-success',
  },
  continued: {
    title: 'Logged.',
    subtitle: 'Whenever you\'re ready, there\'s a reflection here.',
    color: 'text-text-primary',
  },
  'still-in-it': {
    title: 'That\'s okay.',
    subtitle: 'Urges are waves. This one is still moving.',
    color: 'text-text-secondary',
  },
}

export function OutcomeScreen({ outcome, durationSeconds, onHome, onRestart }: OutcomeScreenProps) {
  const config = OUTCOME_CONFIG[outcome]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 bg-bg-base flex flex-col items-center justify-center gap-8 px-6 z-50"
    >
      {/* Ring */}
      <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="43" fill="none" stroke="#4A4A62" strokeWidth="5" />
        <circle
          cx="50" cy="50" r="43"
          fill="none"
          stroke={outcome === 'paused' ? '#6BCB8B' : '#7C8CF8'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 43} 0`}
          transform="rotate(-90 50 50)"
        />
      </svg>

      <div className="text-center space-y-2">
        <h2 className={`text-h2 ${config.color}`}>{config.title}</h2>
        <p className="text-body text-text-secondary">{config.subtitle}</p>

        {outcome === 'paused' && durationSeconds > 0 && (
          <p className="font-mono text-accent-light text-2xl mt-2">
            +{durationSeconds}s
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {outcome === 'still-in-it' && (
          <Button fullWidth onClick={onRestart}>
            Start another round ◯
          </Button>
        )}
        <Button
          variant={outcome === 'still-in-it' ? 'ghost' : 'secondary'}
          fullWidth
          onClick={onHome}
        >
          {outcome === 'continued' ? 'Back to home' : 'Go home'}
        </Button>
      </div>
    </motion.div>
  )
}
