import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { OnboardingShell } from './OnboardingShell'

export function Stage2() {
  const navigate   = useNavigate()
  const answers    = useAppStore(s => s.stage2Answers)
  const setStage2  = useAppStore(s => s.setStage2)

  const update = (i: number, val: string) => {
    const next = [...answers]
    next[i] = val
    setStage2(next)
  }

  return (
    <OnboardingShell
      step={2}
      onBack={() => navigate('/onboarding/stage1')}
      onNext={() => navigate('/onboarding/stage3')}
      skipRoute="/onboarding/stage3"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-h2 text-text-heading leading-snug mb-2">
            List 3 things you'd do differently if you were the version of yourself you want to be.
          </h2>
          <p className="text-body-sm text-text-dim italic">All optional.</p>
        </div>

        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-text-dim text-body-sm mt-3 w-5 shrink-0">{i + 1}.</span>
              <textarea
                value={answers[i]}
                onChange={e => update(i, e.target.value)}
                placeholder="I would..."
                rows={2}
                className={[
                  'flex-1 resize-none rounded-xl p-4 min-h-[80px]',
                  'bg-bg-card border border-border-subtle text-text-primary text-body',
                  'placeholder:text-text-dim placeholder:italic',
                  'focus:outline-none focus:border-accent focus:shadow-inner-focus',
                  'transition-all duration-200',
                ].join(' ')}
              />
            </div>
          ))}
        </div>
      </div>
    </OnboardingShell>
  )
}
