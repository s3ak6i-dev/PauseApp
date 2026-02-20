import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { OnboardingShell } from './OnboardingShell'
import { IdentityCard } from '../../components/IdentityCard'

export function Stage3() {
  const navigate  = useNavigate()
  const label     = useAppStore(s => s.stage3Label)
  const values    = useAppStore(s => s.stage4Values)
  const setStage3 = useAppStore(s => s.setStage3)

  return (
    <OnboardingShell
      step={3}
      onBack={() => navigate('/onboarding/stage2')}
      onNext={() => navigate('/onboarding/stage4')}
      skipRoute="/onboarding/stage4"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-h2 text-text-heading leading-snug mb-2">
            If the best version of you had a two-word title, what would it be?
          </h2>
          <p className="text-body-sm text-text-dim italic">
            e.g. "Focused Creator" · "Calm Builder" · "Present Father"
          </p>
        </div>

        <input
          type="text"
          value={label}
          onChange={e => {
            if (e.target.value.length <= 30) setStage3(e.target.value)
          }}
          placeholder="Your identity title..."
          maxLength={30}
          className={[
            'w-full rounded-xl px-4 py-4 text-center',
            'text-2xl font-light text-text-heading',
            'bg-bg-card border border-border-subtle',
            'placeholder:text-text-dim placeholder:font-light',
            'focus:outline-none focus:border-accent focus:shadow-inner-focus',
            'transition-all duration-200',
          ].join(' ')}
          aria-label="Your identity label"
        />

        {/* Live preview */}
        {label && (
          <div className="space-y-2">
            <p className="text-body-sm text-text-dim">Preview:</p>
            <IdentityCard
              label={label}
              values={values.length ? values : ['Your values...']}
              pauseScore={null}
            />
          </div>
        )}
      </div>
    </OnboardingShell>
  )
}
