import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Chip } from '../../components/ui/Chip'
import { useAppStore } from '../../store/useAppStore'
import { addEvidenceLog, getEvidenceLogsRecent, addMoodLog, getTodayMoodLogs } from '../../db/queries'
import type { EvidenceLog } from '../../db/db'

const ALL_VALUES = [
  'Calm', 'Focused', 'Present', 'Strong', 'Clear-headed',
  'Patient', 'Disciplined', 'Grounded', 'Honest', 'Connected',
  'Creative', 'Resilient', 'Purposeful', 'Mindful', 'Brave',
]

// ─── Evidence Log Entry ───────────────────────────────────────────────────────

function EvidenceEntry({ entry }: { entry: EvidenceLog }) {
  const date = new Date(entry.timestamp)
  const dateStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
        <div className="w-px flex-1 bg-border-subtle mt-1" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-body text-text-primary leading-relaxed">{entry.text}</p>
        {entry.valuesTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {entry.valuesTags.map((tag) => (
              <span
                key={tag}
                className="text-caption px-2 py-0.5 rounded-full bg-accent/15 text-accent-light"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-caption text-text-dim mt-1.5">{dateStr} · {timeStr}</p>
      </div>
    </motion.div>
  )
}

// ─── Add Evidence Sheet ───────────────────────────────────────────────────────

function AddEvidenceSheet({
  open,
  onClose,
  onSave,
  values,
  identityLabel,
}: {
  open: boolean
  onClose: () => void
  onSave: (text: string, tags: string[]) => void
  values: string[]
  identityLabel: string
}) {
  const [text, setText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function handleSave() {
    if (!text.trim()) return
    onSave(text.trim(), selectedTags)
    setText('')
    setSelectedTags([])
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} variant="slow">
      <div className="space-y-5 pb-4">
        <div>
          <p className="text-caption text-text-dim uppercase tracking-widest mb-1">Evidence</p>
          <h3 className="text-h2 text-text-heading">Log evidence you acted as</h3>
          <p className="text-body-sm text-accent mt-0.5">✦ {identityLabel || 'yourself'}</p>
        </div>

        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary font-medium">What happened?</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe a moment where you acted in line with who you're becoming…"
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-body text-text-primary focus:outline-none focus:border-accent resize-none h-28 transition-colors placeholder:text-text-dim"
            maxLength={400}
            autoFocus
          />
          <p className="text-caption text-text-dim text-right">{text.length}/400</p>
        </div>

        {values.length > 0 && (
          <div className="space-y-2">
            <label className="text-body-sm text-text-secondary font-medium">Which values does this reflect?</label>
            <div className="flex flex-wrap gap-2">
              {values.map((v) => (
                <Chip
                  key={v}
                  selected={selectedTags.includes(v)}
                  onClick={() => toggleTag(v)}
                >
                  {v}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={!text.trim()} className="w-full">
          Save Evidence
        </Button>
      </div>
    </BottomSheet>
  )
}

// ─── Edit Identity Sheet ──────────────────────────────────────────────────────

function EditIdentitySheet({
  open,
  onClose,
  currentLabel,
  currentValues,
  onSave,
}: {
  open: boolean
  onClose: () => void
  currentLabel: string
  currentValues: string[]
  onSave: (label: string, values: string[]) => void
}) {
  const [label, setLabel] = useState(currentLabel)
  const [selectedValues, setSelectedValues] = useState<string[]>(currentValues)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    setLabel(currentLabel)
    setSelectedValues(currentValues)
  }, [currentLabel, currentValues, open])

  function toggleValue(val: string) {
    if (selectedValues.includes(val)) {
      setSelectedValues((prev) => prev.filter((v) => v !== val))
    } else if (selectedValues.length >= 3) {
      setShaking(true)
      setTimeout(() => setShaking(false), 600)
    } else {
      setSelectedValues((prev) => [...prev, val])
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} variant="slow">
      <div className="space-y-5 pb-4">
        <div>
          <p className="text-caption text-text-dim uppercase tracking-widest mb-1">Edit Identity</p>
          <h3 className="text-h2 text-text-heading">Who are you becoming?</h3>
          {currentLabel !== label && (
            <p className="text-caption text-warning mt-1">
              Changing your label adds it to your history.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary font-medium">Identity label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Someone who…"
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 text-body text-text-primary focus:outline-none focus:border-accent transition-colors"
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary font-medium">
            Values <span className="text-text-dim">(max 3)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_VALUES.map((v) => (
              <Chip
                key={v}
                selected={selectedValues.includes(v)}
                onClick={() => toggleValue(v)}
                shaking={shaking && !selectedValues.includes(v) && selectedValues.length >= 3}
              >
                {v}
              </Chip>
            ))}
          </div>
        </div>

        <Button
          onClick={() => {
            onSave(label.trim(), selectedValues)
            onClose()
          }}
          disabled={!label.trim() || selectedValues.length === 0}
          className="w-full"
        >
          Save Changes
        </Button>
      </div>
    </BottomSheet>
  )
}

// ─── Daily Check-In ───────────────────────────────────────────────────────────

function DailyCheckIn({ onComplete }: { onComplete: () => void }) {
  const [alignment, setAlignment] = useState(5)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    await addMoodLog({
      timestamp: Date.now(),
      timeOfDay: new Date().getHours() < 14 ? 'morning' : 'evening',
      moodScore: alignment,
    })
    setSaved(true)
    setTimeout(onComplete, 800)
  }

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-4"
      >
        <p className="text-success text-body-sm">Check-in saved ✓</p>
      </motion.div>
    )
  }

  return (
    <Card variant="warm" className="space-y-4">
      <div className="flex items-center gap-2">
        <Star size={14} className="text-warning" />
        <p className="text-body-sm text-text-secondary font-medium">Daily Check-in</p>
      </div>
      <p className="text-body text-text-primary">How aligned do you feel with your identity today?</p>
      <div className="space-y-2">
        <input
          type="range"
          min={1}
          max={10}
          value={alignment}
          onChange={(e) => setAlignment(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-caption text-text-dim font-mono">
          <span>1</span>
          <span className="text-accent font-semibold">{alignment} / 10</span>
          <span>10</span>
        </div>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional reflection… (not saved)"
        className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-accent resize-none h-16 transition-colors placeholder:text-text-dim"
      />
      <Button onClick={handleSave} size="sm" className="w-full">
        Save Check-in
      </Button>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Identity() {
  const { identity: rawIdentity, updateIdentity } = useAppStore()
  const identity = rawIdentity ?? { label: '', values: [], labelHistory: [] }
  const [evidenceLogs, setEvidenceLogs] = useState<EvidenceLog[]>([])
  const [showAddEvidence, setShowAddEvidence] = useState(false)
  const [showEditIdentity, setShowEditIdentity] = useState(false)
  const [showAllEvidence, setShowAllEvidence] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkedInToday, setCheckedInToday] = useState(false)

  const PREVIEW_COUNT = 3

  useEffect(() => {
    loadEvidence()
    checkTodayMood()
  }, [])

  async function loadEvidence() {
    const logs = await getEvidenceLogsRecent(50)
    setEvidenceLogs(logs)
  }

  async function checkTodayMood() {
    const todayLogs = await getTodayMoodLogs()
    setCheckedInToday(todayLogs.length > 0)
  }

  async function handleSaveEvidence(text: string, tags: string[]) {
    await addEvidenceLog({
      timestamp: Date.now(),
      text,
      valuesTags: tags,
      identityLabel: identity.label,
    })
    await loadEvidence()
  }

  function handleSaveIdentity(newLabel: string, newValues: string[]) {
    updateIdentity(newLabel, newValues)
  }

  const displayedLogs = showAllEvidence ? evidenceLogs : evidenceLogs.slice(0, PREVIEW_COUNT)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h1 text-text-heading">Identity</h1>
            <p className="text-body-sm text-text-secondary mt-0.5">
              Your evidence grows the belief
            </p>
          </div>
          <button
            onClick={() => setShowEditIdentity(true)}
            className="flex items-center gap-1.5 text-body-sm text-text-dim hover:text-accent transition-colors mt-1"
          >
            <Edit2 size={14} />
            Edit
          </button>
        </div>

        {/* Identity card */}
        <Card variant="insight" className="space-y-3 py-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-accent text-sm">✦</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption text-text-dim uppercase tracking-widest mb-1">I am becoming</p>
              <h2 className="text-h2 text-text-heading leading-snug">
                {identity.label || 'someone who chooses differently'}
              </h2>
            </div>
          </div>
          {identity.values.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {identity.values.map((v) => (
                <span
                  key={v}
                  className="text-caption px-3 py-1 rounded-full bg-accent/15 text-accent-light"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
          {identity.labelHistory && identity.labelHistory.length > 1 && (
            <p className="text-caption text-text-dim">
              {identity.labelHistory.length} identity labels over your journey
            </p>
          )}
        </Card>

        {/* Daily check-in */}
        {!checkedInToday && !showCheckIn && (
          <button
            onClick={() => setShowCheckIn(true)}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-border-subtle text-body-sm text-text-dim hover:border-accent hover:text-accent transition-colors text-center"
          >
            + Daily check-in
          </button>
        )}
        <AnimatePresence>
          {showCheckIn && !checkedInToday && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <DailyCheckIn
                onComplete={() => {
                  setCheckedInToday(true)
                  setShowCheckIn(false)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evidence log header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 text-text-heading">Evidence Log</h2>
            <p className="text-caption text-text-dim">
              {evidenceLogs.length} moment{evidenceLogs.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddEvidence(true)}
          >
            <Plus size={14} className="mr-1" /> Add
          </Button>
        </div>

        {/* Evidence list */}
        {evidenceLogs.length === 0 ? (
          <Card className="text-center py-10 space-y-2">
            <p className="text-body text-text-secondary">No evidence yet</p>
            <p className="text-caption text-text-dim max-w-xs mx-auto">
              Each time you act in line with your values, log it here. Small moments compound.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddEvidence(true)}
              className="mt-2"
            >
              Log your first moment
            </Button>
          </Card>
        ) : (
          <div className="space-y-0">
            <AnimatePresence>
              {displayedLogs.map((entry) => (
                <EvidenceEntry key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>

            {evidenceLogs.length > PREVIEW_COUNT && (
              <button
                onClick={() => setShowAllEvidence((v) => !v)}
                className="flex items-center gap-1.5 text-body-sm text-text-dim hover:text-accent transition-colors mt-2 ml-5"
              >
                {showAllEvidence ? (
                  <><ChevronUp size={14} /> Show less</>
                ) : (
                  <><ChevronDown size={14} /> Show {evidenceLogs.length - PREVIEW_COUNT} more</>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <AddEvidenceSheet
        open={showAddEvidence}
        onClose={() => setShowAddEvidence(false)}
        onSave={handleSaveEvidence}
        values={identity.values}
        identityLabel={identity.label}
      />

      <EditIdentitySheet
        open={showEditIdentity}
        onClose={() => setShowEditIdentity(false)}
        currentLabel={identity.label}
        currentValues={identity.values}
        onSave={handleSaveIdentity}
      />
    </AppLayout>
  )
}
