import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { AriaOrb } from '@/components/aria/AriaOrb'

export function AppShell() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#0A0E27] max-w-lg mx-auto">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden max-w-lg mx-auto">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#7C3AED]/10 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 rounded-full bg-[#06B6D4]/8 blur-3xl" />
        <div className="absolute -bottom-32 right-8 w-72 h-72 rounded-full bg-[#7C3AED]/8 blur-3xl" />
      </div>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24 safe-top relative z-10">
        <Outlet />
      </main>

      <BottomNav />
      <AriaOrb />
    </div>
  )
}
