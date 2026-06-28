import { NavLink, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Calendar, CheckSquare, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="glass border-t border-white/10 px-2 py-2">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)

            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-[#7C3AED]/15 rounded-xl border border-[#7C3AED]/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors duration-200',
                    isActive ? 'text-[#7C3AED]' : 'text-white/40'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200',
                    isActive ? 'text-[#7C3AED]' : 'text-white/40'
                  )}
                >
                  {label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
