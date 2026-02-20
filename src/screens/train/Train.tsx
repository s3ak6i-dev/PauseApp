import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, ChevronDown, ChevronUp, Zap, BookOpen, Target } from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { addChallengeLog, getChallengeLogsThisWeek } from '../../db/queries'
import type { ChallengeLog } from '../../db/db'

// ─── Challenge Data ───────────────────────────────────────────────────────────

interface Challenge {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'hard'
  type: 'physical' | 'focus' | 'awareness' | 'digital'
  durationMinutes: number
  variableReward?: string
}

const DAILY_CHALLENGES: Challenge[] = [
  {
    id: 'cold-30',
    title: '30-second cold finish',
    description: 'End your shower with 30 seconds of cold water. No skipping. No negotiating.',
    duration: '30 sec',
    difficulty: 'beginner',
    type: 'physical',
    durationMinutes: 1,
    variableReward: 'You just proved your body responds to your mind, not the other way around.',
  },
  {
    id: 'focus-25',
    title: '25-minute deep focus',
    description: 'One task. Phone face-down. No tabs. Set a timer and don\'t break until it ends.',
    duration: '25 min',
    difficulty: 'intermediate',
    type: 'focus',
    durationMinutes: 25,
    variableReward: 'Sustained attention is one of the rarest skills in the modern world. You\'re building it.',
  },
  {
    id: 'sit-still',
    title: '5-minute stillness',
    description: 'Sit still with no phone, no music, no distractions. Just notice what arises.',
    duration: '5 min',
    difficulty: 'beginner',
    type: 'awareness',
    durationMinutes: 5,
    variableReward: 'Discomfort without escape builds the very muscle you need when urges hit.',
  },
]

const CHALLENGE_LIBRARY: Challenge[] = [
  {
    id: 'walk-10',
    title: '10-minute walk (no phone)',
    description: 'Walk outside without earphones or your phone. Just you and your surroundings.',
    duration: '10 min',
    difficulty: 'beginner',
    type: 'physical',
    durationMinutes: 10,
  },
  {
    id: 'ice-water',
    title: 'Hold ice for 2 minutes',
    description: 'Hold a piece of ice and sit with the discomfort. Don\'t drop it early.',
    duration: '2 min',
    difficulty: 'beginner',
    type: 'physical',
    durationMinutes: 2,
    variableReward: 'Physical discomfort tolerance transfers directly to urge tolerance.',
  },
  {
    id: 'no-phone-meal',
    title: 'Phone-free meal',
    description: 'Eat one full meal today with no screen. Be present with your food.',
    duration: '20 min',
    difficulty: 'beginner',
    type: 'digital',
    durationMinutes: 20,
  },
  {
    id: 'breath-box',
    title: 'Box breathing (4 rounds)',
    description: '4 counts in, 4 hold, 4 out, 4 hold. Repeat 4 times. Trains your nervous system.',
    duration: '3 min',
    difficulty: 'beginner',
    type: 'awareness',
    durationMinutes: 3,
  },
  {
    id: 'hard-task-first',
    title: 'Hardest task first',
    description: 'Identify the thing you\'ve been avoiding. Do it before anything else today.',
    duration: 'varies',
    difficulty: 'intermediate',
    type: 'focus',
    durationMinutes: 30,
    variableReward: 'Avoidance shrinks the thing avoided. You just made it smaller.',
  },
  {
    id: 'no-social-2h',
    title: '2-hour social media fast',
    description: 'No social apps for 2 hours. Notice the pull. Don\'t follow it.',
    duration: '2 hr',
    difficulty: 'intermediate',
    type: 'digital',
    durationMinutes: 120,
  },
  {
    id: 'cold-shower',
    title: 'Full cold shower',
    description: 'The entire shower. Cold. No warm-up. This is the advanced version.',
    duration: '5 min',
    difficulty: 'hard',
    type: 'physical',
    durationMinutes: 5,
    variableReward: 'The anticipation is always worse than the thing. Remember this next time.',
  },
  {
    id: 'urge-surf',
    title: 'Urge surfing (10 min)',
    description: 'Sit with an active urge for 10 minutes. Observe it without acting. Label what you feel.',
    duration: '10 min',
    difficulty: 'hard',
    type: 'awareness',
    durationMinutes: 10,
    variableReward: 'You just proved the urge has a peak — and a slope down. It cannot stay forever.',
  },
]

