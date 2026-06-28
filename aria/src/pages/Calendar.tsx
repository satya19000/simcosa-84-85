import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Video, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const mockEvents = [
  { id: '1', title: 'Team Standup', time: '10:00 AM', duration: '30 min', type: 'video', attendees: 4, color: 'bg-[#7C3AED]' },
  { id: '2', title: 'Product Review', time: '2:00 PM', duration: '1 hr', type: 'video', attendees: 8, color: 'bg-[#06B6D4]' },
  { id: '3', title: 'Client Call — Rahul', time: '4:30 PM', duration: '45 min', type: 'call', attendees: 2, color: 'bg-amber-500' },
]

export default function Calendar() {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [selectedDay, setSelectedDay] = useState(now.getDate())

  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <Button size="sm">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {/* Month picker */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <span className="text-white font-semibold">{MONTHS[currentMonth]} {currentYear}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] text-white/30 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()
            const isSelected = day === selectedDay
            const hasEvent = [1, 5, 10, 15, 20].includes(day)

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center justify-center h-9 rounded-xl text-sm transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#7C3AED] text-white'
                    : isToday
                    ? 'bg-[#7C3AED]/20 text-[#7C3AED] font-semibold'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                {day}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#06B6D4]" />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Events for selected day */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Events — {MONTHS[currentMonth]} {selectedDay}
        </h2>
        {mockEvents.length > 0 ? (
          <div className="space-y-3">
            {mockEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="flex items-center gap-3">
                  <div className={`w-1 h-12 rounded-full flex-shrink-0 ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{event.title}</p>
                    <p className="text-xs text-white/40">{event.time} · {event.duration} · {event.attendees} attendees</p>
                  </div>
                  <div className="flex-shrink-0">
                    {event.type === 'video'
                      ? <Video className="w-4 h-4 text-white/30" />
                      : <MapPin className="w-4 h-4 text-white/30" />
                    }
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Plus}
            title="No events today"
            description="Add an event or sync your Google Calendar"
            action={{ label: 'Add Event', onClick: () => {} }}
          />
        )}
      </div>
    </div>
  )
}
