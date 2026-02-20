import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { OnboardingShell } from './OnboardingShell'

export function Stage1() {
  const navigate  = useNavigate()
  const answer    = useAppStore(s => s.stage1Answer)
  const setStage1 = useAppStore(s => s.setStage1)

  return (
    <OnboardingShell
      step={1}
      onBack={() => navigate('/onboarding/welcome')}
      onNext={() => navigate('/onboarding/stage2')}
      skipRoute="/onboarding/stage3"
    >
      <div className="space-y-6">
        <div className="bg-bg-elevated rounded-xl2 p-6 border border-border-subtle/30">
          <h2 className="text-h2 text-text-heading mb-3 leading-snug">
            Think of someone you respect.
          </h2>
          <p className="text-body text-text-secondary">
            In moments of temptation, what do they actually do?
          </p>
        </div>

        <div className="space-y-2">
          <textarea
            value={answer}
            onChange={e => setStage1(e.target.value)}
            placeholder="Write your answer..."
            maxLength={200}
            className={[
              'w-full min-h-[120px] resize-none rounded-xl p-4',
              'bg-bg-card border border-border-subtle text-text-primary text-body',
              'placeholder:text-text-dim placeholder:italic',
              'focus:outline-none focus:border-accent focus:shadow-inner-focus',
              'transition-all duration-200',
            ].join(' ')}
            aria-label="Your answer about someone you respect"
          />
          <p className="text-caption text-text-dim text-right">
            {answer.length} / 200
          </p>
        </div>

        <p className="text-body-sm text-text-dim italic">
          There's no right answer — this is just for you.
        </p>
      </div>
    </OnboardingShell>
  )
}
