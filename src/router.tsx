import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'

// Screens
import { OnboardingRouter } from './screens/onboarding/OnboardingRouter'
import { Home }             from './screens/Home'
import { UrgeTimer }        from './screens/urge-timer/UrgeTimer'
import { SlipLog }          from './screens/slip-log/SlipLog'
import { WeeklyReview }     from './screens/weekly-review/WeeklyReview'
import { Identity }         from './screens/identity/Identity'
import { Train }            from './screens/train/Train'
import { Awareness }        from './screens/awareness/Awareness'
import { Settings }         from './screens/settings/Settings'
import { History }          from './screens/history/History'

function Root() {
  const onboardingComplete = useAppStore(s => s.onboardingComplete)
  return onboardingComplete
    ? <Navigate to="/home" replace />
    : <Navigate to="/onboarding" replace />
}

export const router = createBrowserRouter([
  { path: '/',          element: <Root /> },
  { path: '/onboarding/*', element: <OnboardingRouter /> },
  { path: '/home',      element: <Home /> },
  { path: '/urge',      element: <UrgeTimer /> },
  { path: '/slip',      element: <SlipLog /> },
  { path: '/review',    element: <WeeklyReview /> },
  { path: '/identity',  element: <Identity /> },
  { path: '/train',     element: <Train /> },
  { path: '/awareness', element: <Awareness /> },
  { path: '/settings',  element: <Settings /> },
  { path: '/history',   element: <History /> },
  { path: '*',          element: <Navigate to="/" replace /> },
])
