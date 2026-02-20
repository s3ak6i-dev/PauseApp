import { cn } from '../../lib/utils'

const EMOJIS = ['😔', '😟', '😐', '😤', '😰']
const LABELS = ['Very mild', 'Mild', 'Moderate', 'Strong', 'Very strong']

interface EmojiScaleProps {
  value: number | null   // 1-5
  onChange: (v: number) => void
  className?: string
}

export function EmojiScale({ value, onChange, className }: EmojiScaleProps) {
  return (
    <div className={cn('flex gap-3 justify-center', className)} role="radiogroup">
      {EMOJIS.map((emoji, i) => {
        const score = i + 1
        const selected = value === score
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={LABELS[i]}
            onClick={() => onChange(score)}
            className={cn(
              'w-13 h-13 text-2xl rounded-full flex items-center justify-center',
              'transition-all duration-200 border-2 cursor-pointer',
              'w-[52px] h-[52px]',
              selected
                ? 'bg-accent border-accent scale-110'
                : 'bg-bg-card border-border-subtle hover:border-accent/50 hover:scale-105'
            )}
          >
            <span role="img" aria-hidden="true">{emoji}</span>
          </button>
        )
      })}
    </div>
  )
}
