import { motion } from 'framer-motion'
import { Bell, Mic, Plus, Clock, Calendar, FileText, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { getGreeting, formatDate } from '@/lib/utils'

const quickActions = [
  { icon: Mic, label: 'Voice', color: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/10' },
  { icon: Plus, label: 'Task', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10' },
  { icon: Bell, label: 'Remind', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { icon: FileText, label: 'Note', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
]

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Home() {
  const { user } = useAuthStore()
  const firstName = user?.displayName?.split(' ')[0] ?? 'there'
  const greeting = getGreeting()
  const today = formatDate(new Date())

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="px-4 pt-6 pb-4 space-y-5"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-sm">{today}</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            {greeting}, {firstName} 👋
          </h1>
        </div>
        <button className="relative w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-white/60" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#7C3AED] rounded-full" />
        </button>
      </motion.div>

      {/* ARIA Orb Hero */}
      <motion.div variants={fadeUp}>
        <Card glow="violet" className="flex items-center gap-4 p-5">
          <div className="relative flex-shrink-0">
            <motion.div
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center"
              animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,0.4)', '0 0 0 16px rgba(124,58,237,0)', '0 0 0 0 rgba(124,58,237,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <span className="text-2xl">✦</span>
            </motion.div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#7C3AED] text-xs font-semibold uppercase tracking-wider mb-1">ARIA</p>
            <p className="text-white text-sm leading-snug">
              Good to see you! I'm ready to help you conquer today. Ask me anything.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map(({ icon: Icon, label, color, bg }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs text-white/60">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Today's Briefing */}
      <motion.div variants={fadeUp}>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Today's Briefing</h2>
        <Card glow="cyan" className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">3 meetings today</p>
              <p className="text-white/40 text-xs">Next: Team Standup at 10:00 AM</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">5 tasks pending</p>
              <p className="text-white/40 text-xs">2 are high priority</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">ARIA Insight</p>
              <p className="text-white/40 text-xs">You haven't called Rahul in 7 days</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Upcoming Reminders Placeholder */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Reminders</h2>
          <Button variant="ghost" size="sm" className="text-xs text-[#7C3AED] px-2">See all</Button>
        </div>
        <div className="space-y-2">
          {['Review project proposal', 'Call insurance agent', 'Gym session'].map((task, i) => (
            <div key={task} className="flex items-center gap-3 glass border border-white/10 rounded-xl p-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-red-400' : i === 1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-sm text-white/80">{task}</span>
              <span className="ml-auto text-xs text-white/30">{i === 0 ? '10:00 AM' : i === 1 ? '2:00 PM' : '6:00 PM'}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
