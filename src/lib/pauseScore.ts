import { type UrgeEvent } from '../db/db'

/**
 * Pause Score formula (spec §6.4):
 *
 * Base:               Mean seconds delayed across all urge events in 7-day window
 * Intensity weight:   Delays on 7–10 intensity urges weighted 1.5×
 * Consistency bonus:  If delay on 5+ days → score × 1.1
 * Recovery modifier:  daysSinceLastSlip × 0.02 added to score
 */
export function calculatePauseScore(
  events: UrgeEvent[],
  daysSinceLastSlip: number
): number {
  if (!events.length) return 0

  // Weighted mean
  let weightedSum  = 0
  let weightCount  = 0
  const activeDays = new Set<string>()

  for (const e of events) {
    const weight = e.intensityRating >= 7 ? 1.5 : 1
    weightedSum  += e.durationSeconds * weight
    weightCount  += weight
    activeDays.add(new Date(e.timestamp).toDateString())
  }

  let score = weightCount > 0 ? weightedSum / weightCount : 0

  // Consistency bonus
  if (activeDays.size >= 5) score *= 1.1

  // Recovery modifier
  const recoveryBonus = Math.min(daysSinceLastSlip * 0.02, 1) // cap at +1s
  score += recoveryBonus

  return Math.round(score)
}

export function getScoreTrend(
  currentScore: number,
  previousScore: number
): 'up' | 'flat' | 'down' {
  const delta = currentScore - previousScore
  if (delta > 2)  return 'up'
  if (delta < -2) return 'down'
  return 'flat'
}

export function formatScore(seconds: number): string {
  return `${seconds}s`
}
