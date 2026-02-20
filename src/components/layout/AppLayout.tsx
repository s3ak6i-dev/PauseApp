import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
  hasReview?: boolean
}

export function AppLayout({ children, hasReview }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-bg-base">
      <Sidebar />

      {/* Main scrollable content */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      <BottomNav hasReview={hasReview} />
    </div>
  )
}
