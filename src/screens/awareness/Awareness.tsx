import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, Sun, Moon } from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout'
import { Card } from '../../components/ui/Card'
import { getUrgeEventsLast7Days, getMoodLogsLast7Days } from '../../db/queries'
import { generateInsights } from '../../lib/insights'
import type { UrgeEvent, MoodLog } from '../../db/db'

// ─── Risk Forecast ────────────────────────────────────────────────────────────

function getRiskLevel(urgeEvents: UrgeEvent[]): { level: 'low' | 'moderate' | 'high'; label: string; description: string } {
  const last24h = urgeEvents.filter((e) => e.timestamp > Date.now() - 86_400_000)
  const highIntensity = last24h.filter((e) => e.intensityRating >= 7).length
  const total24h = last24h.length

  if (highIntensity >= 2 || total24h >= 4) {
    return {
      level: 'high',
      label: 'Elevated today',
      description: 'Multiple high-intensity urges recently. Consider activating a coping strategy preemptively.',
    }
  }
  if (total24h >= 2 || highIntensity >= 1) {
    return {
      level: 'moderate',
      label: 'Watch and wait',
      description: 'Some urge activity today. Stay close to your coping tools.',
    }
  }
  return {
    level: 'low',
    label: 'Calm today',
    description: 'Low urge activity in the last 24 hours. Good conditions for a challenge.',
  }
}

const RISK_COLORS = {
  low: { bg: 'bg-success/15', border: 'border-success/30', text: 'text-success', dot: 'bg-success' },
  moderate: { bg: 'bg-warning/15', border: 'border-warning/30', text: 'text-warning', dot: 'bg-warning' },
  high: { bg: 'bg-slip/15', border: 'border-slip/30', text: 'text-slip', dot: 'bg-slip' },
}

// ─── Heatmap (simplified) ─────────────────────────────────────────────────────

function WeekHeatmap({ urgeEvents }: { urgeEvents: UrgeEvent[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toISOString().split('T')[0]
    const events = urgeEvents.filter(
      (e) => new Date(e.timestamp).toISOString().split('T')[0] === dayStr
    )
    return {
      label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
      count: events.length,
      paused: events.filter((e) => e.outcome === 'paused').length,
    }
  })

  const maxCount = Math.max(...days.map((d) => d.count), 1)

  return (
    <Card className="space-y-3">
      <p className="text-body-sm text-text-secondary font-medium">7-day activity</p>
      <div className="flex items-end gap-2 h-16">
        {days.map((day) => (
          <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: 40 }}>
              {day.count > 0 && (
                <div
                  className="w-full rounded-sm bg-accent"
                  style={{ height: `${(day.count / maxCount) * 40}px` }}
                />
              )}
              {day.count === 0 && (
                <div className="w-full rounded-sm bg-bg-elevated" style={{ height: 4 }} />
              )}
            </div>
            <span className="text-[10px] font-mono text-text-dim">{day.label}</span>
            {day.paused > 0 && (
              <span className="text-[10px] text-success font-mono">+{day.paused}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-caption text-text-dim">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-accent inline-block" /> Urge sessions
        </span>
        <span className="flex items-center gap-1">
          <span className="text-success">+</span> Pauses
        </span>
      </div>
    </Card>
  )
}

// ─── Mood Trend ───────────────────────────────────────────────────────────────

function MoodTrend({ moodLogs }: { moodLogs: MoodLog[] }) {
  if (moodLogs.length === 0) return null

  const morningLogs = moodLogs.filter((m) => m.timeOfDay === 'morning')
  const eveningLogs = moodLogs.filter((m) => m.timeOfDay === 'evening')
  const avgMorning = morningLogs.length
    ? Math.round((morningLogs.reduce((s, m) => s + m.moodScore, 0) / morningLogs.length) * 10) / 10
    : null
  const avgEvening = eveningLogs.length
    ? Math.round((eveningLogs.reduce((s, m) => s + m.moodScore, 0) / eveningLogs.length) * 10) / 10
    : null

  return (
    <Card className="space-y-3">
      <p className="text-body-sm text-text-secondary font-medium">Mood this week</p>
      <div className="grid grid-cols-2 gap-3">
        {avgMorning !== null && (
          <div className="flex items-center gap-2">
            <Sun size={16} className="text-warning shrink-0" />
            <div>
              <p className="text-caption text-text-dim">Morning avg</p>
              <p className="text-h3 text-text-heading font-mono">{avgMorning}<span className="text-caption text-text-dim">/5</span></p>
            </div>
          </div>
        )}
        {avgEvening !== null && (
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-info shrink-0" />
            <div>
              <p className="text-caption text-text-dim">Evening avg</p>
              <p className="text-h3 text-text-heading font-mono">{avgEvening}<span className="text-caption text-text-dim">/5</span></p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Awareness() {
  const [urgeEvents, setUrgeEvents] = useState<UrgeEvent[]>([])
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([])

  useEffect(() => {
    async function load() {
      const [events, moods] = await Promise.all([
        getUrgeEventsLast7Days(),
        getMoodLogsLast7Days(),
      ])
      setUrgeEvents(events)
      setMoodLogs(moods)
    }
    load()
  }, [])

  const risk = getRiskLevel(urgeEvents)
  const riskStyle = RISK_COLORS[risk.level]
  const insights = generateInsights(urgeEvents, [])

  const totalUrges = urgeEvents.length
  const totalPaused = urgeEvents.filter((e) => e.outcome === 'paused').length
  const pauseRate = totalUrges > 0 ? Math.round((totalPaused / totalUrges) * 100) : null

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-text-heading">Awareness</h1>
          <p className="text-body-sm text-text-secondary mt-0.5">
            Patterns, trends, and what the data says
          </p>
        </div>

        {/* Risk forecast */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`border ${riskStyle.bg} ${riskStyle.border}`}>
            <div className="flex items-start gap-3">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${riskStyle.dot}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-body font-semibold ${riskStyle.text}`}>{risk.label}</p>
                  {risk.level === 'high' && <AlertTriangle size={16} className="text-slip" />}
                  {risk.level === 'moderate' && <TrendingUp size={16} className="text-warning" />}
                </div>
                <p className="text-body-sm text-text-secondary mt-1 leading-relaxed">
                  {risk.description}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick stats */}
        {totalUrges > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sessions', value: totalUrges },
              { label: 'Paused', value: totalPaused },
              { label: 'Pause rate', value: pauseRate !== null ? `${pauseRate}%` : '—' },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center py-4">
                <p className="font-mono text-xl text-text-heading">{value}</p>
                <p className="text-caption text-text-dim mt-0.5">{label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* 7-day heatmap */}
        <WeekHeatmap urgeEvents={urgeEvents} />

        {/* Mood trend */}
        <MoodTrend moodLogs={moodLogs} />

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-h3 text-text-heading">Insights</h2>
            {insights.slice(0, 3).map((insight) => (
              <Card key={insight.id} variant="insight" className="space-y-1">
                <p className="text-body text-text-primary leading-relaxed">{insight.text}</p>
                {insight.actionLabel && (
                  <p className="text-caption text-accent">{insight.actionLabel}</p>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {totalUrges === 0 && moodLogs.length === 0 && (
          <Card className="text-center py-12 space-y-2">
            <p className="text-body text-text-secondary">Nothing to show yet</p>
            <p className="text-caption text-text-dim max-w-xs mx-auto">
              Use the urge timer and log check-ins to start building your awareness picture.
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
