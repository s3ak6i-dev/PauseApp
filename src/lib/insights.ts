import { type UrgeEvent, type SlipLog } from '../db/db'

export interface Insight {
  id: string
  text: string
  actionLabel?: string
  actionRoute?: string
}

const REFLECTION_QUESTIONS = [
  'What did this week teach you about your triggers?',
  'What would someone who believed in you say about your effort this week?',
  'Where did you surprise yourself this week?',
  'What would you do differently — and why does it matter?',
  'What pattern did you notice this week that you hadn\'t seen before?',
  'What does pausing feel like, compared to the first time you tried it?',
]

export function getWeeklyReflectionQuestion(weekIndex: number): string {
  return REFLECTION_QUESTIONS[weekIndex % REFLECTION_QUESTIONS.length]
}

export function generateInsights(
  urgeEvents: UrgeEvent[],
  slipLogs: SlipLog[]
): Insight[] {
  const insights: Insight[] = []

  // Urge time-of-day pattern
  const eveningUrges = urgeEvents.filter(e => {
    const hour = new Date(e.timestamp).getHours()
    return hour >= 20 || hour < 2
  })
  if (eveningUrges.length >= 2 && urgeEvents.length > 0) {
    const ratio = eveningUrges.length / urgeEvents.length
    if (ratio > 0.4) {
      insights.push({
        id: 'evening-pattern',
        text: 'Your urges tend to cluster in the evening. Tonight, try the urge timer before opening your phone.',
        actionLabel: 'Set an evening challenge',
        actionRoute: '/train',
      })
    }
  }

  // Trigger frequency pattern (3+ slips same trigger)
  const triggerCounts: Record<string, number> = {}
  for (const slip of slipLogs) {
    for (const t of slip.triggerCategories) {
      triggerCounts[t] = (triggerCounts[t] ?? 0) + 1
    }
  }
  const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]
  if (topTrigger && topTrigger[1] >= 3) {
    insights.push({
      id: 'trigger-pattern',
      text: `"${topTrigger[0]}" has come up ${topTrigger[1]} times. That combination is worth preparing for.`,
      actionLabel: 'Set a challenge for it',
      actionRoute: '/train',
    })
  }

  // Low data / building insight
  if (urgeEvents.length === 0) {
    insights.push({
      id: 'no-data',
      text: 'Your first pause starts here. When you feel an urge, open the timer.',
      actionLabel: 'Ride the Urge',
      actionRoute: '/urge',
    })
  }

  return insights
}

export const SELF_CRITICAL_WORDS = [
  'disgusting', 'pathetic', 'worthless', 'hopeless', 'useless',
  'weak', 'failure', 'loser', 'hate myself', 'no willpower',
]

export function containsSelfCriticalLanguage(text: string): boolean {
  const lower = text.toLowerCase()
  return SELF_CRITICAL_WORDS.some(word => lower.includes(word))
}
