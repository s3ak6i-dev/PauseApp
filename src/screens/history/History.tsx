import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, Check, X, Clock, Zap, Target, Smile, Star, BookOpen } from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { cn } from '../../lib/utils'
import type { UrgeEvent, SlipLog, ChallengeLog, MoodLog, EvidenceLog, WeeklyReview } from '../../db/db'
import {
  getUrgeEventsLast30Days, updateUrgeEvent, deleteUrgeEvent,
  getSlipLogsLast30Days, updateSlipLog, deleteSlipLog,
  getChallengeLogsLast30Days, updateChallengeLog, deleteChallengeLog,
  getMoodLogsLast30Days, updateMoodLog, deleteMoodLog,
  getEvidenceLogsRecent, updateEvidenceLog, deleteEvidenceLog,
  getWeeklyReviews, updateWeeklyReview, deleteWeeklyReview,
} from '../../db/queries'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'urge' | 'slip' | 'challenge' | 'mood' | 'evidence' | 'review'

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'urge',      label: 'Urge',       Icon: Clock    },
  { id: 'slip',      label: 'Slips',      Icon: Zap      },
  { id: 'challenge', label: 'Challenges', Icon: Target   },
  { id: 'mood',      label: 'Mood',       Icon: Smile    },
  { id: 'evidence',  label: 'Evidence',   Icon: Star     },
  { id: 'review',    label: 'Reviews',    Icon: BookOpen },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function fmtDuration(s: number) {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r > 0 ? `${m}m ${r}s` : `${m}m`
}
function fmtWeek(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const OUTCOME_STYLES: Record<string, string> = {
  paused:       'bg-success/15 text-success',
  continued:    'bg-warning/15 text-warning',
  'still-in-it':'bg-info/15 text-info',
  abandoned:    'bg-slip/15 text-slip',
}

const MOOD_EMOJIS = ['', '😔', '😕', '😐', '🙂', '😊']

// ─── Shared Row Wrapper ────────────────────────────────────────────────────────

function HistoryRow({
  children,
  onEdit,
  onDelete,
  isConfirming,
  onConfirm,
  onCancel,
}: {
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
  isConfirming: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-bg-elevated rounded-2xl border border-border-subtle/20">
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        <AnimatePresence mode="wait">
          {isConfirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1"
            >
              <span className="text-[11px] text-text-dim mr-0.5">Delete?</span>
              <button
                onClick={onConfirm}
                className="p-1.5 rounded-lg bg-slip/15 text-slip hover:bg-slip/25 transition-colors"
              >
                <Check size={13} />
              </button>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg bg-bg-card text-text-dim hover:text-text-primary transition-colors"
              >
                <X size={13} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-text-dim hover:text-accent-light hover:bg-accent/10 transition-colors"
                aria-label="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-text-dim hover:text-slip hover:bg-slip/10 transition-colors"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-text-dim text-body">{label}</p>
    </div>
  )
}

// ─── Input Primitives ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-caption text-text-dim mb-1.5">{children}</label>
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        'w-full bg-bg-card border border-border-subtle/30 rounded-xl px-3 py-2.5',
        'text-body text-text-primary placeholder:text-text-dim',
        'focus:outline-none focus:border-accent/50 resize-none',
        'transition-colors duration-200'
      )}
    />
  )
}

// ─── Edit Sheet: Urge Event ────────────────────────────────────────────────────

