import { type ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/LoadingSkeleton'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [setUser, setLoading])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0A0E27]">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center animate-pulse">
          <span className="text-3xl">✦</span>
        </div>
        <div className="space-y-2 w-48">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-3/4 mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
