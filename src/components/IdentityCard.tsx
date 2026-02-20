import { cn } from '../lib/utils'

interface IdentityCardProps {
  label: string
  values: string[]
  pauseScore?: number | null
  recoverySince?: number | null   // timestamp of last slip
  className?: string
  compact?: boolean
}

export function IdentityCard({
  label,
  values,
  pauseScore,
  recoverySince,
  className,
  compact = false,
}: IdentityCardProps) {
  const recoveryHours = recoverySince
    ? Math.floor((Date.now() - recoverySince) / 3600000)
    : null

  return (
    <div
      className={cn(
        'bg-bg-elevated rounded-xl2 p-6',
        'border-t-[3px] border-t-accent border-b border-x border-border-subtle/30',
        compact ? 'py-4' : '',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Spark icon + label */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-accent text-lg" aria-hidden="true">✦</span>
            <h2 className={cn(
              'font-sans font-normal text-text-heading truncate',
              compact ? 'text-h3' : 'text-h2'
            )}>
              {label}
            </h2>
          </div>

          {/* Values chips */}
          {values.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {values.map(v => (
                <span
                  key={v}
                  className="px-3 py-1 rounded-full text-caption bg-accent/20 text-accent-light border border-accent/30"
                >
                  {v}
                </span>
              ))}
            </div>
          )}

          {/* Recovery clock */}
          {recoveryHours !== null && (
            <p className="text-body-sm text-text-dim mt-1">
              Recovery: {recoveryHours < 1 ? 'just now' : `${recoveryHours}h ago`}
            </p>
          )}
        </div>

        {/* Pause Score */}
        {pauseScore !== undefined && (
          <div className="text-right shrink-0">
            <span className="block font-mono text-2xl text-accent-light leading-none">
              {pauseScore ?? '—'}
            </span>
            <span className="text-caption text-text-dim">score</span>
          </div>
        )}
      </div>
    </div>
  )
}
