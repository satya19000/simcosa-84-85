import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateReminder } from '@/lib/reminderService'
import type { Reminder, ReminderRecurrence } from '@/lib/types'

const RECURRENCES: { value: ReminderRecurrence; label: string }[] = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

interface ReminderEditModalProps {
  reminder: Reminder | null
  onClose: () => void
}

function toLocalDatetime(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ReminderEditModal({ reminder, onClose }: ReminderEditModalProps) {
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>('none')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title)
      setScheduledAt(toLocalDatetime(reminder.scheduledAt))
      setRecurrence(reminder.recurrence)
      setNotes(reminder.notes ?? '')
      setError(null)
    }
  }, [reminder])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reminder || !title.trim() || !scheduledAt) return
    setLoading(true)
    setError(null)
    try {
      await updateReminder({
        reminderId: reminder.id,
        title: title.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        recurrence,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {reminder && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-x-4 bottom-0 mb-6 z-50 glass border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#06B6D4]" />
                Edit Reminder
              </h2>
              <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</div>
              )}

              <Input
                placeholder="Reminder title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />

              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-[#06B6D4]/50 [color-scheme:dark]"
              />

              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as ReminderRecurrence)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#06B6D4]/50"
              >
                {RECURRENCES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#0A0E27]">{r.label}</option>
                ))}
              </select>

              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Button
                type="submit"
                variant="secondary"
                loading={loading}
                disabled={!title.trim() || !scheduledAt || loading}
                className="w-full"
              >
                Save Changes
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
