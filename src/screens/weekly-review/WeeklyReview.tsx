import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { useAppStore } from '../../store/useAppStore'
import { getUrgeEventsLast7Days, getSlipLogsLast7Days, getChallengeLogsThisWeek, getWeekStart, addWeeklyReview } from '../../db/queries'
import { calculatePauseScore } from '../../lib/pauseScore'
import { getWeeklyReflectionQuestion } from '../../lib/insights'
import type { UrgeEvent, SlipLog, ChallengeLog } from '../../db/db'

type ReviewStep = 'opening' | 'score' | 'heatmap' | 'challenges' | 'reflection' | 'intention' | 'complete'

const TRIGGER_CATEGORIES = [
  'Boredom', 'Stress', 'Loneliness', 'Anxiety',
  'Anger', 'Social', 'Habit', 'Reward',
]

const TRIGGER_ACTIONS = [
  'Take a 5-minute walk',
  'Do 10 deep breaths',
  'Text someone I trust',
  'Write in my journal',
  'Do 5 minutes of stretching',
  'Make a cup of tea',
  'Step outside for fresh air',
  'Listen to a grounding playlist',
]

function slideIn(direction: 'left' | 'right' = 'right') {
  return {
    initial: { opacity: 0, x: direction === 'right' ? 40 : -40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction === 'right' ? -40 : 40 },
    transition: { duration: 0.35, ease: 'easeInOut' as const },
  }
}

function ReviewNav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  showBack = true,
  disabled = false,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  showBack?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-6 mt-2 border-t border-border-subtle">
      {showBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-body-sm text-text-dim hover:text-text-secondary transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
      ) : (
        <div />
      )}
      <Button onClick={onNext} disabled={disabled}>
        {nextLabel} <ChevronRight size={16} className="inline ml-1" />
      </Button>
    </div>
  )
}

// ─── Opening Step ────────────────────────────────────────────────────────────

