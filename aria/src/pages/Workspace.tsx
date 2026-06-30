import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ListTodo, Megaphone, Rocket } from 'lucide-react'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ActivityFeed } from '@/components/organization/ActivityFeed'
import {
  getWorkspace, listSharedTasks, listSharedMissions, listActivity, delegateTask, postAnnouncement,
  type WorkspaceRecord, type SharedTaskRecord, type SharedMissionRecord, type ActivityRecord,
} from '@/lib/organizationService'

type Tab = 'tasks' | 'missions' | 'activity'

const STATUS_COLOR: Record<string, string> = {
  open: 'text-white/50',
  in_progress: 'text-[#06B6D4]',
  blocked: 'text-amber-400',
  completed: 'text-emerald-400',
  cancelled: 'text-white/30',
}

export default function Workspace() {
  const { organizationId, workspaceId } = useParams<{ organizationId: string; workspaceId: string }>()
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null)
  const [tasks, setTasks] = useState<SharedTaskRecord[]>([])
  const [missions, setMissions] = useState<SharedMissionRecord[]>([])
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [tab, setTab] = useState<Tab>('tasks')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAddTask, setShowAddTask] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskBusy, setTaskBusy] = useState(false)

  const [showAnnounce, setShowAnnounce] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annBody, setAnnBody] = useState('')
  const [annBusy, setAnnBusy] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId || !workspaceId) return
    const [ws, t, m, a] = await Promise.all([
      getWorkspace(organizationId, workspaceId),
      listSharedTasks(organizationId, workspaceId),
      listSharedMissions(organizationId, workspaceId),
      listActivity(organizationId, workspaceId).catch(() => []),
    ])
    setWorkspace(ws)
    setTasks(t)
    setMissions(m)
    setActivity(a)
  }, [organizationId, workspaceId])

  useEffect(() => {
    setLoading(true)
    setError('')
    load()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [load])

  async function handleAddTask() {
    if (!organizationId || !workspaceId || !taskTitle.trim()) return
    setTaskBusy(true)
    try {
      await delegateTask(organizationId, workspaceId, taskTitle.trim())
      setTaskTitle('')
      setShowAddTask(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delegate task')
    } finally {
      setTaskBusy(false)
    }
  }

  async function handlePostAnnouncement() {
    if (!organizationId || !workspaceId || !annTitle.trim() || !annBody.trim()) return
    setAnnBusy(true)
    try {
      await postAnnouncement(organizationId, annTitle.trim(), annBody.trim(), workspaceId)
      setAnnTitle(''); setAnnBody('')
      setShowAnnounce(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post announcement')
    } finally {
      setAnnBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error && !workspace) {
    return <ErrorState message={error} onRetry={() => void load()} />
  }

  if (!workspace) {
    return (
      <EmptyState
        icon={ListTodo}
        title="Workspace not found"
        description="You may not have access to this workspace."
        action={{ label: 'Back to Organization', onClick: () => navigate(`/organization/${organizationId}`) }}
      />
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <button
        onClick={() => navigate(`/organization/${organizationId}`)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Organization
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white truncate">{workspace.name}</h1>
        {workspace.description && <p className="text-sm text-white/50 mt-1">{workspace.description}</p>}
      </div>

      <div className="flex gap-2">
        {(['tasks', 'missions', 'activity'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30' : 'bg-white/5 text-white/50 border border-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div className="space-y-3">
          {!showAddTask ? (
            <Button size="sm" variant="secondary" onClick={() => setShowAddTask(true)} className="w-full">
              <Plus className="w-4 h-4" /> Delegate Task
            </Button>
          ) : (
            <Card className="space-y-3">
              <Input
                label="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Prepare quarterly report"
              />
              <div className="flex gap-2">
                <Button size="sm" loading={taskBusy} onClick={() => void handleAddTask()} className="flex-1">
                  Delegate
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddTask(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          {tasks.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">No shared tasks yet</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.taskId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <ListTodo className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{task.title}</p>
                    <p className={`text-xs capitalize ${STATUS_COLOR[task.status] ?? 'text-white/40'}`}>
                      {task.status.replace('_', ' ')}
                      {task.approvalRequestId ? ' · pending approval' : ''}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'missions' && (
        <div className="space-y-2">
          {missions.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">No shared missions yet</p>
          ) : (
            missions.map((m) => (
              <Card key={m.missionId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">Mission {m.underlyingMissionId}</p>
                  <p className="text-xs text-white/40 capitalize">{m.status} · {m.assignedMemberIds.length} assigned</p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-3">
          {!showAnnounce ? (
            <Button size="sm" variant="secondary" onClick={() => setShowAnnounce(true)} className="w-full">
              <Megaphone className="w-4 h-4" /> Post Announcement
            </Button>
          ) : (
            <Card className="space-y-3">
              <Input label="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Team update" />
              <Input label="Body" value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="What's the announcement?" />
              <div className="flex gap-2">
                <Button size="sm" loading={annBusy} onClick={() => void handlePostAnnouncement()} className="flex-1">
                  Post
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAnnounce(false)}>Cancel</Button>
              </div>
            </Card>
          )}
          <ActivityFeed activity={activity} />
        </div>
      )}
    </div>
  )
}