function EditUrgeSheet({
  event,
  onClose,
  onSave,
}: {
  event: UrgeEvent | null
  onClose: () => void
  onSave: (patch: Partial<Omit<UrgeEvent, 'id' | 'userId'>>) => Promise<void>
}) {
  const [outcome, setOutcome] = useState<UrgeEvent['outcome']>('paused')
  const [intensity, setIntensity] = useState(5)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (event) {
      setOutcome(event.outcome)
      setIntensity(event.intensityRating)
      setNotes(event.notes ?? '')
    }
  }, [event])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ outcome, intensityRating: intensity, notes: notes || undefined })
      onClose()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const OUTCOMES: UrgeEvent['outcome'][] = ['paused', 'continued', 'still-in-it', 'abandoned']

  return (
    <BottomSheet open={!!event} onClose={onClose}>
      <div className="px-5 pb-8 pt-2 space-y-5">
        <h3 className="text-h3 text-text-heading font-light">Edit Urge Session</h3>

        <div>
          <FieldLabel>Outcome</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {OUTCOMES.map(o => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={cn(
                  'py-2 px-3 rounded-xl text-body-sm capitalize transition-colors',
                  outcome === o
                    ? OUTCOME_STYLES[o] + ' border border-current/20'
                    : 'bg-bg-card text-text-dim hover:text-text-primary'
                )}
              >
                {o.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Intensity: {intensity}/10</FieldLabel>
          <input
            type="range"
            min={1} max={10}
            value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-text-dim mt-0.5">
            <span>1 Low</span><span>10 High</span>
          </div>
        </div>

        <div>
          <FieldLabel>Notes</FieldLabel>
          <TextArea value={notes} onChange={setNotes} placeholder="Optional notes…" rows={2} />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Edit Sheet: Slip Log ──────────────────────────────────────────────────────

function EditSlipSheet({
  slip,
  onClose,
  onSave,
}: {
  slip: SlipLog | null
  onClose: () => void
  onSave: (patch: Partial<Omit<SlipLog, 'id' | 'userId'>>) => Promise<void>
}) {
  const [emotionNotes, setEmotionNotes] = useState('')
  const [intention, setIntention] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (slip) {
      setEmotionNotes(slip.emotionNotes ?? '')
      setIntention(slip.intention ?? '')
    }
  }, [slip])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ emotionNotes: emotionNotes || undefined, intention: intention || undefined })
      onClose()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <BottomSheet open={!!slip} onClose={onClose} variant="warm">
      <div className="px-5 pb-8 pt-2 space-y-5">
        <h3 className="text-h3 text-text-heading font-light">Edit Slip Log</h3>

        <div>
          <FieldLabel>How were you feeling?</FieldLabel>
          <TextArea value={emotionNotes} onChange={setEmotionNotes} placeholder="Describe what you were feeling…" />
        </div>

        <div>
          <FieldLabel>Intention</FieldLabel>
          <TextArea value={intention} onChange={setIntention} placeholder="What will you do next time…" rows={2} />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Edit Sheet: Challenge Log ─────────────────────────────────────────────────

function EditChallengeSheet({
  log,
  onClose,
  onSave,
}: {
  log: ChallengeLog | null
  onClose: () => void
  onSave: (patch: Partial<Omit<ChallengeLog, 'id' | 'userId'>>) => Promise<void>
}) {
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (log) setCompleted(log.completed)
  }, [log])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ completed })
      onClose()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <BottomSheet open={!!log} onClose={onClose}>
      <div className="px-5 pb-8 pt-2 space-y-5">
        <h3 className="text-h3 text-text-heading font-light">Edit Challenge</h3>

        <button
          onClick={() => setCompleted(!completed)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors',
            completed
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-bg-card border-border-subtle/30 text-text-dim'
          )}
        >
          <span className="text-body">Completed</span>
          <div className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            completed ? 'bg-success border-success' : 'border-text-dim'
          )}>
            {completed && <Check size={12} strokeWidth={3} className="text-bg-base" />}
          </div>
        </button>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Edit Sheet: Mood Log ──────────────────────────────────────────────────────

function EditMoodSheet({
  log,
  onClose,
  onSave,
}: {
  log: MoodLog | null
  onClose: () => void
  onSave: (patch: { moodScore?: number }) => Promise<void>
}) {
  const [moodScore, setMoodScore] = useState(3)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (log) setMoodScore(log.moodScore)
  }, [log])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ moodScore })
      onClose()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <BottomSheet open={!!log} onClose={onClose}>
      <div className="px-5 pb-8 pt-2 space-y-5">
        <h3 className="text-h3 text-text-heading font-light">Edit Mood</h3>

        <div>
          <FieldLabel>Mood</FieldLabel>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                onClick={() => setMoodScore(score)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-colors',
                  moodScore === score ? 'bg-accent/15 border border-accent/30' : 'bg-bg-card'
                )}
              >
                <span className="text-2xl leading-none">{MOOD_EMOJIS[score]}</span>
                <span className="text-[10px] text-text-dim">{score}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Edit Sheet: Evidence Log ──────────────────────────────────────────────────

