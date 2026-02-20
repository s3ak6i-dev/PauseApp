import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppIdentity {
  label: string            // e.g. "Focused Creator"
  values: string[]         // e.g. ["Mastery", "Clarity", "Presence"]
  labelHistory: string[]   // track changes for instability warning
}

export interface AppStore {
  // Onboarding
  onboardingComplete: boolean
  stage1Answer:       string
  stage2Answers:      string[]
  stage3Label:        string
  stage4Values:       string[]
  stage5Behaviours:   string[]
  stage5Other:        string

  // Identity (persisted post-onboarding)
  identity: AppIdentity | null

  // UI flags
  lastSlipTimestamp:  number | null
  lastReviewTimestamp: number | null
  sessionStartTime:   number | null
  challengeBaselineComplete: boolean
  challengeBaseline:  { boredom: number; physical: number; urgeSpeed: number } | null

  // Actions
  setOnboardingComplete: (v: boolean) => void
  setStage1: (v: string) => void
  setStage2: (v: string[]) => void
  setStage3: (v: string) => void
  setStage4: (v: string[]) => void
  setStage5: (behaviours: string[], other: string) => void
  finaliseIdentity: () => void
  updateIdentity: (label: string, values: string[]) => void
  recordSlip: () => void
  recordReview: () => void
  startSession: () => void
  endSession: () => void
  setChallengeBaseline: (b: { boredom: number; physical: number; urgeSpeed: number }) => void
  reset: () => void
}

const initialState = {
  onboardingComplete: false,
  stage1Answer:       '',
  stage2Answers:      ['', '', ''],
  stage3Label:        '',
  stage4Values:       [],
  stage5Behaviours:   [],
  stage5Other:        '',
  identity:           null,
  lastSlipTimestamp:  null,
  lastReviewTimestamp: null,
  sessionStartTime:   null,
  challengeBaselineComplete: false,
  challengeBaseline:  null,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOnboardingComplete: (v) => set({ onboardingComplete: v }),
      setStage1: (v) => set({ stage1Answer: v }),
      setStage2: (v) => set({ stage2Answers: v }),
      setStage3: (v) => set({ stage3Label: v }),
      setStage4: (v) => set({ stage4Values: v }),
      setStage5: (behaviours, other) =>
        set({ stage5Behaviours: behaviours, stage5Other: other }),

      finaliseIdentity: () => {
        const { stage3Label, stage4Values } = get()
        set({
          identity: {
            label: stage3Label || 'Your Best Self',
            values: stage4Values,
            labelHistory: [stage3Label || 'Your Best Self'],
          },
          onboardingComplete: true,
        })
      },

      updateIdentity: (label, values) => {
        const current = get().identity
        const history = current?.labelHistory ?? []
        const newHistory = label !== current?.label
          ? [...history, label]
          : history
        set({ identity: { label, values, labelHistory: newHistory } })
      },

      recordSlip:   () => set({ lastSlipTimestamp: Date.now() }),
      recordReview: () => set({ lastReviewTimestamp: Date.now() }),
      startSession: () => set({ sessionStartTime: Date.now() }),
      endSession:   () => set({ sessionStartTime: null }),

      setChallengeBaseline: (b) =>
        set({ challengeBaseline: b, challengeBaselineComplete: true }),

      reset: () => set(initialState),
    }),
    {
      name: 'pause-app-store',
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        stage1Answer:       state.stage1Answer,
        stage2Answers:      state.stage2Answers,
        stage3Label:        state.stage3Label,
        stage4Values:       state.stage4Values,
        stage5Behaviours:   state.stage5Behaviours,
        stage5Other:        state.stage5Other,
        identity:           state.identity,
        lastSlipTimestamp:  state.lastSlipTimestamp,
        lastReviewTimestamp: state.lastReviewTimestamp,
        challengeBaselineComplete: state.challengeBaselineComplete,
        challengeBaseline:  state.challengeBaseline,
      }),
    }
  )
)
