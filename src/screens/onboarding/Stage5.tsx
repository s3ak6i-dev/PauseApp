import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { OnboardingShell } from './OnboardingShell'
import { Chip } from '../../components/ui/Chip'

const BEHAVIOURS = [
  'Porn / explicit content',
  'Mindless scrolling',
  'Gaming binges',
  'Late-night phone use',
  'Substance use',
  'Binge watching',
  'Compulsive eating',
  'Other...',
]

export function Stage5() {
  const navigate     = useNavigate()
  const values       = useAppStore(s => s.stage4Values)
  const setBehaviours = useAppStore(s => s.setStage5)
  const saved        = useAppStore(s => s.stage5Behaviours)
  const savedOther   = useAppStore(s => s.stage5Other)

  const [selected, setSelected] = useState<string[]>(saved)
  const [otherText, setOtherText] = useState(savedOther)
  const showOther = selected.includes('Other...')

  const toggle = (b: string) => {
    setSelected(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    )
  }

  const handleNext = () => {
    setBehaviours(selected, otherText)
    navigate('/onboarding/complete')
  }

  const valuesLabel = values.length
    ? values.join(', ')
    : 'your values'

  return (
    <OnboardingShell
      step={5}
      onBack={() => navigate('/onboarding/stage4')}
      onNext={handleNext}
      nextLabel="Finish Setup →"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-h2 text-text-heading leading-snug mb-2">
            Which current behaviours feel most out of step with{' '}
            <span className="text-accent-light">{valuesLabel}</span>?
          </h2>
          <p className="text-body-sm text-text-dim italic">
            This is just data. No behaviour makes you less capable of change.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {BEHAVIOURS.map(b => (
            <Chip
              key={b}
              selected={selected.includes(b)}
              onClick={() => toggle(b)}
            >
              {b}
            </Chip>
          ))}
        </div>

        {showOther && (
          <div className="space-y-2">
            <textarea
              value={otherText}
              onChange={e => setOtherText(e.target.value)}
              placeholder="Describe it briefly..."
              rows={2}
              className={[
                'w-full resize-none rounded-xl p-4 min-h-[80px]',
                'bg-bg-card border border-border-subtle text-text-primary text-body',
                'placeholder:text-text-dim placeholder:italic',
                'focus:outline-none focus:border-accent focus:shadow-inner-focus',
                'transition-all duration-200',
              ].join(' ')}
            />
          </div>
        )}
      </div>
    </OnboardingShell>
  )
}