function EditEvidenceSheet({
  log,
  onClose,
  onSave,
}: {
  log: EvidenceLog | null
  onClose: () => void
  onSave: (patch: { text?: string }) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (log) setText(log.text)
  }, [log])

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await onSave({ text: text.trim() })
      onClose()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <BottomSheet open={!!log} onClose={onClose}>
      <div className="px-5 pb-8 pt-2 space-y-5">
        <h3 className="text-h3 text-text-heading font-light">Edit Evidence</h3>

        <div>
          <FieldLabel>What happened?</FieldLabel>
          <TextArea value={text} onChange={setText} placeholder="Describe the evidence…" rows={4} />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !text.trim()} className="flex-1">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Edit Sheet: Weekly Review ─────────────────────────────────────────────────

function EditReviewSheet({
  review,
  onClose,
  onSave,
}: {
  review: WeeklyReview | null
  onClose: () => void
  onSave: (patch: Partial<Omit<WeeklyReview, 'id' | 'userId'>>) => Promise<void>
}) {
  const [followThrough, setFollowThrough] = useState<'yes' | 'partly' | 'no' | undefined>(undefined)
  const [reflectionText, setReflectionText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (review) {
      setFollowThrough(review.followThrough)
      setReflectionText(review.reflectionText ?? '')
    }
  }, [review])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ followThrough, reflectionText: reflectionText || undefined })
      onClose()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const FT_OPTIONS: { value: 'yes' | 'partly' | 'no'; label: string; color: string }[] = [
    { value: 'yes',    label: 'Yes',    color: 'bg-success/15 text-success border-success/30' },
    { value: 'partly', label: 'Partly', color: 'bg-warning/15 text-warning border-warning/30' },
    { value: 'no',     label: 'No',     color: 'bg-slip/15 text-slip border-slip/30'          },
  ]

  return (
    <BottomSheet open={!!review} onClose={onClose}>
      <div className="px-5 pb-8 pt-2 space-y-5">
        <h3 className="text-h3 text-text-heading font-light">Edit Weekly Review</h3>

        <div>
          <FieldLabel>Did you follow through on your intention?</FieldLabel>
          <div className="flex gap-2">
            {FT_OPTIONS.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setFollowThrough(value)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-body-sm border transition-colors',
                  followThrough === value
                    ? color
                    : 'bg-bg-card border-border-subtle/30 text-text-dim hover:text-text-primary'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Reflection</FieldLabel>
          <TextArea value={reflectionText} onChange={setReflectionText} placeholder="How did the week go…" rows={3} />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export function History() {
  const [activeTab, setActiveTab] = useState<Tab>('urge')
  const [loading, setLoading] = useState(true)

  // Data
  const [urgeEvents,    setUrgeEvents]    = useState<UrgeEvent[]>([])
  const [slipLogs,      setSlipLogs]      = useState<SlipLog[]>([])
  const [challengeLogs, setChallengeLogs] = useState<ChallengeLog[]>([])
  const [moodLogs,      setMoodLogs]      = useState<MoodLog[]>([])
  const [evidenceLogs,  setEvidenceLogs]  = useState<EvidenceLog[]>([])
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([])

  // Edit sheets
  const [editUrge,      setEditUrge]      = useState<UrgeEvent | null>(null)
  const [editSlip,      setEditSlip]      = useState<SlipLog | null>(null)
  const [editChallenge, setEditChallenge] = useState<ChallengeLog | null>(null)
  const [editMood,      setEditMood]      = useState<MoodLog | null>(null)
  const [editEvidence,  setEditEvidence]  = useState<EvidenceLog | null>(null)
  const [editReview,    setEditReview]    = useState<WeeklyReview | null>(null)

  // Inline delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Load all data on mount
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getUrgeEventsLast30Days(),
      getSlipLogsLast30Days(),
      getChallengeLogsLast30Days(),
      getMoodLogsLast30Days(),
      getEvidenceLogsRecent(100),
      getWeeklyReviews(),
    ]).then(([urge, slip, challenge, mood, evidence, reviews]) => {
      setUrgeEvents(urge)
      setSlipLogs(slip)
      setChallengeLogs(challenge)
      setMoodLogs(mood)
      setEvidenceLogs(evidence)
      setWeeklyReviews(reviews)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // Reset delete confirm on tab change
  useEffect(() => { setConfirmDeleteId(null) }, [activeTab])

  // ── Delete handlers ──

  const handleDeleteUrge = useCallback(async (id: number) => {
    await deleteUrgeEvent(id)
    setUrgeEvents(prev => prev.filter(e => e.id !== id))
    setConfirmDeleteId(null)
  }, [])

  const handleDeleteSlip = useCallback(async (id: number) => {
    await deleteSlipLog(id)
    setSlipLogs(prev => prev.filter(e => e.id !== id))
    setConfirmDeleteId(null)
  }, [])

  const handleDeleteChallenge = useCallback(async (id: number) => {
    await deleteChallengeLog(id)
    setChallengeLogs(prev => prev.filter(e => e.id !== id))
    setConfirmDeleteId(null)
  }, [])

  const handleDeleteMood = useCallback(async (id: number) => {
    await deleteMoodLog(id)
    setMoodLogs(prev => prev.filter(e => e.id !== id))
    setConfirmDeleteId(null)
  }, [])

  const handleDeleteEvidence = useCallback(async (id: number) => {
    await deleteEvidenceLog(id)
    setEvidenceLogs(prev => prev.filter(e => e.id !== id))
    setConfirmDeleteId(null)
  }, [])

  const handleDeleteReview = useCallback(async (id: number) => {
    await deleteWeeklyReview(id)
    setWeeklyReviews(prev => prev.filter(e => e.id !== id))
    setConfirmDeleteId(null)
  }, [])

  // ── Save (update) handlers ──

  const handleSaveUrge = useCallback(async (patch: Partial<Omit<UrgeEvent, 'id' | 'userId'>>) => {
    if (!editUrge?.id) return
    const updated = await updateUrgeEvent(editUrge.id, patch)
    setUrgeEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
  }, [editUrge])

  const handleSaveSlip = useCallback(async (patch: Partial<Omit<SlipLog, 'id' | 'userId'>>) => {
    if (!editSlip?.id) return
    const updated = await updateSlipLog(editSlip.id, patch)
    setSlipLogs(prev => prev.map(e => e.id === updated.id ? updated : e))
  }, [editSlip])

  const handleSaveChallenge = useCallback(async (patch: Partial<Omit<ChallengeLog, 'id' | 'userId'>>) => {
    if (!editChallenge?.id) return
    const updated = await updateChallengeLog(editChallenge.id, patch)
    setChallengeLogs(prev => prev.map(e => e.id === updated.id ? updated : e))
  }, [editChallenge])

  const handleSaveMood = useCallback(async (patch: { moodScore?: number }) => {
    if (!editMood?.id) return
    const updated = await updateMoodLog(editMood.id, patch)
    setMoodLogs(prev => prev.map(e => e.id === updated.id ? updated : e))
  }, [editMood])

  const handleSaveEvidence = useCallback(async (patch: { text?: string }) => {
    if (!editEvidence?.id) return
    const updated = await updateEvidenceLog(editEvidence.id, patch)
    setEvidenceLogs(prev => prev.map(e => e.id === updated.id ? updated : e))
  }, [editEvidence])

  const handleSaveReview = useCallback(async (patch: Partial<Omit<WeeklyReview, 'id' | 'userId'>>) => {
    if (!editReview?.id) return
    const updated = await updateWeeklyReview(editReview.id, patch)
    setWeeklyReviews(prev => prev.map(e => e.id === updated.id ? updated : e))
  }, [editReview])

  // ─── Tab Content ────────────────────────────────────────────────────────────

  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20 text-text-dim text-body">
          Loading…
        </div>
      )
    }

    if (activeTab === 'urge') {
      if (urgeEvents.length === 0) return <EmptyState label="No urge sessions in the last 30 days" />
      return urgeEvents.map(event => (
        <HistoryRow
          key={event.id}
          onEdit={() => { setConfirmDeleteId(null); setEditUrge(event) }}
          onDelete={() => setConfirmDeleteId(event.id!)}
          isConfirming={confirmDeleteId === event.id}
          onConfirm={() => handleDeleteUrge(event.id!)}
          onCancel={() => setConfirmDeleteId(null)}
        >
          <p className="text-[11px] text-text-dim">{fmtDate(event.timestamp)} · {fmtTime(event.timestamp)}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn('text-[11px] px-2 py-0.5 rounded-full capitalize', OUTCOME_STYLES[event.outcome] ?? 'bg-bg-card text-text-dim')}>
              {event.outcome.replace('-', ' ')}
            </span>
            <span className="text-body-sm text-text-secondary">Intensity {event.intensityRating}/10</span>
            <span className="text-body-sm text-text-dim">{fmtDuration(event.durationSeconds)}</span>
            {event.extensionCount > 0 && (
              <span className="text-[11px] text-text-dim">+{event.extensionCount} ext</span>
            )}
          </div>
          {event.notes && (
            <p className="text-caption text-text-dim mt-1.5 line-clamp-1">{event.notes}</p>
          )}
        </HistoryRow>
      ))
    }

    if (activeTab === 'slip') {
      if (slipLogs.length === 0) return <EmptyState label="No slip logs in the last 30 days" />
      return slipLogs.map(slip => (
        <HistoryRow
          key={slip.id}
          onEdit={() => { setConfirmDeleteId(null); setEditSlip(slip) }}
          onDelete={() => setConfirmDeleteId(slip.id!)}
          isConfirming={confirmDeleteId === slip.id}
          onConfirm={() => handleDeleteSlip(slip.id!)}
          onCancel={() => setConfirmDeleteId(null)}
        >
          <p className="text-[11px] text-text-dim">{fmtDate(slip.timestamp)} · {fmtTime(slip.timestamp)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xl leading-none">{slip.emotionEmoji}</span>
            <span className="text-body-sm text-text-secondary">{'★'.repeat(slip.emotionScore)}{'☆'.repeat(5 - slip.emotionScore)}</span>
            {slip.isQuickLog && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg-card text-text-dim">Quick</span>
            )}
          </div>
          {slip.emotionNotes && (
            <p className="text-caption text-text-dim mt-1.5 line-clamp-1">{slip.emotionNotes}</p>
          )}
        </HistoryRow>
      ))
    }

    if (activeTab === 'challenge') {
      if (challengeLogs.length === 0) return <EmptyState label="No challenges in the last 30 days" />
      return challengeLogs.map(log => (
        <HistoryRow
          key={log.id}
          onEdit={() => { setConfirmDeleteId(null); setEditChallenge(log) }}
          onDelete={() => setConfirmDeleteId(log.id!)}
          isConfirming={confirmDeleteId === log.id}
          onConfirm={() => handleDeleteChallenge(log.id!)}
          onCancel={() => setConfirmDeleteId(null)}
        >
          <p className="text-[11px] text-text-dim">{fmtDate(log.timestamp)} · {fmtTime(log.timestamp)}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-body-sm text-text-primary capitalize">
              {log.challengeId.replace(/-/g, ' ')}
            </span>
            <span className={cn(
              'text-[11px] px-1.5 py-0.5 rounded capitalize',
              log.completed ? 'bg-success/15 text-success' : 'bg-bg-card text-text-dim'
            )}>
              {log.completed ? 'Done' : 'Incomplete'}
            </span>
            <span className="text-[11px] text-text-dim capitalize">{log.difficulty}</span>
          </div>
        </HistoryRow>
      ))
    }

    if (activeTab === 'mood') {
      if (moodLogs.length === 0) return <EmptyState label="No mood logs in the last 30 days" />
      return moodLogs.map(log => (
        <HistoryRow
          key={log.id}
          onEdit={() => { setConfirmDeleteId(null); setEditMood(log) }}
          onDelete={() => setConfirmDeleteId(log.id!)}
          isConfirming={confirmDeleteId === log.id}
          onConfirm={() => handleDeleteMood(log.id!)}
          onCancel={() => setConfirmDeleteId(null)}
        >
          <p className="text-[11px] text-text-dim">{fmtDate(log.timestamp)} · {fmtTime(log.timestamp)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xl leading-none">{MOOD_EMOJIS[log.moodScore]}</span>
            <span className="text-body-sm text-text-secondary capitalize">{log.timeOfDay}</span>
            <span className="text-body-sm text-text-dim">{log.moodScore}/5</span>
          </div>
        </HistoryRow>
      ))
    }

    if (activeTab === 'evidence') {
      if (evidenceLogs.length === 0) return <EmptyState label="No evidence logs yet" />
      return evidenceLogs.map(log => (
        <HistoryRow
          key={log.id}
          onEdit={() => { setConfirmDeleteId(null); setEditEvidence(log) }}
          onDelete={() => setConfirmDeleteId(log.id!)}
          isConfirming={confirmDeleteId === log.id}
          onConfirm={() => handleDeleteEvidence(log.id!)}
          onCancel={() => setConfirmDeleteId(null)}
        >
          <p className="text-[11px] text-text-dim">{fmtDate(log.timestamp)} · {fmtTime(log.timestamp)}</p>
          <p className="text-body-sm text-text-primary mt-1.5 line-clamp-2">{log.text}</p>
          {log.valuesTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {log.valuesTags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent-light">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </HistoryRow>
      ))
    }

    if (activeTab === 'review') {
      if (weeklyReviews.length === 0) return <EmptyState label="No weekly reviews yet" />
      return weeklyReviews.map(review => (
        <HistoryRow
          key={review.id}
          onEdit={() => { setConfirmDeleteId(null); setEditReview(review) }}
          onDelete={() => setConfirmDeleteId(review.id!)}
          isConfirming={confirmDeleteId === review.id}
          onConfirm={() => handleDeleteReview(review.id!)}
          onCancel={() => setConfirmDeleteId(null)}
        >
          <p className="text-[11px] text-text-dim">Week of {fmtWeek(review.weekStart)}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-body-sm text-text-primary font-mono">
              {review.pauseScore.toFixed(1)} score
            </span>
            {review.followThrough && (
              <span className={cn(
                'text-[11px] px-1.5 py-0.5 rounded capitalize',
                review.followThrough === 'yes'    ? 'bg-success/15 text-success' :
                review.followThrough === 'partly' ? 'bg-warning/15 text-warning' :
                                                    'bg-slip/15 text-slip'
              )}>
                {review.followThrough}
              </span>
            )}
          </div>
          {review.intentionAction && (
            <p className="text-caption text-text-dim mt-1.5 line-clamp-1">{review.intentionAction}</p>
          )}
        </HistoryRow>
      ))
    }

    return null
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-h2 text-text-heading font-light">History</h1>
        <p className="text-caption text-text-dim mt-0.5">View, edit, and delete your logs</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 px-5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm whitespace-nowrap',
              'shrink-0 transition-all duration-200',
              activeTab === id
                ? 'bg-accent text-white shadow-sm'
                : 'bg-bg-elevated text-text-dim hover:text-text-primary'
            )}
          >
            <Icon size={12} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 pt-4 pb-32 space-y-3 min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Edit Sheets */}
      <EditUrgeSheet
        event={editUrge}
        onClose={() => setEditUrge(null)}
        onSave={async (patch) => { await handleSaveUrge(patch); setEditUrge(null) }}
      />
      <EditSlipSheet
        slip={editSlip}
        onClose={() => setEditSlip(null)}
        onSave={async (patch) => { await handleSaveSlip(patch); setEditSlip(null) }}
      />
      <EditChallengeSheet
        log={editChallenge}
        onClose={() => setEditChallenge(null)}
        onSave={async (patch) => { await handleSaveChallenge(patch); setEditChallenge(null) }}
      />
      <EditMoodSheet
        log={editMood}
        onClose={() => setEditMood(null)}
        onSave={async (patch) => { await handleSaveMood(patch); setEditMood(null) }}
      />
      <EditEvidenceSheet
        log={editEvidence}
        onClose={() => setEditEvidence(null)}
        onSave={async (patch) => { await handleSaveEvidence(patch); setEditEvidence(null) }}
      />
      <EditReviewSheet
        review={editReview}
        onClose={() => setEditReview(null)}
        onSave={async (patch) => { await handleSaveReview(patch); setEditReview(null) }}
      />
    </AppLayout>
  )
}
