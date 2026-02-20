import { useEffect, useState } from 'react'

type BreathPhase = 'inhale' | 'hold' | 'exhale'

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Breathe in',
  hold:   'Hold',
  exhale: 'Breathe out',
}

// Phase durations in ms matching spec: 4s inhale, 2s hold, 6s exhale
const PHASE_DURATIONS: Record<BreathPhase, number> = {
  inhale: 4000,
  hold:   2000,
  exhale: 6000,
}

const NEXT_PHASE: Record<BreathPhase, BreathPhase> = {
  inhale: 'hold',
  hold:   'exhale',
  exhale: 'inhale',
}

interface BreathRingProps {
  timerSeconds: number     // countdown value to show in centre
  totalSeconds: number     // full duration for progress arc
  size?: number
  active?: boolean         // false = static placeholder ring
  reducedMotion?: boolean
}

export function BreathRing({
  timerSeconds,
  totalSeconds,
  size = 240,
  active = true,
  reducedMotion = false,
}: BreathRingProps) {
  const [phase, setPhase] = useState<BreathPhase>('inhale')

  // Progress ring values
  const strokeWidth = 6
  const radius      = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const elapsed     = totalSeconds - timerSeconds
  const progress    = elapsed / totalSeconds
  const offset      = circumference * (1 - progress)

  // Breath cycle — advance phase on a schedule
  useEffect(() => {
    if (!active) return
    let current: BreathPhase = 'inhale'
    setPhase(current)

    const tick = () => {
      current = NEXT_PHASE[current]
      setPhase(current)
      timer = setTimeout(tick, PHASE_DURATIONS[current])
    }
    let timer = setTimeout(tick, PHASE_DURATIONS[current])
    return () => clearTimeout(timer)
  }, [active])


  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG progress ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#4A4A62" strokeWidth={strokeWidth}
        />
        {/* Progress fill */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#7C8CF8" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>

      {/* Breath element (interactive dot) */}
      {active && (
        <div
          className={reducedMotion ? 'breath-element-reduced' : 'breath-element'}
          style={{
            width: 60, height: 60,
            borderRadius: '50%',
            background: '#7C8CF8',
            position: 'absolute',
            ...(reducedMotion ? {} : {}),
          }}
          aria-hidden="true"
        />
      )}

      {/* Timer display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span
          className="font-mono text-[3.5rem] leading-none text-text-heading tabular-nums"
          aria-live="off"
          aria-atomic="true"
        >
          {timerSeconds}
        </span>
        {active && (
          <span className="text-caption text-text-dim italic">
            {PHASE_LABELS[phase]}
          </span>
        )}
      </div>
    </div>
  )
}
