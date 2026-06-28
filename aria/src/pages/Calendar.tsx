import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Bell, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { ReminderCard } from '@/components/reminders/ReminderCard'
import { ReminderQuickAddModal } from '@/components/reminders/ReminderQuickAddModal'
import { subscribeToReminders, deleteReminder } from '@/lib/reminderService'
import { useAuthStore } from '@/store/authStore'
import type { Reminder } from '@/lib/types'
import type { Unsubscribe } from 'firebase/firestore'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}


export default function Calendar() {
  const { user } = useAuthStore()
  const today = new Date()

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const unsubRef = useRef<Unsubscribe | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    unsubRef.current = subscribeToReminders(
      user.uid,
      (r) => { setReminders(r); setLoading(false) },
      () => setLoading(false)
    )
    return () => { unsubRef.current?.() }
  }, [user])

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1) }
    else setCurrentMonth((m) => m - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1) }
    else setCurrentMonth((m) => m + 1)
  }

  // Days in current month grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const gridCells = firstDayOfMonth + daysInMonth
  const totalCells = Math.ceil(gridCells / 7) * 7

  // Precompute which days in this month have reminders
  const reminderDaySet = useMemo(() => {
    const set = new Set<string>()
    for (const r of reminders) {
      const d = new Date(r.scheduledAt)
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        set.add(`${d.getDate()}`)
      }
    }
    return set
  }, [reminders, currentYear, currentMonth])

  // Selected day's reminders
  const selectedDate = new Date(currentYear, currentMonth, selectedDay)
  const selectedReminders = reminders.filter((r) => sameDay(new Date(r.scheduledAt), selectedDate))

  // Next 7 days groups
  const next7Groups = useMemo(() => {
    const groups: Array<{ date: Date; items: Reminder[] }> = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const items = reminders.filter((r) => sameDay(new Date(r.scheduledAt), d))
      if (items.length > 0) {
        groups.push({ date: d, items })
      }
    }
    return groups
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders])

  const isCurrentMonthView =
    currentMonth === today.getMonth() && currentYear === today.getFullYear()

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] safe-top overflow-y-auto">
      <div className="px-4 pt-6 pb-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Calendar</h1>
          <button
            onClick={() => setShowModal(true)}
            className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Month navigator */}
        <div className="glass border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold text-white">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] text-white/30 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstDayOfMonth + 1
              const isValid = dayNum >= 1 && dayNum <= daysInMonth
              const isToday = isCurrentMonthView && isValid && dayNum === today.getDate()
              const isSelected = isValid && dayNum === selectedDay
              const hasReminder = isValid && reminderDaySet.has(`${dayNum}`)

              return (
                <button
                  key={i}
                  onClick={() => isValid && setSelectedDay(dayNum)}
                  disabled={!isValid}
                  className={`
                    relative h-9 w-full rounded-xl flex items-center justify-center text-xs transition-all
                    ${!isValid ? 'invisible' : ''}
                    ${isSelected ? 'bg-[#7C3AED] text-white font-semibold shadow-lg shadow-violet-500/30' : ''}
                    ${isToday && !isSelected ? 'bg-[#7C3AED]/20 text-[#9D6EF8] font-semibold' : ''}
                    ${!isSelected && !isToday ? 'text-white/60 hover:bg-white/5' : ''}
                  `}
                >
                  {isValid ? dayNum : ''}
                  {hasReminder && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#06B6D4]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day reminders */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-3.5 h-3.5 text-[#06B6D4]" />
            <p className="text-xs font-medium text-white/70">
              {sameDay(selectedDate, today) ? "Today's Reminders" : `${MONTHS[currentMonth].slice(0, 3)} ${selectedDay}`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : selectedReminders.length === 0 ? (
            <div className="glass border border-white/5 rounded-2xl px-4 py-6 text-center">
              <p className="text-xs text-white/30">No reminders for this day</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 text-[10px] text-[#06B6D4] hover:text-[#22D3EE] transition-colors"
              >
                + Add reminder
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedReminders.map((r) => (
                <ReminderCard key={r.id} reminder={r} onDelete={deleteReminder} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming 7 days */}
        {next7Groups.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-3">Next 7 Days</p>
            <div className="space-y-4">
              {next7Groups.map(({ date, items }) => {
                const isDateToday = sameDay(date, today)
                const label = isDateToday
                  ? 'Today'
                  : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                return (
                  <div key={date.toISOString()}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-semibold ${isDateToday ? 'text-[#06B6D4]' : 'text-white/40'}`}>
                        {label}
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="space-y-2">
                      {items.map((r) => (
                        <ReminderCard key={r.id} reminder={r} onDelete={deleteReminder} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* All-clear state */}
        {!loading && reminders.length === 0 && (
          <div className="glass border border-white/5 rounded-2xl px-4 py-10 text-center">
            <Bell className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No reminders yet</p>
            <p className="text-xs text-white/20 mt-1">Ask ARIA or tap + to add one</p>
          </div>
        )}
      </div>

      <ReminderQuickAddModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
