import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Download, Trash2, ChevronRight, AlertTriangle, History as HistoryIcon } from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { exportAllData, deleteAllData } from '../../db/queries'

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-body text-text-primary">{label}</p>
        {description && (
          <p className="text-caption text-text-dim mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${
          value ? 'bg-accent' : 'bg-border-subtle'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <p className="text-caption text-text-dim uppercase tracking-widest font-mono">{title}</p>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <Card className="space-y-4 border border-slip/30 bg-slip/5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-slip shrink-0 mt-0.5" />
          <div>
            <p className="text-body font-semibold text-slip">Delete all data?</p>
            <p className="text-body-sm text-text-secondary mt-1 leading-relaxed">
              This permanently deletes all urge events, slips, challenges, mood logs, and evidence.
              Your identity settings will remain. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} className="flex-1">
            Delete everything
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Settings() {
  const { reset } = useAppStore()
  const [notifUrge, setNotifUrge] = useState(false)
  const [notifReview, setNotifReview] = useState(true)
  const [notifCheckIn, setNotifCheckIn] = useState(false)
  const [sessionAlert, setSessionAlert] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [deleteDone, setDeleteDone] = useState(false)

  async function handleExport() {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pause-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 3000)
  }

  async function handleDelete() {
    await deleteAllData()
    setShowDeleteConfirm(false)
    setDeleteDone(true)
    setTimeout(() => setDeleteDone(false), 3000)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-text-heading">Settings</h1>
          <p className="text-body-sm text-text-secondary mt-0.5">Preferences and data controls</p>
        </div>

        {/* Notifications */}
        <div className="space-y-1">
          <SectionHeader title="Notifications" />
          <Card className="divide-y divide-border-subtle">
            <ToggleRow
              label="Weekly review reminder"
              description="Sunday evening reminder to complete your weekly review"
              value={notifReview}
              onChange={setNotifReview}
            />
            <ToggleRow
              label="Daily check-in reminder"
              description="Morning nudge to log your alignment score"
              value={notifCheckIn}
              onChange={setNotifCheckIn}
            />
            <ToggleRow
              label="Urge timer shortcut"
              description="Quick-access notification for when urges hit unexpectedly"
              value={notifUrge}
              onChange={setNotifUrge}
            />
          </Card>
        </div>

        {/* Display */}
        <div className="space-y-1">
          <SectionHeader title="Display" />
          <Card className="divide-y divide-border-subtle">
            <ToggleRow
              label="Reduce motion"
              description="Minimise animations — uses opacity transitions instead of movement"
              value={reducedMotion}
              onChange={setReducedMotion}
            />
            <ToggleRow
              label="20-minute session alert"
              description="Gentle prompt when you've been in the app for 20 continuous minutes"
              value={sessionAlert}
              onChange={setSessionAlert}
            />
          </Card>
        </div>

        {/* Identity */}
        <div className="space-y-1">
          <SectionHeader title="Identity" />
          <Card>
            <button
              onClick={() => window.location.href = '/identity'}
              className="flex items-center justify-between w-full py-1"
            >
              <div className="text-left">
                <p className="text-body text-text-primary">Edit identity & values</p>
                <p className="text-caption text-text-dim">Update your label and core values</p>
              </div>
              <ChevronRight size={16} className="text-text-dim" />
            </button>
          </Card>
        </div>

        {/* Data & Privacy */}
        <div className="space-y-1">
          <SectionHeader title="Data & Privacy" />
          <div className="space-y-3">
            <Card>
              <div className="space-y-1">
                <p className="text-body-sm text-text-secondary font-medium flex items-center gap-2">
                  <Shield size={14} className="text-accent" /> Local-first storage
                </p>
                <p className="text-caption text-text-dim leading-relaxed">
                  All your data lives on this device only. Nothing is sent to any server.
                  Clearing your browser data will delete your Pause data permanently.
                </p>
              </div>
            </Card>

            <button
              onClick={() => window.location.href = '/history'}
              className="flex items-center justify-between w-full px-4 py-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <HistoryIcon size={18} className="text-accent" />
                <div className="text-left">
                  <p className="text-body text-text-primary">View History</p>
                  <p className="text-caption text-text-dim">Edit or delete individual entries</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-dim" />
            </button>

            <button
              onClick={handleExport}
              className="flex items-center justify-between w-full px-4 py-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download size={18} className="text-accent" />
                <div className="text-left">
                  <p className="text-body text-text-primary">Export data</p>
                  <p className="text-caption text-text-dim">Download a JSON backup of all your records</p>
                </div>
              </div>
              {exportDone ? (
                <span className="text-caption text-success">Exported ✓</span>
              ) : (
                <ChevronRight size={16} className="text-text-dim" />
              )}
            </button>

            <AnimatePresence>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-3 w-full px-4 py-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-slip/50 transition-colors"
                >
                  <Trash2 size={18} className="text-slip" />
                  <div className="text-left">
                    <p className="text-body text-slip">Delete all data</p>
                    <p className="text-caption text-text-dim">Permanently remove all sessions, slips, and logs</p>
                  </div>
                </button>
              ) : (
                <DeleteConfirm
                  onConfirm={handleDelete}
                  onCancel={() => setShowDeleteConfirm(false)}
                />
              )}
            </AnimatePresence>

            {deleteDone && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-caption text-success text-center"
              >
                All data deleted.
              </motion.p>
            )}
          </div>
        </div>

        {/* Reset onboarding */}
        <div className="space-y-1">
          <SectionHeader title="Advanced" />
          <Card>
            <button
              onClick={() => {
                if (confirm('This will restart the onboarding flow. Continue?')) {
                  reset()
                  window.location.href = '/onboarding'
                }
              }}
              className="flex items-center justify-between w-full py-1"
            >
              <div className="text-left">
                <p className="text-body text-text-primary">Reset onboarding</p>
                <p className="text-caption text-text-dim">Re-run the identity setup flow</p>
              </div>
              <ChevronRight size={16} className="text-text-dim" />
            </button>
          </Card>
        </div>

        {/* App info */}
        <div className="text-center pt-4 pb-8">
          <p className="text-caption text-text-dim">Pause · v1.0.0</p>
          <p className="text-caption text-text-dim mt-0.5">Built for the long game</p>
        </div>
      </div>
    </AppLayout>
  )
}
