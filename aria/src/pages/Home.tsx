import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, Bell, CheckSquare, Zap, Activity, Users, Sparkles, Volume2, Square } from 'lucide-react'
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
import { generateDailyBriefing, subscribeLatestBriefing } from '@/lib/briefingService'
import { voiceManager } from '@/lib/voice/VoiceManager'
import { useAuthStore } from '@/store/authStore'
import { getGreeting } from '@/lib/utils'
import type { Task, Reminder, ActivityLog, Briefing } from '@/lib/types'
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
    updateTask: 'Task updated',
    updateReminder: 'Reminder updated',
    createContact: 'Contact saved',
    updateContact: 'Contact updated',
    deleteContact: 'Contact deleted',
    addRelationshipNote: 'Note added',
    searchContacts: 'Contacts searched',
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
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const unsubTasksRef = useRef<Unsubscribe | null>(null)
  const unsubRemindersRef = useRef<Unsubscribe | null>(null)
  const unsubLogsRef = useRef<Unsubscribe | null>(null)
  const unsubBriefingRef = useRef<Unsubscribe | null>(null)

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

    unsubBriefingRef.current = subscribeLatestBriefing(user.uid, setBriefing)

    return () => {
      unsubTasksRef.current?.()
      unsubRemindersRef.current?.()
      unsubLogsRef.current?.()
      unsubBriefingRef.current?.()
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

  function buildLocalBriefing(): string {
    const parts: string[] = []
    if (overdueTasks.length > 0) parts.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`)
    if (dueSoon.length > 0) parts.push(`${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} due in 2h`)
    if (remindersInNext2h.length > 0) parts.push(`${remindersInNext2h.length} reminder${remindersInNext2h.length > 1 ? 's' : ''} coming up`)
    if (highPriorityPending.length > 0 && parts.length === 0) parts.push(`${highPriorityPending.length} high-priority pending`)
    if (parts.length === 0) return ''
    if (parts.length === 1) return `You have ${parts[0]}.`
    const last = parts.pop()
    return `You have ${parts.join(', ')} and ${last}.`
  }

  const localBriefing = buildLocalBriefing()

  async function handleGenerateBriefing() {
    setBriefingLoading(true)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      await generateDailyBriefing(tz)
    } catch {
      // Briefing will update via subscription when ready
    } finally {
      setBriefingLoading(false)
    }
  }

  function handleSpeakBriefing() {
    if (!briefing || !voiceManager.isSupported()) return
    if (speaking) {
      voiceManager.stop()
      setSpeaking(false)
      return
    }
    const text = [briefing.summary, ...briefing.sections.map((s) => `${s.heading}. ${s.body}`)].join('. ')
    setSpeaking(true)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = parseFloat(localStorage.getItem('aria_speech_rate') ?? '1')
    utterance.pitch = parseFloat(localStorage.getItem('aria_speech_pitch') ?? '1')
    const voiceName = localStorage.getItem('aria_browser_voice') ?? ''
    if (voiceName) {
      const voices = speechSynthesis.getVoices()
      const match = voices.find((v) => v.name === voiceName)
      if (match) utterance.voice = match
    }
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }

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

      {/* Local urgency alert */}
      {!tasksLoading && !remindersLoading && localBriefing && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="px-4 py-3 border-l-2 border-l-[#7C3AED]">
            <p className="text-xs text-white/70 leading-relaxed">{localBriefing}</p>
          </Card>
        </motion.div>
      )}

      {/* AI briefing card */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
        <div className="space-y-2">
          {briefing ? (
            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] flex-shrink-0" />
                  <p className="text-xs font-semibold text-white/80">ARIA's Briefing</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {voiceManager.isSupported() && (
                    <button
                      onClick={handleSpeakBriefing}
                      className={`p-1.5 rounded-lg border transition-all ${speaking ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#7C3AED]' : 'border-white/10 text-white/30 hover:text-white/50'}`}
                      aria-label="Speak briefing"
                    >
                      {speaking ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                  )}
                  <button
                    onClick={handleGenerateBriefing}
                    disabled={briefingLoading}
                    className="text-[10px] text-[#06B6D4] hover:text-[#22D3EE] disabled:opacity-40 transition-colors"
                  >
                    {briefingLoading ? '…' : 'Refresh'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">{briefing.summary}</p>
              {briefing.sections.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                  {briefing.sections.map((s, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{s.heading}</p>
                      <p className="text-xs text-white/60 leading-relaxed mt-0.5">{s.body}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-white/20">
                {new Date(briefing.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </Card>
          ) : (
            <button
              onClick={handleGenerateBriefing}
              disabled={briefingLoading}
              className="w-full flex items-center gap-3 glass border border-dashed border-white/10 rounded-2xl px-4 py-3.5 hover:border-white/20 transition-colors text-left disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70">{briefingLoading ? 'Generating briefing…' : 'Generate Today\'s Briefing'}</p>
                <p className="text-xs text-white/30">Get an AI-powered summary of your day</p>
              </div>
            </button>
          )}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: MessageSquare, label: 'Ask ARIA', color: 'from-[#7C3AED] to-[#5B21B6]', onClick: () => navigate('/chat') },
            { icon: Plus, label: 'Add Task', color: 'from-[#7C3AED]/30 to-[#7C3AED]/10', onClick: () => setShowTaskModal(true) },
            { icon: Bell, label: 'Remind Me', color: 'from-[#06B6D4]/30 to-[#06B6D4]/10', onClick: () => setShowReminderModal(true) },
            { icon: Users, label: 'Contacts', color: 'from-emerald-500/30 to-emerald-500/10', onClick: () => navigate('/contacts') },
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
