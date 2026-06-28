import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateTask } from '@/lib/taskService'
import type { Task, TaskPriority } from '@/lib/types'

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

interface TaskEditModalProps {
  task: Task | null
  onClose: () => void
}

function toLocalDatetime(isoString: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TaskEditModal({ task, onClose }: TaskEditModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueAt, setDueAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setCategory(task.category ?? '')
      setPriority(task.priority)
      setDueAt(toLocalDatetime(task.dueAt))
      setNotes(task.notes ?? '')
      setError(null)
    }
  }, [task])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !title.trim()) return
    setLoading(true)
    setError(null)
    try {
      await updateTask({
        taskId: task.id,
        title: title.trim(),
        category: category.trim() || null,
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {task && (
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
                <CheckSquare className="w-4 h-4 text-[#7C3AED]" />
                Edit Task
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
                placeholder="Task title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />

              <Input
                placeholder="Category (optional)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#7C3AED]/50"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#0A0E27]">{p.label}</option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-[#7C3AED]/50 [color-scheme:dark]"
              />

              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!title.trim() || loading}
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