const DIFFICULTY_COLORS = {
  beginner: 'text-success',
  intermediate: 'text-warning',
  hard: 'text-slip',
}

const TYPE_LABELS = {
  physical: 'Physical',
  focus: 'Focus',
  awareness: 'Awareness',
  digital: 'Digital',
}

const TYPE_COLORS = {
  physical: 'bg-success/15 text-success',
  focus: 'bg-accent/15 text-accent-light',
  awareness: 'bg-warning/15 text-warning',
  digital: 'bg-info/15 text-info',
}

// ─── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeItem({
  challenge,
  completed,
  onComplete,
}: {
  challenge: Challenge
  completed: boolean
  onComplete: (c: Challenge) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showReward, setShowReward] = useState(false)

  function handleComplete() {
    if (completed) return
    onComplete(challenge)
    if (challenge.variableReward) {
      setShowReward(true)
    }
  }

  return (
    <Card variant={completed ? 'default' : 'challenge'} className="space-y-3">
      <div className="flex items-start gap-3">
        <button
          onClick={handleComplete}
          disabled={completed}
          className="mt-0.5 shrink-0 transition-transform active:scale-90"
          aria-label={completed ? 'Completed' : 'Mark complete'}
        >
          {completed ? (
            <CheckCircle size={22} className="text-success" />
          ) : (
            <Circle size={22} className="text-border-subtle hover:text-accent transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-body font-semibold ${completed ? 'text-text-dim line-through' : 'text-text-heading'}`}>
              {challenge.title}
            </h3>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-text-dim hover:text-text-secondary transition-colors shrink-0"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={`text-caption px-2 py-0.5 rounded-full ${TYPE_COLORS[challenge.type]}`}>
              {TYPE_LABELS[challenge.type]}
            </span>
            <span className={`text-caption font-medium ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
              {challenge.difficulty}
            </span>
            <span className="text-caption text-text-dim">{challenge.duration}</span>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-body-sm text-text-secondary mt-2 leading-relaxed">
                  {challenge.description}
                </p>
                {!completed && (
                  <Button size="sm" onClick={handleComplete} className="mt-3">
                    Mark complete
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showReward && challenge.variableReward && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20"
              >
                <p className="text-body-sm text-success leading-relaxed italic">
                  "{challenge.variableReward}"
                </p>
                <button
                  onClick={() => setShowReward(false)}
                  className="text-caption text-text-dim mt-1 hover:text-text-secondary"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  )
}

// ─── Baseline Assessment ──────────────────────────────────────────────────────

function BaselineAssessment({ onClose }: { onClose: () => void }) {
  const [scores, setScores] = useState<Record<string, number>>({
    'urge-resistance': 5,
    'discomfort-tolerance': 5,
    'focus-duration': 5,
    'emotional-regulation': 5,
  })

  const labels: Record<string, string> = {
    'urge-resistance': 'How well do you currently resist urges? (1–10)',
    'discomfort-tolerance': 'How comfortable are you with discomfort? (1–10)',
    'focus-duration': 'How long can you focus without distraction? (1–10)',
    'emotional-regulation': 'How well do you manage difficult emotions? (1–10)',
  }

  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4)

  function getBaselineLabel() {
    if (avg >= 8) return 'Strong foundation'
    if (avg >= 6) return 'Moderate base'
    if (avg >= 4) return 'Building'
    return 'Early stage'
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-caption text-text-dim uppercase tracking-widest mb-1">Baseline</p>
        <h2 className="text-h2 text-text-heading">Where are you starting from?</h2>
        <p className="text-body-sm text-text-secondary mt-1">
          Honest self-assessment. This establishes your starting point.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(labels).map(([key, label]) => (
          <Card key={key} className="space-y-2">
            <label className="text-body-sm text-text-secondary">{label}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={scores[key]}
              onChange={(e) =>
                setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))
              }
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-caption text-text-dim font-mono">
              <span>1</span>
              <span className="text-accent font-semibold">{scores[key]}</span>
              <span>10</span>
            </div>
          </Card>
        ))}
      </div>

      <Card variant="insight" className="flex items-center gap-4">
        <ProgressRing value={avg * 10} size={64} strokeWidth={6} color="#7C8CF8" />
        <div>
          <p className="text-h3 text-text-heading">{getBaselineLabel()}</p>
          <p className="text-caption text-text-dim">Average score: {avg}/10</p>
        </div>
      </Card>

      <Button onClick={onClose} className="w-full">
        Save Baseline
      </Button>
    </div>
  )
}

// ─── Library View ─────────────────────────────────────────────────────────────

function ChallengeLibrary({
  completedIds,
  onComplete,
}: {
  completedIds: Set<string>
  onComplete: (c: Challenge) => void
}) {
  const [activeType, setActiveType] = useState<string>('all')

  const types = ['all', 'physical', 'focus', 'awareness', 'digital']
  const filtered = activeType === 'all'
    ? CHALLENGE_LIBRARY
    : CHALLENGE_LIBRARY.filter((c) => c.type === activeType)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-body-sm transition-colors ${
              activeType === t
                ? 'bg-accent text-white'
                : 'bg-bg-elevated text-text-dim hover:text-text-secondary'
            }`}
          >
            {t === 'all' ? 'All' : TYPE_LABELS[t as keyof typeof TYPE_LABELS]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((challenge) => (
          <ChallengeItem
            key={challenge.id}
            challenge={challenge}
            completed={completedIds.has(challenge.id)}
            onComplete={onComplete}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Train() {
  const [tab, setTab] = useState<'today' | 'library' | 'baseline'>('today')
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [weeklyLogs, setWeeklyLogs] = useState<ChallengeLog[]>([])

  useEffect(() => {
    loadWeeklyLogs()
  }, [])

  async function loadWeeklyLogs() {
    const logs = await getChallengeLogsThisWeek()
    setWeeklyLogs(logs)
    const ids = new Set(logs.filter((l) => l.completed).map((l) => l.challengeId))
    setCompletedIds(ids)
  }

  async function handleComplete(challenge: Challenge) {
    await addChallengeLog({
      challengeId: challenge.id,
      timestamp: Date.now(),
      completed: true,
      difficulty: challenge.difficulty,
      challengeType: challenge.type,
      durationMinutes: challenge.durationMinutes,
    })
    setCompletedIds((prev) => new Set([...prev, challenge.id]))
    await loadWeeklyLogs()
  }

  const weekCompleted = weeklyLogs.filter((l) => l.completed).length
  const weekTotal = Math.max(weeklyLogs.length, 7)
  const weekPct = Math.round((weekCompleted / weekTotal) * 100)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-text-heading">Train</h1>
          <p className="text-body-sm text-text-secondary mt-0.5">
            Build discomfort tolerance, one challenge at a time
          </p>
        </div>

        {/* Weekly progress */}
        <Card className="flex items-center gap-4">
          <ProgressRing value={weekPct} size={56} strokeWidth={6} color="#6BCB8B" />
          <div>
            <p className="text-body font-semibold text-text-heading">
              {weekCompleted} done this week
            </p>
            <p className="text-caption text-text-dim">
              {weekTotal - weekCompleted > 0
                ? `${weekTotal - weekCompleted} remaining`
                : 'All done — great week'}
            </p>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle">
          {[
            { id: 'today', label: "Today's", icon: <Zap size={14} /> },
            { id: 'library', label: 'Library', icon: <BookOpen size={14} /> },
            { id: 'baseline', label: 'Baseline', icon: <Target size={14} /> },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-body-sm border-b-2 transition-colors ${
                tab === id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-dim hover:text-text-secondary'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <p className="text-caption text-text-dim">
                Complete these to build your tolerance baseline
              </p>
              {DAILY_CHALLENGES.map((challenge) => (
                <ChallengeItem
                  key={challenge.id}
                  challenge={challenge}
                  completed={completedIds.has(challenge.id)}
                  onComplete={handleComplete}
                />
              ))}
            </motion.div>
          )}

          {tab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ChallengeLibrary
                completedIds={completedIds}
                onComplete={handleComplete}
              />
            </motion.div>
          )}

          {tab === 'baseline' && (
            <motion.div
              key="baseline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <BaselineAssessment onClose={() => setTab('today')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
