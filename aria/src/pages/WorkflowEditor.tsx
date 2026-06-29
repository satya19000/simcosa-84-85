import { useState, useEffect, useCallback } from 'react'
import {
  Zap, Play, RefreshCw, CheckCircle2, XCircle, Clock, ChevronDown,
  ChevronUp, ToggleLeft, ToggleRight, History, Calendar
} from 'lucide-react'
import {
  listWorkflows,
  runWorkflow,
  getWorkflowHistory,
  setWorkflowEnabled,
} from '@/lib/workflowService'
import type { WorkflowSummary, WorkflowRunResult } from '@/lib/workflowService'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'text-emerald-400',
    failed: 'text-red-400',
    cancelled: 'text-yellow-400',
    running: 'text-cyan-400',
    pending: 'text-slate-400',
    paused: 'text-violet-400',
  }
  return <span className={`text-xs font-mono ${map[status] ?? 'text-slate-400'}`}>{status.toUpperCase()}</span>
}

function TriggerBadge({ trigger }: { trigger: { type: string; cron?: string } }) {
  const label = trigger.type === 'scheduled' && trigger.cron
    ? `${trigger.type} (${trigger.cron})`
    : trigger.type
  return (
    <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
      {label}
    </span>
  )
}

function WorkflowCard({
  workflow,
  onRun,
  onToggle,
  onHistory,
  running,
}: {
  workflow: WorkflowSummary
  onRun: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onHistory: (id: string) => void
  running: boolean
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{workflow.name}</h3>
          <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{workflow.description}</p>
        </div>
        <button
          onClick={() => onToggle(workflow.id, !workflow.enabled)}
          className="shrink-0 mt-0.5"
          title={workflow.enabled ? 'Disable' : 'Enable'}
        >
          {workflow.enabled
            ? <ToggleRight size={22} className="text-emerald-400" />
            : <ToggleLeft size={22} className="text-slate-500" />}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <TriggerBadge trigger={workflow.trigger} />
        <span className="text-xs text-slate-500">{workflow.stepCount} steps</span>
        {workflow.tags.map((t) => (
          <span key={t} className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onRun(workflow.id)}
          disabled={running || !workflow.enabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900/40 disabled:text-violet-700 text-white text-xs rounded-lg transition font-medium"
        >
          {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
          Run now
        </button>
        <button
          onClick={() => onHistory(workflow.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs rounded-lg transition"
        >
          <History size={12} />
          History
        </button>
      </div>
    </div>
  )
}

function ExecutionCard({ result }: { result: WorkflowRunResult }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white/5 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <StatusBadge status={result.status} />
            <span className="text-slate-400 text-xs">{result.durationMs}ms</span>
          </div>
          <p className="text-slate-500 text-xs">{new Date(result.startedAt).toLocaleString()}</p>
        </div>
        <button onClick={() => setExpanded((e) => !e)} className="text-slate-400 hover:text-white">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {result.error && (
        <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-2">{result.error}</p>
      )}

      {expanded && result.stepResults.length > 0 && (
        <div className="space-y-1 pt-1">
          {result.stepResults.map((s) => (
            <div key={s.stepId} className="flex items-center gap-2 text-xs">
              {s.status === 'completed'
                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                : s.status === 'failed'
                ? <XCircle size={12} className="text-red-400 shrink-0" />
                : <Clock size={12} className="text-slate-400 shrink-0" />}
              <span className="text-slate-300 truncate">{s.stepName}</span>
              <span className="text-slate-500 ml-auto shrink-0">{s.durationMs}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkflowEditor() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [history, setHistory] = useState<WorkflowRunResult[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<WorkflowRunResult | null>(null)

  const loadWorkflows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listWorkflows()
      setWorkflows(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadWorkflows() }, [loadWorkflows])

  const handleRun = async (id: string) => {
    setRunningId(id)
    setError(null)
    setLastRun(null)
    try {
      const result = await runWorkflow(id)
      setLastRun(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed')
    } finally {
      setRunningId(null)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await setWorkflowEnabled(id, enabled)
      setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, enabled } : w))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleHistory = async (id: string) => {
    setSelectedWorkflowId(id)
    setHistoryLoading(true)
    try {
      const h = await getWorkflowHistory(id, 10)
      setHistory(h)
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId)

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            Workflow Engine
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Developer mode — manage automated workflows</p>
        </div>
        <button
          onClick={loadWorkflows}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {lastRun && (
        <div className={`rounded-xl p-4 mb-4 text-sm border ${lastRun.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <div className="flex items-center gap-2">
            {lastRun.status === 'completed' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            Workflow {lastRun.status} in {lastRun.durationMs}ms ({lastRun.stepResults.length} steps)
          </div>
          {lastRun.error && <p className="mt-1 text-xs opacity-80">{lastRun.error}</p>}
        </div>
      )}

      {/* Summary */}
      {workflows.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{workflows.length}</div>
            <div className="text-slate-400 text-xs">Total</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{workflows.filter((w) => w.enabled).length}</div>
            <div className="text-slate-400 text-xs">Enabled</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-violet-400">{workflows.filter((w) => w.trigger.type === 'scheduled').length}</div>
            <div className="text-slate-400 text-xs">Scheduled</div>
          </div>
        </div>
      )}

      {/* Workflow list */}
      <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <Calendar size={14} className="text-cyan-400" />
        Installed Workflows
      </h2>
      <div className="space-y-3 mb-8">
        {loading && <div className="text-slate-400 text-sm text-center py-8">Loading…</div>}
        {!loading && workflows.length === 0 && (
          <div className="text-slate-400 text-sm text-center py-8">No workflows found.</div>
        )}
        {workflows.map((w) => (
          <WorkflowCard
            key={w.id}
            workflow={w}
            onRun={handleRun}
            onToggle={handleToggle}
            onHistory={handleHistory}
            running={runningId === w.id}
          />
        ))}
      </div>

      {/* Execution history panel */}
      {selectedWorkflowId && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <History size={14} className="text-violet-400" />
            History — {selectedWorkflow?.name ?? selectedWorkflowId}
          </h2>
          {historyLoading && <div className="text-slate-400 text-sm text-center py-4">Loading…</div>}
          {!historyLoading && history.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-4">No executions yet.</div>
          )}
          <div className="space-y-3">
            {history.map((r) => (
              <ExecutionCard key={r.executionId} result={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
