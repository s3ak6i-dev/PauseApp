import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Circle, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { IdentityCard } from '../components/IdentityCard'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'
import { getUrgeEventsLast7Days, getSlipLogsLast30Days, getLastSlipLog } from '../db/queries'
import { calculatePauseScore } from '../lib/pauseScore'
import { getGreeting } from '../lib/utils'
import { generateInsights } from '../lib/insights'
import { type UrgeEvent, type SlipLog } from '../db/db'

const DAILY_CHALLENGE = {
  title: 'Deep Work Block',
  description: '25 minutes, no phone.',
  difficulty: 'intermediate' as const,
  type: 'focus',
}

export function Home() {
  const navigate    = useNavigate()
  const identity    = useAppStore(s => s.identity)
  const lastSlip    = useAppStore(s => s.lastSlipTimestamp)

  const [pauseScore, setPauseScore]   = useState<number | null>(null)
  const [insights, setInsights]       = useState<ReturnType<typeof generateInsights>>([])
  const [urgeCount, setUrgeCount]     = useState(0)
  const [loading, setLoading]         = useState(true)
  const [challengeDone, setChallengeDone] = useState(false)

  useEffect(() => {
    async function load() {
      const [events, slips, lastSlipLog] = await Promise.all([
        getUrgeEventsLast7Days(),
        getSlipLogsLast30Days(),
        getLastSlipLog(),
      ])

      const daysSinceSlip = lastSlipLog
        ? Math.floor((Date.now() - lastSlipLog.timestamp) / 86400000)
        : 30

      setPauseScore(calculatePauseScore(events as UrgeEvent[], daysSinceSlip))
      setUrgeCount(events.length)
      setInsights(generateInsights(events as UrgeEvent[], slips as SlipLog[]))
      setLoading(false)
    }
    load()
  }, [])

  const isDay1     = urgeCount === 0 && !loading
  const isPostSlip = lastSlip && Date.now() - lastSlip < 86400000

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Greeting */}
        <p className="text-body text-text-secondary">
          {getGreeting()}{identity ? `, ${identity.label}.` : '.'}
        </p>

        {/* Identity Card — always pinned */}
        {identity && (
          <IdentityCard
            label={identity.label}
            values={identity.values}
            pauseScore={loading ? null : pauseScore}
            recoverySince={isPostSlip ? lastSlip! : null}
          />
        )}

        {/* Post-slip recovery card */}
        {isPostSlip && (
          <Card variant="recovery">
            <div className="space-y-2">
              <p className="text-body text-text-primary">
                You showed up after a hard moment. That's the work.
              </p>
              <p className="text-body-sm text-accent-light">
                Recovery streak: {Math.floor((Date.now() - lastSlip!) / 86400000) || 1} day
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/train')}
                className="mt-2"
              >
                See one small step →
              </Button>
            </div>
          </Card>
        )}

        {/* TODAY section */}
        <div className="space-y-4">
          <h3 className="text-h3 text-text-primary">Today</h3>

          {/* Day 1 empty state */}
          {isDay1 ? (
            <Card variant="default" className="text-center py-10">
              <div className="flex justify-center mb-4">
                <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#4A4A62" strokeWidth="5" />
                </svg>
              </div>
              <p className="text-body text-text-secondary mb-1">
                Your first pause starts here.
              </p>
              <p className="text-body-sm text-text-dim">
                When you feel an urge, tap the ring.
              </p>
              <Button
                onClick={() => navigate('/urge')}
                className="mt-6"
              >
                <Circle size={16} className="mr-2" />
                Ride the Urge
              </Button>
            </Card>
          ) : (
            <>
              {/* Daily challenge card */}
              {!challengeDone ? (
                <Card variant="challenge">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-body-sm text-text-dim">🏋 Today's challenge</p>
                      <h3 className="text-h3 text-text-heading">{DAILY_CHALLENGE.title}</h3>
                      <p className="text-body text-text-secondary">{DAILY_CHALLENGE.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {['●', '●', '○'].map((dot, i) => (
                          <span key={i} className={i < 2 ? 'text-accent text-xs' : 'text-border-subtle text-xs'}>
                            {dot}
                          </span>
                        ))}
                        <span className="text-body-sm text-text-dim ml-1 capitalize">
                          {DAILY_CHALLENGE.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setChallengeDone(true)}
                    >
                      Mark complete
                    </Button>
                    <Button variant="ghost" size="sm">
                      Skip today
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card variant="default" className="text-center py-6">
                  <p className="text-body text-success">✓ Challenge done. That built something.</p>
                </Card>
              )}

              {/* Insight card */}
              {insights.length > 0 && (
                <Card variant="insight">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-accent-light text-sm">✧</span>
                      <span className="text-body-sm text-text-dim">Insight</span>
                    </div>
                    <p className="text-body text-text-primary">
                      {insights[0].text}
                    </p>
                    <div className="flex items-center gap-4">
                      {insights[0].actionLabel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => insights[0].actionRoute && navigate(insights[0].actionRoute!)}
                        >
                          {insights[0].actionLabel} →
                        </Button>
                      )}
                      <div className="flex items-center gap-3 ml-auto">
                        <span className="text-body-sm text-text-dim">Is this accurate?</span>
                        <button className="text-lg hover:scale-110 transition-transform cursor-pointer" aria-label="Yes, accurate">👍</button>
                        <button className="text-lg hover:scale-110 transition-transform cursor-pointer" aria-label="Not quite">👎</button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-body-sm text-text-dim uppercase tracking-wider">Quick actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/urge')}
              className="flex items-center gap-2"
            >
              <Circle size={16} />
              Ride the Urge
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/slip')}
              className="flex items-center gap-2 border border-border-subtle/50"
            >
              <FileText size={16} />
              Log a Slip
            </Button>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  )
}
