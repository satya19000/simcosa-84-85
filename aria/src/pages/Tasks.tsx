import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, CheckSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskQuickAddModal } from '@/components/tasks/TaskQuickAddModal'
import { TaskEditModal } from '@/components/tasks/TaskEditModal'
import { subscribeToTasks, completeTask, deleteTask } from '@/lib/taskService'
import { useAuthStore } from '@/store/authStore'
import type { Task } from '@/lib/types'
import type { Unsubscribe } from 'firebase/firestore'

type FilterTab = 'all' | 'pending' | 'completed' | 'overdue' | 'high'

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'high', label: 'High Priority' },
  { value: 'completed', label: 'Completed' },
]

function isOverdue(task: Task): boolean {
  return !task.completed && !!task.dueAt && new Date(task.dueAt) < new Date()
}

function isHighPriority(task: Task): boolean {
  return task.priority === 'high' || task.priority === 'critical'
}

export default function Tasks() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('pending')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const unsubRef = useRef<Unsubscribe | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    unsubRef.current = subscribeToTasks(
      user.uid,
      (t) => { setTasks(t); setLoading(false) },
      () => setLoading(false)
    )
    return () => { unsubRef.current?.() }
  }, [user])

  const filtered = useMemo(() => {
    let list = tasks

    switch (activeTab) {
      case 'pending': list = tasks.filter((t) => !t.completed); break
      case 'completed': list = tasks.filter((t) => t.completed); break
      case 'overdue': list = tasks.filter(isOverdue); break
      case 'high': list = tasks.filter((t) => !t.completed && isHighPriority(t)); break
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q) ||
        (t.notes ?? '').toLowerCase().includes(q)
      )
    }

    return list
  }, [tasks, activeTab, search])

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter(isOverdue).length,
    high: tasks.filter((t) => !t.completed && isHighPriority(t)).length,
    completed: tasks.filter((t) => t.completed).length,
  }), [tasks])

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] safe-top overflow-y-auto">
      <div className="px-4 pt-6 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Tasks</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7C3AED]/50"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.value
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-white/5 text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className={`ml-1.5 ${activeTab === tab.value ? 'text-white/70' : 'text-white/30'}`}>
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass border border-white/5 rounded-2xl px-4 py-10 text-center"
          >
            <CheckSquare className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">
              {search ? 'No tasks match your search' : 'No tasks here'}
            </p>
            {activeTab === 'pending' && !search && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-[10px] text-[#7C3AED] hover:text-[#9D6EF8] transition-colors"
              >
                + Add task
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={completeTask}
                onDelete={deleteTask}
                onEdit={setEditingTask}
              />
            ))}
          </div>
        )}
      </div>

      <TaskQuickAddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <TaskEditModal task={editingTask} onClose={() => setEditingTask(null)} />
    </div>
  )
}
