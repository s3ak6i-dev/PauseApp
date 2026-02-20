import { NavLink, useNavigate } from 'react-router-dom'
import { Home, User, Dumbbell, Calendar, BookOpen, Circle } from 'lucide-react'
import { cn } from '../../lib/utils'

const TABS = [
  { to: '/home',     icon: Home,      label: 'Home'     },
  { to: '/identity', icon: User,      label: 'Identity' },
  { to: '/train',    icon: Dumbbell,  label: 'Train'    },
  { to: '/review',   icon: Calendar,  label: 'Review'   },
  { to: '/awareness',icon: BookOpen,  label: 'Awareness'},
]

export function BottomNav({ hasReview = false }: { hasReview?: boolean }) {
  const navigate = useNavigate()

  return (
    <>
      {/* Bottom tab bar — mobile / tablet */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-base/95 backdrop-blur border-t border-border-subtle/30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Tab navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {TABS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[48px]',
                'transition-all duration-200 relative',
                isActive ? 'text-accent-light' : 'text-text-dim'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="text-[10px] leading-tight">{label}</span>
                  {/* Review ready dot */}
                  {label === 'Review' && hasReview && !isActive && (
                    <span className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-accent" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Floating Ride the Urge button — mobile */}
      <button
        onClick={() => navigate('/urge')}
        className={cn(
          'lg:hidden fixed right-4 z-40 w-14 h-14 rounded-full',
          'bg-accent shadow-accent-btn flex items-center justify-center',
          'text-white hover:bg-accent-dark active:scale-95',
          'transition-all duration-200 cursor-pointer',
          'bottom-[calc(4rem+env(safe-area-inset-bottom)+8px)]'
        )}
        aria-label="Ride the Urge"
        title="Ride the Urge"
      >
        <Circle size={22} strokeWidth={2} />
      </button>
    </>
  )
}
