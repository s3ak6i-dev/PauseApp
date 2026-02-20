import { supabase, getDeviceId } from '../lib/supabase'
import type { UrgeEvent, SlipLog, ChallengeLog, MoodLog, EvidenceLog, WeeklyReview } from './db'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS  = 24 * 60 * 60 * 1000

// ─── Row ↔ Type mappers ───────────────────────────────────────────────────────
// DB column: ts (BIGINT epoch ms) → TS property: timestamp

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUrgeEvent(r: any): UrgeEvent {
  return {
    id:                r.id,
    userId:            r.user_id,
    timestamp:         r.ts,
    durationSeconds:   r.duration_seconds,
    intensityRating:   r.intensity_rating,
    triggerCategories: r.trigger_categories ?? [],
    outcome:           r.outcome,
    level:             r.level,
    notes:             r.notes,
    extensionCount:    r.extension_count ?? 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSlipLog(r: any): SlipLog {
  return {
    id:                   r.id,
    userId:               r.user_id,
    timestamp:            r.ts,
    triggerCategories:    r.trigger_categories ?? [],
    emotionEmoji:         r.emotion_emoji,
    emotionScore:         r.emotion_score,
    emotionNotes:         r.emotion_notes,
    intention:            r.intention,
    reflectionDepthScore: r.reflection_depth_score ?? 0,
    isQuickLog:           r.is_quick_log ?? false,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toChallengeLog(r: any): ChallengeLog {
  return {
    id:              r.id,
    userId:          r.user_id,
    challengeId:     r.challenge_id,
    timestamp:       r.ts,
    completed:       r.completed,
    difficulty:      r.difficulty,
    challengeType:   r.challenge_type,
    durationMinutes: r.duration_minutes,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMoodLog(r: any): MoodLog {
  return {
    id:        r.id,
    userId:    r.user_id,
    timestamp: r.ts,
    timeOfDay: r.time_of_day,
    moodScore: r.mood_score,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEvidenceLog(r: any): EvidenceLog {
  return {
    id:            r.id,
    userId:        r.user_id,
    timestamp:     r.ts,
    text:          r.text,
    valuesTags:    r.values_tags ?? [],
    identityLabel: r.identity_label,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWeeklyReview(r: any): WeeklyReview {
  return {
    id:                 r.id,
    userId:             r.user_id,
    weekStart:          r.week_start,
    pauseScore:         r.pause_score,
    intentionTrigger:   r.intention_trigger,
    intentionAction:    r.intention_action,
    alignmentScore:     r.alignment_score,
    reflectionText:     r.reflection_text,
    reflectionQuestion: r.reflection_question,
    followThrough:      r.follow_through,
    completedAt:        r.completed_at,
  }
}

// ─── Urge Events ─────────────────────────────────────────────────────────────

export async function addUrgeEvent(event: Omit<UrgeEvent, 'id' | 'userId'>): Promise<UrgeEvent> {
  const { data, error } = await supabase
    .from('urge_events')
    .insert({
      user_id:            getDeviceId(),
      ts:                 event.timestamp,
      duration_seconds:   event.durationSeconds,
      intensity_rating:   event.intensityRating,
      trigger_categories: event.triggerCategories,
      outcome:            event.outcome,
      level:              event.level,
      notes:              event.notes,
      extension_count:    event.extensionCount,
    })
    .select()
    .single()
  if (error) throw error
  return toUrgeEvent(data)
}

export async function updateUrgeEvent(id: number, patch: Partial<Omit<UrgeEvent, 'id' | 'userId'>>): Promise<UrgeEvent> {
  const row: Record<string, unknown> = {}
  if (patch.durationSeconds   !== undefined) row.duration_seconds   = patch.durationSeconds
  if (patch.intensityRating   !== undefined) row.intensity_rating   = patch.intensityRating
  if (patch.triggerCategories !== undefined) row.trigger_categories = patch.triggerCategories
  if (patch.outcome           !== undefined) row.outcome            = patch.outcome
  if (patch.level             !== undefined) row.level              = patch.level
  if (patch.notes             !== undefined) row.notes              = patch.notes
  if (patch.extensionCount    !== undefined) row.extension_count    = patch.extensionCount
  const { data, error } = await supabase
    .from('urge_events')
    .update(row)
    .eq('id', id)
    .eq('user_id', getDeviceId())
    .select()
    .single()
  if (error) throw error
  return toUrgeEvent(data)
}

export async function deleteUrgeEvent(id: number): Promise<void> {
  const { error } = await supabase
    .from('urge_events')
    .delete()
    .eq('id', id)
    .eq('user_id', getDeviceId())
  if (error) throw error
}

export async function getUrgeEventsInRange(from: number, to: number): Promise<UrgeEvent[]> {
  const { data, error } = await supabase
    .from('urge_events')
    .select('*')
    .eq('user_id', getDeviceId())
    .gte('ts', from)
    .lte('ts', to)
    .order('ts', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toUrgeEvent)
}

export async function getUrgeEventsLast7Days(): Promise<UrgeEvent[]> {
  return getUrgeEventsInRange(Date.now() - WEEK_MS, Date.now())
}

export async function getUrgeEventsLast30Days(): Promise<UrgeEvent[]> {
  return getUrgeEventsInRange(Date.now() - 30 * DAY_MS, Date.now())
}

export async function getLastUrgeEvent(): Promise<UrgeEvent | null> {
  const { data, error } = await supabase
    .from('urge_events')
    .select('*')
    .eq('user_id', getDeviceId())
    .order('ts', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toUrgeEvent(data) : null
}

// ─── Slip Logs ────────────────────────────────────────────────────────────────

export async function addSlipLog(slip: Omit<SlipLog, 'id' | 'userId'>): Promise<SlipLog> {
  const { data, error } = await supabase
    .from('slip_logs')
    .insert({
      user_id:                getDeviceId(),
      ts:                     slip.timestamp,
      trigger_categories:     slip.triggerCategories,
      emotion_emoji:          slip.emotionEmoji,
      emotion_score:          slip.emotionScore,
      emotion_notes:          slip.emotionNotes,
      intention:              slip.intention,
      reflection_depth_score: slip.reflectionDepthScore,
      is_quick_log:           slip.isQuickLog,
    })
    .select()
    .single()
  if (error) throw error
  return toSlipLog(data)
}

export async function updateSlipLog(id: number, patch: Partial<Omit<SlipLog, 'id' | 'userId'>>): Promise<SlipLog> {
  const row: Record<string, unknown> = {}
  if (patch.triggerCategories    !== undefined) row.trigger_categories     = patch.triggerCategories
  if (patch.emotionEmoji         !== undefined) row.emotion_emoji          = patch.emotionEmoji
  if (patch.emotionScore         !== undefined) row.emotion_score          = patch.emotionScore
  if (patch.emotionNotes         !== undefined) row.emotion_notes          = patch.emotionNotes
  if (patch.intention            !== undefined) row.intention              = patch.intention
  if (patch.reflectionDepthScore !== undefined) row.reflection_depth_score = patch.reflectionDepthScore
  const { data, error } = await supabase
    .from('slip_logs')
    .update(row)
    .eq('id', id)
    .eq('user_id', getDeviceId())
    .select()
    .single()
  if (error) throw error
  return toSlipLog(data)
}

export async function deleteSlipLog(id: number): Promise<void> {
  const { error } = await supabase
    .from('slip_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', getDeviceId())
  if (error) throw error
}

export async function getSlipLogsLast7Days(): Promise<SlipLog[]> {
  const { data, error } = await supabase
    .from('slip_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .gte('ts', Date.now() - WEEK_MS)
    .order('ts', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toSlipLog)
}

export async function getSlipLogsLast30Days(): Promise<SlipLog[]> {
  const { data, error } = await supabase
    .from('slip_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .gte('ts', Date.now() - 30 * DAY_MS)
    .order('ts', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toSlipLog)
}

export async function getLastSlipLog(): Promise<SlipLog | null> {
  const { data, error } = await supabase
    .from('slip_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .order('ts', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toSlipLog(data) : null
}

export async function getSlipCount(): Promise<number> {
  const { count, error } = await supabase
    .from('slip_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', getDeviceId())
  if (error) throw error
  return count ?? 0
}

// ─── Challenge Logs ──────────────────────────────────────────────────────────

export async function addChallengeLog(log: Omit<ChallengeLog, 'id' | 'userId'>): Promise<ChallengeLog> {
  const { data, error } = await supabase
    .from('challenge_logs')
    .insert({
      user_id:          getDeviceId(),
      challenge_id:     log.challengeId,
      ts:               log.timestamp,
      completed:        log.completed,
      difficulty:       log.difficulty,
      challenge_type:   log.challengeType,
      duration_minutes: log.durationMinutes,
    })
    .select()
    .single()
  if (error) throw error
  return toChallengeLog(data)
}

export async function updateChallengeLog(id: number, patch: Partial<Omit<ChallengeLog, 'id' | 'userId'>>): Promise<ChallengeLog> {
  const row: Record<string, unknown> = {}
  if (patch.completed       !== undefined) row.completed        = patch.completed
  if (patch.difficulty      !== undefined) row.difficulty       = patch.difficulty
  if (patch.challengeType   !== undefined) row.challenge_type   = patch.challengeType
  if (patch.durationMinutes !== undefined) row.duration_minutes = patch.durationMinutes
  const { data, error } = await supabase
    .from('challenge_logs')
    .update(row)
    .eq('id', id)
    .eq('user_id', getDeviceId())
    .select()
    .single()
  if (error) throw error
  return toChallengeLog(data)
}

export async function deleteChallengeLog(id: number): Promise<void> {
  const { error } = await supabase
    .from('challenge_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', getDeviceId())
  if (error) throw error
}

export async function getChallengeLogsLast30Days(): Promise<ChallengeLog[]> {
  const { data, error } = await supabase
    .from('challenge_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .gte('ts', Date.now() - 30 * DAY_MS)
    .order('ts', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toChallengeLog)
}

export async function getChallengeLogsThisWeek(): Promise<ChallengeLog[]> {
  const weekStart = getWeekStart(Date.now())
  const { data, error } = await supabase
    .from('challenge_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .gte('ts', weekStart)
    .order('ts', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toChallengeLog)
}

export async function getChallengeCompletionRate(weeks = 4): Promise<number> {
  const { data, error } = await supabase
    .from('challenge_logs')
    .select('completed')
    .eq('user_id', getDeviceId())
    .gte('ts', Date.now() - weeks * WEEK_MS)
  if (error) throw error
  if (!data || data.length === 0) return 0
  const completed = data.filter(r => r.completed).length
  return Math.round((completed / data.length) * 100)
}

// ─── Mood Logs ────────────────────────────────────────────────────────────────

export async function addMoodLog(log: Omit<MoodLog, 'id' | 'userId'>): Promise<MoodLog> {
  const { data, error } = await supabase
    .from('mood_logs')
    .insert({
      user_id:     getDeviceId(),
      ts:          log.timestamp,
      time_of_day: log.timeOfDay,
      mood_score:  log.moodScore,
    })
    .select()
    .single()
  if (error) throw error
  return toMoodLog(data)
}

export async function updateMoodLog(id: number, patch: { moodScore?: number; timeOfDay?: 'morning' | 'evening' }): Promise<MoodLog> {
  const row: Record<string, unknown> = {}
  if (patch.moodScore  !== undefined) row.mood_score  = patch.moodScore
  if (patch.timeOfDay  !== undefined) row.time_of_day = patch.timeOfDay
  const { data, error } = await supabase
    .from('mood_logs')
    .update(row)
    .eq('id', id)
    .eq('user_id', getDeviceId())
    .select()
    .single()
  if (error) throw error
  return toMoodLog(data)
}

export async function deleteMoodLog(id: number): Promise<void> {
  const { error } = await supabase
    .from('mood_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', getDeviceId())
  if (error) throw error
}

export async function getMoodLogsLast30Days(): Promise<MoodLog[]> {
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .gte('ts', Date.now() - 30 * DAY_MS)
    .order('ts', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toMoodLog)
}

export async function getMoodLogsLast7Days(): Promise<MoodLog[]> {
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .gte('ts', Date.now() - WEEK_MS)
    .order('ts', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toMoodLog)
}

export async function getTodayMoodLogs(): Promise<MoodLog[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .gte('ts', startOfDay.getTime())
    .order('ts', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toMoodLog)
}

// ─── Evidence Logs ────────────────────────────────────────────────────────────

export async function addEvidenceLog(log: Omit<EvidenceLog, 'id' | 'userId'>): Promise<EvidenceLog> {
  const { data, error } = await supabase
    .from('evidence_logs')
    .insert({
      user_id:        getDeviceId(),
      ts:             log.timestamp,
      text:           log.text,
      values_tags:    log.valuesTags,
      identity_label: log.identityLabel,
    })
    .select()
    .single()
  if (error) throw error
  return toEvidenceLog(data)
}

export async function updateEvidenceLog(id: number, patch: { text?: string; valuesTags?: string[] }): Promise<EvidenceLog> {
  const row: Record<string, unknown> = {}
  if (patch.text       !== undefined) row.text        = patch.text
  if (patch.valuesTags !== undefined) row.values_tags = patch.valuesTags
  const { data, error } = await supabase
    .from('evidence_logs')
    .update(row)
    .eq('id', id)
    .eq('user_id', getDeviceId())
    .select()
    .single()
  if (error) throw error
  return toEvidenceLog(data)
}

export async function deleteEvidenceLog(id: number): Promise<void> {
  const { error } = await supabase
    .from('evidence_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', getDeviceId())
  if (error) throw error
}

export async function getEvidenceLogsRecent(limit = 20): Promise<EvidenceLog[]> {
  const { data, error } = await supabase
    .from('evidence_logs')
    .select('*')
    .eq('user_id', getDeviceId())
    .order('ts', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(toEvidenceLog)
}

export async function getEvidenceCountThisWeek(): Promise<number> {
  const weekStart = getWeekStart(Date.now())
  const { count, error } = await supabase
    .from('evidence_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', getDeviceId())
    .gte('ts', weekStart)
  if (error) throw error
  return count ?? 0
}

// ─── Weekly Reviews ───────────────────────────────────────────────────────────

export async function addWeeklyReview(review: Omit<WeeklyReview, 'id' | 'userId'>): Promise<WeeklyReview> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .insert({
      user_id:             getDeviceId(),
      week_start:          review.weekStart,
      pause_score:         review.pauseScore,
      intention_trigger:   review.intentionTrigger,
      intention_action:    review.intentionAction,
      alignment_score:     review.alignmentScore,
      reflection_text:     review.reflectionText,
      reflection_question: review.reflectionQuestion,
      follow_through:      review.followThrough,
      completed_at:        review.completedAt,
    })
    .select()
    .single()
  if (error) throw error
  return toWeeklyReview(data)
}

export async function updateWeeklyReview(id: number, patch: Partial<Omit<WeeklyReview, 'id' | 'userId'>>): Promise<WeeklyReview> {
  const row: Record<string, unknown> = {}
  if (patch.pauseScore       !== undefined) row.pause_score       = patch.pauseScore
  if (patch.intentionTrigger !== undefined) row.intention_trigger = patch.intentionTrigger
  if (patch.intentionAction  !== undefined) row.intention_action  = patch.intentionAction
  if (patch.alignmentScore   !== undefined) row.alignment_score   = patch.alignmentScore
  if (patch.reflectionText   !== undefined) row.reflection_text   = patch.reflectionText
  if (patch.followThrough    !== undefined) row.follow_through    = patch.followThrough
  const { data, error } = await supabase
    .from('weekly_reviews')
    .update(row)
    .eq('id', id)
    .eq('user_id', getDeviceId())
    .select()
    .single()
  if (error) throw error
  return toWeeklyReview(data)
}

export async function deleteWeeklyReview(id: number): Promise<void> {
  const { error } = await supabase
    .from('weekly_reviews')
    .delete()
    .eq('id', id)
    .eq('user_id', getDeviceId())
  if (error) throw error
}

export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('user_id', getDeviceId())
    .order('week_start', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toWeeklyReview)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getWeekStart(timestamp: number): number {
  const d = new Date(timestamp)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export async function hasDataOlderThan(days: number): Promise<boolean> {
  const { count, error } = await supabase
    .from('urge_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', getDeviceId())
    .lt('ts', Date.now() - days * DAY_MS)
  if (error) throw error
  return (count ?? 0) > 0
}

export async function getTotalSessionCount(): Promise<number> {
  const { count, error } = await supabase
    .from('urge_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', getDeviceId())
  if (error) throw error
  return count ?? 0
}

export async function exportAllData() {
  const [urgeEvents, slipLogs, challengeLogs, moodLogs, evidenceLogs, weeklyReviews] =
    await Promise.all([
      getUrgeEventsLast30Days(),
      getSlipLogsLast30Days(),
      getChallengeLogsThisWeek(),
      getMoodLogsLast7Days(),
      getEvidenceLogsRecent(200),
      getWeeklyReviews(),
    ])
  return { urgeEvents, slipLogs, challengeLogs, moodLogs, evidenceLogs, weeklyReviews, exportedAt: Date.now() }
}

export async function deleteAllData(): Promise<void> {
  const uid = getDeviceId()
  await Promise.all([
    supabase.from('urge_events').delete().eq('user_id', uid),
    supabase.from('slip_logs').delete().eq('user_id', uid),
    supabase.from('challenge_logs').delete().eq('user_id', uid),
    supabase.from('mood_logs').delete().eq('user_id', uid),
    supabase.from('evidence_logs').delete().eq('user_id', uid),
    supabase.from('weekly_reviews').delete().eq('user_id', uid),
  ])
}
