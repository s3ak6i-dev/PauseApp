import { NavLink, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Dumbbell, Calendar, User, Settings, Circle, History } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/home',     icon: Home,      label: 'Home'     },
  { to: '/identity', icon: User,      label: 'Identity' },
  { to: '/train',    icon: Dumbbell,  label: 'Train'    },
  { to: '/review',   icon: Calendar,  label: 'Review'   },
  { to: '/awareness',icon: BookOpen,  label: 'Awareness'},
  { to: '/history',  icon: History,   label: 'History'  },
]

export function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 bg-bg-base border-r border-border-subtle/30 shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border-subtle/20">
        <span className="text-h3 font-sans font-light text-text-heading tracking-widest uppercase">
          Pause
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-3 rounded-xl text-body',
              'transition-all duration-200 group',
              isActive
                ? 'bg-accent/10 text-accent-light border-l-[3px] border-accent pl-[9px]'
                : 'text-text-dim hover:text-text-primary hover:bg-bg-elevated'
            )}
          >
            <Icon size={18} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Settings + Ride the Urge CTA */}
      <div className="px-3 pb-6 space-y-3 border-t border-border-subtle/20 pt-4">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl text-body-sm',
            'transition-all duration-200',
            isActive ? 'text-accent-light' : 'text-text-dim hover:text-text-primary'
          )}
        >
          <Settings size={16} strokeWidth={1.5} />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={() => navigate('/urge')}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
            'bg-accent text-white text-body font-medium',
            'shadow-accent-btn hover:bg-accent-dark transition-all duration-200',
            'cursor-pointer'
          )}
        >
          <Circle size={16} strokeWidth={2} />
          Ride the Urge
        </button>
      </div>
    </aside>
  )
}
