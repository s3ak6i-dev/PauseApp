import { Routes, Route, Navigate } from 'react-router-dom'
import { Welcome }  from './Welcome'
import { Stage1 }   from './Stage1'
import { Stage2 }   from './Stage2'
import { Stage3 }   from './Stage3'
import { Stage4 }   from './Stage4'
import { Stage5 }   from './Stage5'
import { Complete } from './Complete'

export function OnboardingRouter() {
  return (
    <div className="min-h-dvh bg-bg-base flex flex-col">
      <Routes>
        <Route index element={<Navigate to="welcome" replace />} />
        <Route path="welcome"  element={<Welcome />} />
        <Route path="stage1"   element={<Stage1 />} />
        <Route path="stage2"   element={<Stage2 />} />
        <Route path="stage3"   element={<Stage3 />} />
        <Route path="stage4"   element={<Stage4 />} />
        <Route path="stage5"   element={<Stage5 />} />
        <Route path="complete" element={<Complete />} />
      </Routes>
    </div>
  )
}
