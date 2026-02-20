import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { BreathRing } from '../../components/BreathRing'
import { Button } from '../../components/ui/Button'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Chip } from '../../components/ui/Chip'
import { useTimer } from './useTimer'
import { OutcomeScreen } from './OutcomeScreen'
import { useAppStore } from '../../store/useAppStore'
import { addUrgeEvent } from '../../db/queries'

type TimerState = 'idle' | 'running' | 'complete' | 'stopped'
type Outcome = 'paused' | 'continued' | 'still-in-it'

const TRIGGER_CHIPS = [
  'Boredom', 'Stress', 'Loneliness', 'Late night',
  'Scrolling', 'Physical tension', 'Argument', 'Other',
]

const COPING_OPTIONS = [
  '10 pushups', 'Walk to water', 'Text a friend',
]

const INITIAL_SECONDS = 60

export function UrgeTimer() {
  const navigate       = useNavigate()
  const prefersReduced = useReducedMotion()
  const identity       = useAppStore(s => s.identity)

  const [state, setState]           = useState<TimerState>('running')
  const [outcome, setOutcome]       = useState<Outcome | null>(null)
  const [intensity, setIntensity]   = useState<number | null>(null)
  const [showSlider, setShowSlider] = useState(false)
  const [showBody, setShowBody]     = useState(false)
  const [showLevel3, setShowLevel3] = useState(false)
  const [showStopSheet, setShowStopSheet] = useState(false)
  const [triggers, setTriggers]     = useState<string[]>([])
  const [startTimestamp]            = useState(Date.now)
  const [extended, setExtended]     = useState(false)

  const { seconds, elapsed, total, extensions, extend, stop, start } = useTimer({
    initialSeconds: INITIAL_SECONDS,
    onComplete: () => setState('complete'),
  })

  // Auto-start countdown on mount
  useEffect(() => {
    start()
  }, [start])

  // Progressive reveal
  useEffect(() => {
    if (elapsed >= 15 && !showSlider) setShowSlider(true)
  }, [elapsed, showSlider])

  useEffect(() => {
    if (elapsed >= 30 && !showBody) setShowBody(true)
  }, [elapsed, showBody])

  // Show "extended" hint, then hide after 5s
  useEffect(() => {
    if (extended) {
      const t = setTimeout(() => setExtended(false), 5000)
      return () => clearTimeout(t)
    }
  }, [extended])

  const handleExtend = () => {
    if (extensions < 3) {
      extend()
      setExtended(true)
    }
  }

  const handleStop = () => {
    stop()
    setShowStopSheet(true)
  }

  const handleOutcome = useCallback(async (o: Outcome) => {
    setOutcome(o)
    setState('complete')

    // Persist to DB
    await addUrgeEvent({
      timestamp:         startTimestamp,
      durationSeconds:   elapsed,
      intensityRating:   intensity ?? 5,
      triggerCategories: triggers,
      outcome:           o,
      level:             showLevel3 ? 3 : showSlider ? 2 : 1,
      extensionCount:    extensions,
    })
  }, [elapsed, intensity, triggers, showLevel3, showSlider, extensions, startTimestamp])

  if (state === 'complete' || outcome) {
    return (
      <OutcomeScreen
        outcome={outcome ?? 'paused'}
        durationSeconds={elapsed}
        onHome={() => navigate('/home')}
        onRestart={() => navigate('/urge')}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col items-center justify-between py-safe z-50">
      {/* Header hint */}
      <div className="w-full pt-12 text-center px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-body italic text-text-dim"
        >
          Stay with it.
        </motion.p>
        {extended && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-body-sm text-text-dim italic mt-1"
          >
            Extended — you're building the skill.
          </motion.p>
        )}
      </div>

      {/* Central breath ring */}
      <div className="flex flex-col items-center gap-6">
        <BreathRing
          timerSeconds={seconds}
          totalSeconds={total}
          size={240}
          active
          reducedMotion={prefersReduced ?? false}
        />

        {/* Progressive elements */}
        <AnimatePresence>
          {showSlider && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xs space-y-2 px-4"
            >
              <p className="text-body text-text-secondary text-center">
                How strong is it?
              </p>
              <div className="relative">
                <input
                  type="range"
                  min={1} max={10}
                  value={intensity ?? 5}
                  onChange={e => setIntensity(Number(e.target.value))}
                  className="w-full h-6 accent-accent cursor-pointer"
                  aria-label="Urge intensity 1 to 10"
                />
                <div className="flex justify-between text-caption text-text-dim px-1">
                  <span>1 mild</span>
                  <span className="text-text-secondary font-mono">{intensity ?? 5}</span>
                  <span>10 intense</span>
                </div>
              </div>
            </motion.div>
          )}

          {showBody && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-body text-text-secondary italic text-center"
            >
              Where do you feel this in your body?
            </motion.p>
          )}
        </AnimatePresence>

        {/* Level 3 toggle */}
        {showSlider && !showLevel3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLevel3(true)}
            className="text-text-dim"
          >
            Full support
          </Button>
        )}

        {/* Level 3: trigger chips + identity anchor + coping */}
        <AnimatePresence>
          {showLevel3 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full max-w-xs px-4 space-y-4"
            >
              <div>
                <p className="text-body-sm text-text-dim mb-2">What triggered this?</p>
                <div className="flex flex-wrap gap-2">
                  {TRIGGER_CHIPS.map(t => (
                    <Chip
                      key={t}
                      selected={triggers.includes(t)}
                      onClick={() => setTriggers(prev =>
                        prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                      )}
                    >
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>

              {identity && (
                <div className="bg-bg-elevated border border-accent/20 rounded-xl p-4">
                  <p className="text-body-sm text-text-dim mb-1">Your identity anchor:</p>
                  <p className="text-body text-accent-light">
                    ✦ {identity.label} — remember why.
                  </p>
                </div>
              )}

              <div>
                <p className="text-body-sm text-text-dim mb-2">Coping options:</p>
                <div className="flex flex-wrap gap-2">
                  {COPING_OPTIONS.map(c => (
                    <Chip key={c} onClick={() => {}}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer ghost buttons */}
      <div className="w-full flex items-center justify-between px-8 pb-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="text-text-dim"
        >
          I need to stop
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExtend}
          disabled={extensions >= 3}
          className="text-accent-light"
        >
          + 30 seconds
        </Button>
      </div>

      {/* "I need to stop" bottom sheet */}
      <BottomSheet open={showStopSheet} onClose={() => setShowStopSheet(false)}>
        <div className="px-6 pb-8 space-y-4">
          <p className="text-body text-text-primary">
            You've paused <span className="font-mono text-accent-light">{elapsed}s</span> so far.
          </p>
          <p className="text-body-sm text-text-dim">That still counts.</p>
          <div className="space-y-2">
            <Button fullWidth variant="secondary" onClick={() => {
              setShowStopSheet(false)
              handleOutcome('paused')
            }}>
              Log what happened
            </Button>
            <Button fullWidth variant="secondary" onClick={() => {
              setShowStopSheet(false)
              navigate('/urge')
            }}>
              Restart timer
            </Button>
            <Button fullWidth variant="ghost" onClick={() => {
              setShowStopSheet(false)
              navigate('/home')
            }}>
              Exit completely
            </Button>
          </div>
        </div>
      </BottomSheet>

    </div>
  )
}