function OpeningStep({
  urgeEvents,
  slipLogs,
  onNext,
}: {
  urgeEvents: UrgeEvent[]
  slipLogs: SlipLog[]
  onNext: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  const totalPauses = urgeEvents.filter((e) => e.outcome === 'paused').length
  const totalUrges = urgeEvents.length
  const slipCount = slipLogs.length

  function getStory() {
    if (totalUrges === 0) {
      return "A quiet week. The absence of struggle is sometimes its own kind of strength — or a sign the urges found a quieter voice. Either way, you showed up for this review."
    }
    if (totalPauses >= totalUrges * 0.8) {
      return `You faced ${totalUrges} urge${totalUrges !== 1 ? 's' : ''} this week — and paused through ${totalPauses} of them. That's not willpower. That's practice becoming habit.`
    }
    if (slipCount > 0 && totalPauses > 0) {
      return `This week held both setbacks and pauses. You slipped ${slipCount} time${slipCount !== 1 ? 's' : ''}, and paused ${totalPauses} time${totalPauses !== 1 ? 's' : ''}. The recovery is the work.`
    }
    if (slipCount === 0 && totalUrges > 0) {
      return `${totalUrges} urge${totalUrges !== 1 ? 's' : ''} this week, zero slips. Something is shifting in you. Let's look at the data together.`
    }
    return `Another week of practice behind you. ${totalUrges} urge${totalUrges !== 1 ? 's' : ''} logged. Let's see what the patterns reveal.`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center text-center py-12 px-4 min-h-[60vh] justify-center space-y-8"
    >
      <div className="w-16 h-[2px] bg-accent rounded-full" />
      <div className="space-y-3">
        <p className="text-caption text-text-dim uppercase tracking-widest font-mono">
          Week in Review
        </p>
        <h1 className="text-display text-text-heading leading-tight max-w-sm">
          Let's see how this week unfolded.
        </h1>
      </div>
      <p className="text-body text-text-secondary max-w-md leading-relaxed">{getStory()}</p>
      <Button onClick={onNext} size="lg">
        Begin Review
      </Button>
    </motion.div>
  )
}

// ─── Score Step ──────────────────────────────────────────────────────────────

function ScoreStep({
  urgeEvents,
  daysSinceLastSlip,
  onBack,
  onNext,
}: {
  urgeEvents: UrgeEvent[]
  daysSinceLastSlip: number
  onBack: () => void
  onNext: () => void
}) {
  const score = calculatePauseScore(urgeEvents, daysSinceLastSlip)

  const totalPauses = urgeEvents.filter((e) => e.outcome === 'paused').length
  const totalUrges = urgeEvents.length
  const avgDuration =
    totalPauses > 0
      ? Math.round(
          urgeEvents
            .filter((e) => e.outcome === 'paused')
            .reduce((sum, e) => sum + e.durationSeconds, 0) / totalPauses
        )
      : 0

  function getScoreLabel() {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Strong'
    if (score >= 40) return 'Building'
    if (score >= 20) return 'Early Days'
    return 'Starting Out'
  }

  function getScoreColor() {
    if (score >= 80) return '#6BCB8B'
    if (score >= 60) return '#7C8CF8'
    if (score >= 40) return '#F0B860'
    return '#C8BFB4'
  }

  // Simple sparkline using last 7 days of data
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayStr = date.toISOString().split('T')[0]
    const dayEvents = urgeEvents.filter(
      (e) => new Date(e.timestamp).toISOString().split('T')[0] === dayStr
    )
    const dayPauses = dayEvents.filter((e) => e.outcome === 'paused').length
    return { label: date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2), pauses: dayPauses }
  })

  const maxPauses = Math.max(...days.map((d) => d.pauses), 1)

  return (
    <motion.div {...slideIn()} className="space-y-6">
      <div>
        <p className="text-caption text-text-dim uppercase tracking-widest font-mono mb-1">Pause Score</p>
        <h2 className="text-h1 text-text-heading">This week's score</h2>
      </div>

      <Card variant="insight" className="flex flex-col items-center py-8 space-y-2">
        <div className="relative">
          <ProgressRing
            value={score}
            size={120}
            strokeWidth={8}
            color={getScoreColor()}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold text-text-heading">{Math.round(score)}</span>
            <span className="text-caption text-text-dim">/ 100</span>
          </div>
        </div>
        <p className="text-body font-semibold text-text-secondary">{getScoreLabel()}</p>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pauses', value: totalPauses },
          { label: 'Urges', value: totalUrges },
          { label: 'Avg wait', value: avgDuration > 0 ? `${avgDuration}s` : '—' },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center py-4">
            <p className="font-mono text-xl text-text-heading">{value}</p>
            <p className="text-caption text-text-dim mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Sparkline */}
      {totalUrges > 0 && (
        <Card className="space-y-3">
          <p className="text-body-sm text-text-secondary font-medium">Pauses by day</p>
          <div className="flex items-end gap-1.5 h-12">
            {days.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-accent transition-all"
                  style={{
                    height: `${Math.max((d.pauses / maxPauses) * 40, d.pauses > 0 ? 4 : 2)}px`,
                    opacity: d.pauses > 0 ? 1 : 0.2,
                  }}
                />
                <span className="text-[10px] text-text-dim font-mono">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ReviewNav onBack={onBack} onNext={onNext} />
    </motion.div>
  )
}

// ─── Heatmap Step ────────────────────────────────────────────────────────────

function HeatmapStep({
  urgeEvents,
  slipLogs,
  onBack,
  onNext,
}: {
  urgeEvents: UrgeEvent[]
  slipLogs: SlipLog[]
  onBack: () => void
  onNext: () => void
}) {
  // Build trigger frequency map
  const triggerCounts: Record<string, number> = {}
  for (const event of urgeEvents) {
    for (const cat of event.triggerCategories) {
      triggerCounts[cat] = (triggerCounts[cat] || 0) + 1
    }
  }
  for (const slip of slipLogs) {
    for (const cat of slip.triggerCategories) {
      triggerCounts[cat] = (triggerCounts[cat] || 0) + 0.5 // count slips at half weight
    }
  }

  const maxCount = Math.max(...Object.values(triggerCounts), 1)

  function getHeatColor(count: number) {
    if (count === 0) return 'bg-bg-elevated border border-border-subtle'
    const intensity = count / maxCount
    if (intensity >= 0.8) return 'bg-slip/80 border border-slip/40'
    if (intensity >= 0.5) return 'bg-warning/60 border border-warning/40'
    if (intensity >= 0.2) return 'bg-accent/50 border border-accent/30'
    return 'bg-accent/20 border border-accent/20'
  }

  const topTrigger = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a)[0]

  return (
    <motion.div {...slideIn()} className="space-y-6">
      <div>
        <p className="text-caption text-text-dim uppercase tracking-widest font-mono mb-1">Trigger Map</p>
        <h2 className="text-h1 text-text-heading">What set things off?</h2>
      </div>

      {Object.keys(triggerCounts).length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-text-dim text-body-sm">No triggers logged this week.</p>
          <p className="text-text-dim text-caption mt-1">Triggers appear when you use the urge timer or log slips.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {TRIGGER_CATEGORIES.map((cat) => {
              const count = triggerCounts[cat] || 0
              return (
                <div
                  key={cat}
                  className={`rounded-lg p-2 flex flex-col items-center gap-1 ${getHeatColor(count)}`}
                >
                  <span className="font-mono text-sm font-semibold text-text-heading">
                    {Math.floor(count) || '·'}
                  </span>
                  <span className="text-[10px] text-text-dim text-center leading-tight">{cat}</span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-caption text-text-dim">Low</span>
            <div className="flex gap-1">
              {['bg-accent/20', 'bg-accent/50', 'bg-warning/60', 'bg-slip/80'].map((c) => (
                <div key={c} className={`w-5 h-3 rounded-sm ${c}`} />
              ))}
            </div>
            <span className="text-caption text-text-dim">High</span>
          </div>

          {topTrigger && (
            <Card variant="warm" className="space-y-1">
              <p className="text-body-sm text-text-secondary font-medium">Top trigger this week</p>
              <p className="text-h3 text-text-heading">{topTrigger[0]}</p>
              <p className="text-caption text-text-dim">
                Appeared {Math.floor(topTrigger[1])} time{topTrigger[1] !== 1 ? 's' : ''} in urge sessions
              </p>
            </Card>
          )}
        </>
      )}

      <ReviewNav onBack={onBack} onNext={onNext} />
    </motion.div>
  )
}

// ─── Challenges Step ─────────────────────────────────────────────────────────

function ChallengesStep({
  challengeLogs,
  onBack,
  onNext,
}: {
  challengeLogs: ChallengeLog[]
  onBack: () => void
  onNext: () => void
}) {
  const completed = challengeLogs.filter((c) => c.completed).length
  const total = Math.max(challengeLogs.length, 7) // aim for 7/week
  const pct = Math.round((completed / total) * 100)

  const byType: Record<string, { done: number; total: number }> = {}
  for (const log of challengeLogs) {
    if (!byType[log.challengeType]) byType[log.challengeType] = { done: 0, total: 0 }
    byType[log.challengeType].total++
    if (log.completed) byType[log.challengeType].done++
  }

  const typeLabels: Record<string, string> = {
    physical: 'Physical',
    focus: 'Focus',
    awareness: 'Awareness',
    digital: 'Digital',
  }

  return (
    <motion.div {...slideIn()} className="space-y-6">
      <div>
        <p className="text-caption text-text-dim uppercase tracking-widest font-mono mb-1">Challenges</p>
        <h2 className="text-h1 text-text-heading">Training this week</h2>
      </div>

      <Card variant="challenge" className="flex items-center gap-6 py-6">
        <ProgressRing value={pct} size={80} strokeWidth={7} color="#6BCB8B" />
        <div className="space-y-1">
          <p className="text-h2 text-text-heading font-mono">{completed} / {total}</p>
          <p className="text-body-sm text-text-secondary">challenges completed</p>
          {pct >= 70 && (
            <p className="text-caption text-success">Great consistency this week</p>
          )}
        </div>
      </Card>

      {Object.keys(byType).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(byType).map(([type, { done, total: t }]) => (
            <Card key={type} className="space-y-2">
              <p className="text-body-sm text-text-secondary">{typeLabels[type] || type}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${t > 0 ? (done / t) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-caption font-mono text-text-dim">{done}/{t}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {completed === 0 && (
        <Card variant="warm" className="text-center py-6">
          <p className="text-body text-text-secondary">No challenges logged this week.</p>
          <p className="text-caption text-text-dim mt-1">Head to Train to build discomfort tolerance.</p>
        </Card>
      )}

      <ReviewNav onBack={onBack} onNext={onNext} />
    </motion.div>
  )
}

// ─── Reflection Step ─────────────────────────────────────────────────────────

function ReflectionStep({
  onBack,
  onNext,
  onAlignmentChange,
}: {
  onBack: () => void
  onNext: () => void
  onAlignmentChange: (val: number) => void
}) {
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const question = getWeeklyReflectionQuestion(weekIndex)
  const [alignment, setAlignment] = useState(5)

  function handleAlignment(val: number) {
    setAlignment(val)
    onAlignmentChange(val)
  }

  return (
    <motion.div {...slideIn()} className="space-y-6">
      <div>
        <p className="text-caption text-text-dim uppercase tracking-widest font-mono mb-1">Reflection</p>
        <h2 className="text-h1 text-text-heading">A moment to look inward</h2>
      </div>

      <Card variant="insight" className="space-y-3 py-6">
        <p className="text-caption text-text-dim uppercase tracking-widest">This week's question</p>
        <p className="text-body-lg text-text-primary leading-relaxed italic">"{question}"</p>
      </Card>

      <Card className="space-y-4">
        <p className="text-body-sm text-text-secondary font-medium">
          How aligned did your behaviour feel with your values?
        </p>
        <div className="space-y-2">
          <input
            type="range"
            min={1}
            max={10}
            value={alignment}
            onChange={(e) => handleAlignment(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-caption text-text-dim font-mono">
            <span>1 — Off track</span>
            <span className="text-accent font-semibold">{alignment}</span>
            <span>10 — Fully aligned</span>
          </div>
        </div>
      </Card>

      <ReviewNav onBack={onBack} onNext={onNext} />
    </motion.div>
  )
}

// ─── Intention Step ───────────────────────────────────────────────────────────

function IntentionStep({
  onBack,
  onNext,
  onIntentionChange,
}: {
  onBack: () => void
  onNext: () => void
  onIntentionChange: (trigger: string, action: string) => void
}) {
  const [trigger, setTrigger] = useState('')
  const [action, setAction] = useState('')
  const [customAction, setCustomAction] = useState('')

  const finalAction = action === '__custom__' ? customAction : action

  useEffect(() => {
    onIntentionChange(trigger, finalAction)
  }, [trigger, finalAction]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div {...slideIn()} className="space-y-6">
      <div>
        <p className="text-caption text-text-dim uppercase tracking-widest font-mono mb-1">Intention</p>
        <h2 className="text-h1 text-text-heading">Next week's plan</h2>
      </div>

      <p className="text-body text-text-secondary">
        Set one implementation intention. Research shows specific "if–then" plans dramatically increase follow-through.
      </p>

      <Card className="space-y-4">
        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary font-medium">
            If I feel…
          </label>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-body text-text-primary focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Choose a trigger…</option>
            {TRIGGER_CATEGORIES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary font-medium">
            Then I will…
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-body text-text-primary focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Choose an action…</option>
            {TRIGGER_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            <option value="__custom__">Write my own…</option>
          </select>
          {action === '__custom__' && (
            <textarea
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder="Describe what you'll do…"
              className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-body text-text-primary focus:outline-none focus:border-accent resize-none h-20 transition-colors"
            />
          )}
        </div>
      </Card>

      {trigger && finalAction && (
        <Card variant="warm" className="space-y-1">
          <p className="text-caption text-text-dim">Your intention</p>
          <p className="text-body text-text-primary leading-relaxed">
            "If I feel <span className="text-accent font-medium">{trigger.toLowerCase()}</span>, then I will{' '}
            <span className="text-accent font-medium">{finalAction.toLowerCase()}</span>."
          </p>
        </Card>
      )}

      <ReviewNav
        onBack={onBack}
        onNext={onNext}
        nextLabel="Complete Review"
        disabled={!trigger || !finalAction}
      />
    </motion.div>
  )
}

// ─── Complete Step ────────────────────────────────────────────────────────────

function CompleteStep({ score, intention: intentionText }: { score: number; intention: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center py-12 space-y-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center"
      >
        <Check size={36} className="text-success" />
      </motion.div>

      <div className="space-y-3">
        <h1 className="text-display text-text-heading">Review complete</h1>
        <p className="text-body text-text-secondary max-w-sm leading-relaxed">
          Pause Score this week: <span className="font-mono text-accent">{Math.round(score)}</span>.
          {intentionText && (
            <> Your intention is set. Come back to it when the week gets hard.</>
          )}
        </p>
      </div>

      {intentionText && (
        <Card variant="warm" className="max-w-sm w-full text-left">
          <p className="text-caption text-text-dim mb-1">Your intention</p>
          <p className="text-body text-text-primary leading-relaxed">"{intentionText}"</p>
        </Card>
      )}

      <Button
        onClick={() => window.history.back()}
        variant="secondary"
        size="lg"
      >
        Back to Home
      </Button>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeeklyReview() {
  const { lastSlipTimestamp, recordReview } = useAppStore()
  const [step, setStep] = useState<ReviewStep>('opening')
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  const [urgeEvents, setUrgeEvents] = useState<UrgeEvent[]>([])
  const [slipLogs, setSlipLogs] = useState<SlipLog[]>([])
  const [challengeLogs, setChallengeLogs] = useState<ChallengeLog[]>([])

  const [alignmentScore, setAlignmentScore] = useState(5)
  const [intentionTrigger, setIntentionTrigger] = useState('')
  const [intentionAction, setIntentionAction] = useState('')

  const daysSinceLastSlip = lastSlipTimestamp
    ? Math.floor((Date.now() - new Date(lastSlipTimestamp).getTime()) / 86_400_000)
    : 0

  const score = calculatePauseScore(urgeEvents, daysSinceLastSlip)

  useEffect(() => {
    async function loadData() {
      const [events, slips, challenges] = await Promise.all([
        getUrgeEventsLast7Days(),
        getSlipLogsLast7Days(),
        getChallengeLogsThisWeek(),
      ])
      setUrgeEvents(events)
      setSlipLogs(slips)
      setChallengeLogs(challenges)
    }
    loadData()
  }, [])

  const STEPS: ReviewStep[] = ['opening', 'score', 'heatmap', 'challenges', 'reflection', 'intention', 'complete']

  function goTo(nextStep: ReviewStep, dir: 'left' | 'right' = 'right') {
    setDirection(dir)
    setStep(nextStep)
  }

  function next() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) {
      goTo(STEPS[idx + 1], 'right')
    }
  }

  function back() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) {
      goTo(STEPS[idx - 1], 'left')
    }
  }

  async function complete() {
    const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    await addWeeklyReview({
      weekStart:          getWeekStart(Date.now()),
      pauseScore:         score,
      intentionTrigger,
      intentionAction,
      alignmentScore,
      reflectionText:     '',
      reflectionQuestion: getWeeklyReflectionQuestion(weekIndex),
      completedAt:        Date.now(),
    })

    recordReview()
    goTo('complete', 'right')
  }

  const showLayout = step !== 'opening' && step !== 'complete'

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step dots (visible during review steps) */}
        {showLayout && (
          <div className="flex items-center gap-1.5 mb-8">
            {(['score', 'heatmap', 'challenges', 'reflection', 'intention'] as ReviewStep[]).map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-accent' : 'w-2 bg-border-subtle'
                }`}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {step === 'opening' && (
            <OpeningStep
              key="opening"
              urgeEvents={urgeEvents}
              slipLogs={slipLogs}
              onNext={next}
            />
          )}
          {step === 'score' && (
            <ScoreStep
              key="score"
              urgeEvents={urgeEvents}
              daysSinceLastSlip={daysSinceLastSlip}
              onBack={back}
              onNext={next}
            />
          )}
          {step === 'heatmap' && (
            <HeatmapStep
              key="heatmap"
              urgeEvents={urgeEvents}
              slipLogs={slipLogs}
              onBack={back}
              onNext={next}
            />
          )}
          {step === 'challenges' && (
            <ChallengesStep
              key="challenges"
              challengeLogs={challengeLogs}
              onBack={back}
              onNext={next}
            />
          )}
          {step === 'reflection' && (
            <ReflectionStep
              key="reflection"
              onBack={back}
              onNext={next}
              onAlignmentChange={setAlignmentScore}
            />
          )}
          {step === 'intention' && (
            <IntentionStep
              key="intention"
              onBack={back}
              onNext={complete}
              onIntentionChange={(t, a) => {
                setIntentionTrigger(t)
                setIntentionAction(a)
              }}
            />
          )}
          {step === 'complete' && (
            <CompleteStep
              key="complete"
              score={score}
              intention={
                intentionTrigger && intentionAction
                  ? `If I feel ${intentionTrigger.toLowerCase()}, then I will ${intentionAction.toLowerCase()}.`
                  : ''
              }
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
