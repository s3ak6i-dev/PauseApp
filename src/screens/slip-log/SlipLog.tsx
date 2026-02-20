import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmojiScale } from '../../components/ui/EmojiScale'
import { useAppStore } from '../../store/useAppStore'
import { addSlipLog } from '../../db/queries'
import { containsSelfCriticalLanguage } from '../../lib/insights'

type Step = 'deescalation' | 'step1' | 'step2' | 'step3' | 'complete'

const TRIGGER_OPTIONS = [
  'Boredom', 'Stress', 'Loneliness', 'Late night',
  'Scrolling spiral', 'Physical tension', 'Argument / conflict',
  'Not sure', 'Other...',
]

export function SlipLog() {
  const navigate    = useNavigate()
  const recordSlip  = useAppStore(s => s.recordSlip)
  const slipCount   = useAppStore(s => s.lastSlipTimestamp)

  const [step, setStep]             = useState<Step>('deescalation')
  const [showJustLog, setShowJustLog] = useState(false)   // shows after 10s

  // Triggers (step 1)
  const [triggers, setTriggers]     = useState<string[]>([])
  const [otherTrigger, setOtherTrigger] = useState('')

  // Emotion (step 2)
  const [moodScore, setMoodScore]   = useState<number | null>(null)
  const [moodNotes, setMoodNotes]   = useState('')
  const [showReframe, setShowReframe] = useState(false)

  // Intention (step 3)
  const [intention, setIntention]   = useState('')

  const isFirstSlip = !slipCount

  // De-escalation timers
  useEffect(() => {
    if (step !== 'deescalation') return
    const t1 = setTimeout(() => setShowJustLog(true), 10000)
    return () => { clearTimeout(t1) }
  }, [step])

  const handleMoodNotesChange = (v: string) => {
    setMoodNotes(v)
    setShowReframe(containsSelfCriticalLanguage(v))
  }

  const handleJustLog = async () => {
    await save([], null, '')
  }

  const save = async (
    triggerList: string[],
    emotion: number | null,
    intentionText: string
  ) => {
    await addSlipLog({
      timestamp:         Date.now(),
      triggerCategories: triggerList,
      emotionEmoji:      emotion ? ['😔','😟','😐','😤','😰'][emotion - 1] : '',
      emotionScore:      emotion ?? 0,
      emotionNotes:      moodNotes || undefined,
      intention:         intentionText || undefined,
      reflectionDepthScore: Math.min(
        (moodNotes.length / 3) + (intentionText.length / 3) + (triggerList.length * 10),
        100
      ),
      isQuickLog: step === 'deescalation',
    })
    recordSlip()
    setStep('complete')
  }

  const handleComplete = () => save(triggers, moodScore, intention)

  const toggleTrigger = (t: string) => {
    setTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  return (
    <div className="fixed inset-0 bg-bg-base z-50 overflow-y-auto">
      <AnimatePresence mode="wait">

        {/* ── De-escalation ── */}
        {step === 'deescalation' && (
          <motion.div
            key="deescalation"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
            className="min-h-dvh flex flex-col items-center justify-center px-6 text-center gap-8 bg-bg-warm"
          >
            <div className="pt-16 space-y-4">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-body-lg text-text-primary max-w-xs mx-auto"
              >
                This doesn't change who you're becoming.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-body text-text-secondary"
              >
                How are you feeling right now?
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {}} // stay on screen
              >
                I need a moment
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setStep('step1')}
              >
                I'm ready to log
              </Button>
            </motion.div>

            <AnimatePresence>
              {showJustLog && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-body-sm text-text-dim italic cursor-pointer hover:text-text-secondary transition-colors"
                  onClick={handleJustLog}
                >
                  You can also just log it — no questions.
                </motion.button>
              )}
            </AnimatePresence>

            {isFirstSlip && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="text-body-sm text-text-dim max-w-xs mx-auto"
              >
                You logged it. That takes courage. Most people don't.
              </motion.p>
            )}
          </motion.div>
        )}

        {/* ── Step 1: Triggers ── */}
        {step === 'step1' && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="min-h-dvh flex flex-col px-6 py-12 max-w-lg mx-auto w-full"
          >
            <div className="flex justify-end mb-6">
              <div className="flex gap-2">
                {['●','○','○'].map((_,i) => (
                  <span key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-accent' : 'bg-border-subtle'}`} />
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <h2 className="text-h3 text-text-heading">What triggered this?</h2>
              <p className="text-body-sm text-text-dim italic">Select all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_OPTIONS.map(t => (
                  <Chip
                    key={t}
                    selected={triggers.includes(t)}
                    onClick={() => toggleTrigger(t)}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
              {triggers.includes('Other...') && (
                <textarea
                  value={otherTrigger}
                  onChange={e => setOtherTrigger(e.target.value)}
                  placeholder="Describe briefly..."
                  rows={2}
                  className="w-full rounded-xl p-4 bg-bg-card border border-border-subtle text-text-primary placeholder:text-text-dim placeholder:italic focus:outline-none focus:border-accent resize-none"
                />
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="ghost" onClick={() => setStep('deescalation')}>← Back</Button>
              <Button fullWidth onClick={() => setStep('step2')}>Next →</Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Emotion ── */}
        {step === 'step2' && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="min-h-dvh flex flex-col px-6 py-12 max-w-lg mx-auto w-full"
          >
            <div className="flex justify-end mb-6">
              <div className="flex gap-2">
                {['●','●','○'].map((_,i) => (
                  <span key={i} className={`w-2 h-2 rounded-full ${i < 2 ? 'bg-accent' : 'bg-border-subtle'}`} />
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <h2 className="text-h3 text-text-heading">What were you feeling just before?</h2>
              <EmojiScale value={moodScore} onChange={setMoodScore} />
              <textarea
                value={moodNotes}
                onChange={e => handleMoodNotesChange(e.target.value)}
                placeholder="Add anything else? (optional)"
                rows={3}
                maxLength={300}
                className="w-full rounded-xl p-4 bg-bg-card border border-border-subtle text-text-primary placeholder:text-text-dim placeholder:italic focus:outline-none focus:border-accent resize-none"
              />
              <AnimatePresence>
                {showReframe && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-body-sm text-text-dim italic"
                  >
                    That sounds like a harsh judgement. What might a close friend say instead?
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="ghost" onClick={() => setStep('step1')}>← Back</Button>
              <Button fullWidth onClick={() => setStep('step3')}>Next →</Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Intention ── */}
        {step === 'step3' && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="min-h-dvh flex flex-col px-6 py-12 max-w-lg mx-auto w-full"
          >
            <div className="flex justify-end mb-6">
              <div className="flex gap-2">
                {['●','●','●'].map((_,i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-accent" />
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <h2 className="text-h3 text-text-heading">One small adjustment for next time.</h2>
              <textarea
                value={intention}
                onChange={e => setIntention(e.target.value)}
                placeholder="e.g. Step away from my phone first, tell someone, use the urge timer."
                rows={3}
                maxLength={200}
                className="w-full rounded-xl p-4 bg-bg-card border border-border-subtle text-text-primary placeholder:text-text-dim placeholder:italic focus:outline-none focus:border-accent resize-none"
              />
              <p className="text-body-sm text-text-dim italic">Not required — you can skip this.</p>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="ghost" onClick={() => setStep('step2')}>← Back</Button>
              <Button fullWidth onClick={handleComplete}>Log it</Button>
            </div>
          </motion.div>
        )}

        {/* ── Complete ── */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-h-dvh flex flex-col items-center justify-center px-6 text-center gap-8 bg-bg-warm"
          >
            <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#4A4A62" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="34"
                fill="none" stroke="#7C8CF8" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34 * 0.6} ${2 * Math.PI * 34 * 0.4}`}
                transform="rotate(-90 40 40)"
              />
            </svg>

            <div className="space-y-2">
              <p className="text-body-lg text-text-primary">Logged.</p>
              <p className="text-body-lg text-text-primary">Recovery starts now.</p>
              <p className="text-body-sm text-text-dim font-mono mt-2">Recovery: 0m ago</p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/train')}>
                See one small step
              </Button>
              <Button variant="ghost" onClick={() => navigate('/home')}>
                Go to dashboard
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
