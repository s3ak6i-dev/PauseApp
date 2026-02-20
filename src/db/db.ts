// ─── Domain Types ─────────────────────────────────────────────────────────────
// These mirror the Supabase table columns (snake_case in DB → camelCase here).
// All read/write goes through queries.ts — nothing in this file talks to the DB.

export interface UrgeEvent {
  id?: number
  userId?: string
  timestamp: number
  durationSeconds: number
  intensityRating: number        // 1–10
  triggerCategories: string[]
  outcome: 'paused' | 'continued' | 'still-in-it' | 'abandoned'
  level: 1 | 2 | 3
  notes?: string
  extensionCount: number
}

export interface SlipLog {
  id?: number
  userId?: string
  timestamp: number
  triggerCategories: string[]
  emotionEmoji: string
  emotionScore: number           // 1–5
  emotionNotes?: string
  intention?: string
  reflectionDepthScore: number   // 0–100
  isQuickLog: boolean
}

export interface ChallengeLog {
  id?: number
  userId?: string
  challengeId: string
  timestamp: number
  completed: boolean
  difficulty: 'beginner' | 'intermediate' | 'hard'
  challengeType: 'physical' | 'focus' | 'awareness' | 'digital'
  durationMinutes: number
}

export interface MoodLog {
  id?: number
  userId?: string
  timestamp: number
  timeOfDay: 'morning' | 'evening'
  moodScore: number              // 1–5
}

export interface EvidenceLog {
  id?: number
  userId?: string
  timestamp: number
  text: string
  valuesTags: string[]
  identityLabel: string
}

export interface WeeklyReview {
  id?: number
  userId?: string
  weekStart: number              // Unix ms — Monday 00:00
  pauseScore: number
  intentionTrigger: string
  intentionAction: string
  alignmentScore: number
  reflectionText?: string
  reflectionQuestion: string
  followThrough?: 'yes' | 'partly' | 'no'
  completedAt: number
}
