import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { OnboardingShell } from './OnboardingShell'
import { Chip } from '../../components/ui/Chip'

const VALUES = [
  'Freedom', 'Mastery', 'Presence', 'Integrity',
  'Vitality', 'Clarity', 'Purpose', 'Calm', 'Family',
  'Growth', 'Honesty', 'Connection',
]

export function Stage4() {
  const navigate  = useNavigate()
  const selected  = useAppStore(s => s.stage4Values)
  const setStage4 = useAppStore(s => s.setStage4)
  const [shakingValue, setShakingValue] = useState<string | null>(null)

  const toggle = (v: string) => {
    if (selected.includes(v)) {
      setStage4(selected.filter(x => x !== v))
    } else if (selected.length < 3) {
      setStage4([...selected, v])
    } else {
      // Gentle shake on 4th attempt
      setShakingValue(v)
      setTimeout(() => setShakingValue(null), 400)
    }
  }

  return (
    <OnboardingShell
      step={4}
      onBack={() => navigate('/onboarding/stage3')}
      onNext={() => navigate('/onboarding/stage5')}
      skipRoute="/onboarding/stage5"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-h2 text-text-heading leading-snug mb-2">
            What matters most to you?
          </h2>
          <p className="text-body-sm text-text-dim italic">Pick up to 3.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {VALUES.map(v => (
            <Chip
              key={v}
              selected={selected.includes(v)}
              shaking={shakingValue === v}
              onClick={() => toggle(v)}
            >
              {v}
            </Chip>
          ))}
        </div>

        {selected.length === 3 && (
          <p className="text-body-sm text-text-dim italic">
            You've selected 3 values. Tap one to deselect it before adding another.
          </p>
        )}

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-body-sm text-text-dim">Selected:</span>
            {selected.map(v => (
              <span key={v} className="text-body-sm text-accent-light">
                {v}
              </span>
            ))}
          </div>
        )}
      </div>
    </OnboardingShell>
  )
}
