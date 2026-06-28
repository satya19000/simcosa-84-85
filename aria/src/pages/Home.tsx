import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, Bell, CheckSquare, Zap, Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { TaskCard } from '@/components/tasks/TaskCard'
import { ReminderCard } from '@/components/reminders/ReminderCard'
import { TaskQuickAddModal } from '@/components/tasks/TaskQuickAddModal'
import { TaskEditModal } from '@/components/tasks/TaskEditModal'
import { ReminderQuickAddModal } from '@/components/reminders/ReminderQuickAddModal'
import { ReminderEditModal } from '@/components/reminders/ReminderEditModal'
import { subscribeToTasks, completeTask, deleteTask } from '@/lib/taskService'
import { subscribeToReminders, deleteReminder } from '@/lib/reminderService'
import { subscribeToActivityLogs } from '@/lib/dashboardService'
import { useAuthStore } from '@/store/authStore'
import { getGreeting } from '@/lib/utils'
import type { Task, Reminder, ActivityLog } from '@/lib/types'
import type { Unsubscribe } from 'firebase/firestore'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
}

function isToday(isoString: string): boolean {
  const d = new Date(isoString)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function toolNameLabel(toolName: string): string {
  const labels: Record<string, string> = {
    createTask: 'Task created',
    createReminder: 'Reminder set',
    completeTask: 'Task completed',
    deleteTask: 'Task deleted',
    deleteReminder: 'Reminder deleted',
  }
  return labels[toolName] ?? toolName
}

export default function Home() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [remindersLoading, setRemindersLoading] = useState(true)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  const unsubTasksRef = useRef<Unsubscribe | null>(null)
  const unsubRemindersRef = useRef<Unsubscribe | null>(null)
  const unsubLogsRef = useRef<Unsubscribe | null>(null)

  useEffect(() => {
    if (!user) return

    setTasksLoading(true)
    unsubTasksRef.current = subscribeToTasks(
      user.uid,
      (t) => { setTasks(t); setTasksLoading(false) },
      () => setTasksLoading(false)
    )

    setRemindersLoading(true)
    unsubRemindersRef.current = subscribeToReminders(
      user.uid,
      (r) => { setReminders(r); setRemindersLoading(false) },
      () => setRemindersLoading(false)
    )

    unsubLogsRef.current = subscribeToActivityLogs(user.uid, 5, setLogs, () => setLogs([]))

    return () => {
      unsubTasksRef.current?.()
      unsubRemindersRef.current?.()
      unsubLogsRef.current?.()
    }
  }, [user])

  const pendingTasks = tasks.filter((t) => !t.completed)
  const todayReminders = reminders.filter((r) => isToday(r.scheduledAt))
  const upcomingReminders = reminders.filter(
    (r) => !isToday(r.scheduledAt) && new Date(r.scheduledAt) > new Date()
  )

  const now = new Date()
  const overdueTasks = pendingTasks.filter((t) => t.dueAt && new Date(t.dueAt) < now)
  const dueSoon = pendingTasks.filter((t) => {
    if (!t.dueAt) return false
    const d = new Date(t.dueAt)
    return d > now && d < new Date(now.getTime() + 2 * 60 * 60 * 1000)
  })
  const remindersInNext2h = reminders.filter((r) => {
    const d = new Date(r.scheduledAt)
    return d > now && d < new Date(now.getTime() + 2 * 60 * 60 * 1000)
  })
  const highPriorityPending = pendingTasks.filter(
    (t) => t.priority === 'high' || t.priority === 'critical'
  )

  function buildBriefing(): string {
    const parts: string[] = []
    if (overdueTasks.length > 0) {
      parts.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`)
    }
    if (dueSoon.length > 0) {
      parts.push(`${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} due in the next 2 hours`)
    }
    if (remindersInNext2h.length > 0) {
      parts.push(`${remindersInNext2h.length} reminder${remindersInNext2h.length > 1 ? 's' : ''} coming up soon`)
    }
    if (highPriorityPending.length > 0 && parts.length === 0) {
      parts.push(`${highPriorityPending.length} high-priority task${highPriorityPending.length > 1 ? 's' : ''} pending`)
    }
    if (parts.length === 0) return ''
    if (parts.length === 1) return `You have ${parts[0]}.`
    const last = parts.pop()
    return `You have ${parts.join(', ')} and ${last}.`
  }

  const briefing = buildBriefing()

  return (
    <div className="px-4 pt-6 pb-8 space-y-6 safe-top overflow-y-auto h-[calc(100vh-96px)]">
      {/* Greeting */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">{firstName} 👋</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-violet-500/30">
          <span className="text-white text-sm font-bold">{firstName.charAt(0).toUpperCase()}</span>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
        <Card glow="violet" className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-xs text-white/50">Pending</span>
          </div>
          {tasksLoading ? (
            <Skeleton className="h-7 w-10 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-white">{pendingTasks.length}</p>
          )}
          <p className="text-[10px] text-white/30 mt-0.5">tasks</p>
        </Card>

        <Card glow="cyan" className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-[#06B6D4]" />
            <span className="text-xs text-white/50">Today</span>
          </div>
          {remindersLoading ? (
            <Skeleton className="h-7 w-10 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-white">{todayReminders.length}</p>
          )}
          <p className="text-[10px] text-white/30 mt-0.5">reminders</p>
        </Card>
      </motion.div>

      {/* Secretary briefing */}
      {!tasksLoading && !remindersLoading && briefing && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="px-4 py-3 border-l-2 border-l-[#7C3AED]">
            <p className="text-xs text-white/70 leading-relaxed">{briefing}</p>
          </Card>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: MessageSquare, label: 'Ask ARIA', color: 'from-[#7C3AED] to-[#5B21B6]', onClick: () => navigate('/chat') },
            { icon: Plus, label: 'Add Task', color: 'from-[#7C3AED]/30 to-[#7C3AED]/10', onClick: () => setShowTaskModal(true) },
            { icon: Bell, label: 'Remind Me', color: 'from-[#06B6D4]/30 to-[#06B6D4]/10', onClick: () => setShowReminderModal(true) },
          ].map(({ icon: Icon, label, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-br ${color} border border-white/10 active:scale-95 transition-transform`}
            >
              <Icon className="w-5 h-5 text-white" />
              <span className="text-[10px] text-white/80 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Today's reminders */}
      {(todayReminders.length > 0 || remindersLoading) && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Today's Reminders</p>
            {todayReminders.length > 3 && (
              <button onClick={() => navigate('/calendar')} className="text-[10px] text-[#06B6D4]">
                View all →
              </button>
            )}
          </div>
          {remindersLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {todayReminders.slice(0, 3).map((r) => (
                <ReminderCard key={r.id} reminder={r} onDelete={deleteReminder} onEdit={setEditingReminder} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Upcoming teaser when no today reminders */}
      {!remindersLoading && todayReminders.length === 0 && upcomingReminders.length > 0 && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-3">Upcoming</p>
          <ReminderCard reminder={upcomingReminders[0]} onDelete={deleteReminder} onEdit={setEditingReminder} />
          {upcomingReminders.length > 1 && (
            <button
              onClick={() => navigate('/calendar')}
              className="mt-2 text-[10px] text-[#06B6D4] block text-center w-full"
            >
              +{upcomingReminders.length - 1} more upcoming →
            </button>
          )}
        </motion.div>
      )}

      {/* Pending tasks */}
      {(pendingTasks.length > 0 || tasksLoading) && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Pending Tasks</p>
            {pendingTasks.length > 3 && (
              <span className="text-[10px] text-white/30">+{pendingTasks.length - 3} more</span>
            )}
          </div>
          {tasksLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.slice(0, 3).map((t) => (
                <TaskCard key={t.id} task={t} onComplete={completeTask} onDelete={deleteTask} onEdit={setEditingTask} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Recent activity */}
      {logs.length > 0 && (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-3 h-3 text-white/30" />
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Recent Activity</p>
          </div>
          <Card className="divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className={log.success ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                  {log.success ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 truncate">{toolNameLabel(log.toolName)}</p>
                  <p className="text-[10px] text-white/30">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!log.success && <Zap className="w-3 h-3 text-red-400 flex-shrink-0" />}
              </div>
            ))}
          </Card>
        </motion.div>
      )}

      {/* All-clear empty state */}
      {!tasksLoading && !remindersLoading && pendingTasks.length === 0 && reminders.length === 0 && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="text-center py-10">
            <p className="text-3xl mb-3">✦</p>
            <p className="text-sm font-medium text-white mb-1">Your slate is clean</p>
            <p className="text-xs text-white/40">Ask ARIA to set tasks or reminders for you.</p>
            <button
              onClick={() => navigate('/chat')}
              className="mt-4 text-xs text-[#7C3AED] hover:text-[#9D6EF8] transition-colors"
            >
              Open Chat →
            </button>
          </Card>
        </motion.div>
      )}

      <TaskQuickAddModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />
      <ReminderQuickAddModal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} />
      <TaskEditModal task={editingTask} onClose={() => setEditingTask(null)} />
      <ReminderEditModal reminder={editingReminder} onClose={() => setEditingReminder(null)} />
    </div>
  )
}
