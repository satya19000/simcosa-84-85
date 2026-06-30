import { useState, useEffect } from 'react'
import {
  listMissions,
  getMissionStats,
  listMissionRecommendations,
  getMissionLearningSnapshots,
  listMissionHistory,
  createMission,
  activateMission,
  pauseMission,
  abandonMission,
  acceptMissionRecommendation,
  dismissMissionRecommendation,
  runMissionPlanningCycle,
  type Mission,
  type MissionStats,
  type MissionRecommendation,
  type LearningSnapshot,
  type MissionHistoryEntry,
  type MissionDomain,
  type MissionPriority,
} from '../../lib/missionControlService'

const DOMAINS: MissionDomain[] = ['finance', 'health', 'delegation', 'communication', 'general']
const PRIORITIES: MissionPriority[] = ['low', 'medium', 'high', 'critical']

export default function MissionControlDashboard() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [stats, setStats] = useState<MissionStats | null>(null)
  const [recommendations, setRecommendations] = useState<MissionRecommendation[]>([])
  const [learning, setLearning] = useState<LearningSnapshot[]>([])
  const [history, setHistory] = useState<MissionHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [planningRunning, setPlanningRunning] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDomain, setNewDomain] = useState<MissionDomain>('general')
  const [newPriority, setNewPriority] = useState<MissionPriority>('medium')

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [m, s, r, l, h] = await Promise.all([
        listMissions(),
        getMissionStats(),
        listMissionRecommendations(),
        getMissionLearningSnapshots(),
        listMissionHistory(),
      ])
      setMissions(m)
      setStats(s)
      setRecommendations(r)
      setLearning(l)
      setHistory(h)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setBusyId('create')
    try {
      await createMission({ title: newTitle, description: newDescription, domain: newDomain, priority: newPriority })
      setNewTitle('')
      setNewDescription('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleActivate(id: string) {
    setBusyId(id)
    try {
      await activateMission(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activate failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handlePause(id: string) {
    setBusyId(id)
    try {
      await pauseMission(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pause failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleAbandon(id: string) {
    setBusyId(id)
    try {
      await abandonMission(id, 'Abandoned from devtools dashboard')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Abandon failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleAccept(recommendationId: string, missionId: string) {
    setBusyId(recommendationId)
    try {
      await acceptMissionRecommendation(recommendationId, missionId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Accept failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDismiss(recommendationId: string) {
    setBusyId(recommendationId)
    try {
      await dismissMissionRecommendation(recommendationId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dismiss failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRunPlanning() {
    setPlanningRunning(true)
    try {
      await runMissionPlanningCycle()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Planning cycle failed')
    } finally {
      setPlanningRunning(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mission Control Developer Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => void handleRunPlanning()}
            disabled={planningRunning}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
          >
            {planningRunning ? 'Running Planning Cycle...' : 'Run Planning Cycle'}
          </button>
          <button
            onClick={() => void load()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Stat label="Total Missions" value={stats.totalMissions} />
              <Stat label="Avg Progress" value={`${stats.avgProgress}%`} />
              <Stat label="Completed This Month" value={stats.completedThisMonth} />
              <Stat label="Overdue" value={stats.overdue} />
              <Stat label="Active" value={stats.byStatus.active ?? 0} />
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Create Mission</h2>
          <div className="bg-white border rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder="Mission title"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Domain</label>
              <select value={newDomain} onChange={(e) => setNewDomain(e.target.value as MissionDomain)} className="border rounded px-2 py-1 text-sm w-full">
                {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priority</label>
              <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as MissionPriority)} className="border rounded px-2 py-1 text-sm w-full">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button
              onClick={() => void handleCreate()}
              disabled={busyId === 'create' || !newTitle.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 md:col-span-1"
            >
              {busyId === 'create' ? 'Creating...' : 'Create Mission'}
            </button>
          </div>

          <h2 className="text-lg font-semibold mb-3">Missions ({missions.length})</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Title</th>
                  <th className="text-left p-2 border">Domain</th>
                  <th className="text-left p-2 border">Priority</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Progress</th>
                  <th className="text-left p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {missions.length === 0 ? (
                  <tr><td colSpan={6} className="p-2 border text-gray-400">None yet</td></tr>
                ) : missions.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{m.title}</td>
                    <td className="p-2 border capitalize">{m.domain}</td>
                    <td className="p-2 border capitalize">{m.priority}</td>
                    <td className="p-2 border capitalize">{m.status}</td>
                    <td className="p-2 border">{m.progress}%</td>
                    <td className="p-2 border space-x-2">
                      {m.status !== 'active' && m.status !== 'completed' && m.status !== 'abandoned' && (
                        <button onClick={() => handleActivate(m.id)} disabled={busyId === m.id} className="text-green-600 hover:underline disabled:opacity-50">Activate</button>
                      )}
                      {m.status === 'active' && (
                        <button onClick={() => handlePause(m.id)} disabled={busyId === m.id} className="text-yellow-600 hover:underline disabled:opacity-50">Pause</button>
                      )}
                      {m.status !== 'completed' && m.status !== 'abandoned' && (
                        <button onClick={() => handleAbandon(m.id)} disabled={busyId === m.id} className="text-red-600 hover:underline disabled:opacity-50">Abandon</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold mb-3">Open Recommendations ({recommendations.length})</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Title</th>
                  <th className="text-left p-2 border">Source</th>
                  <th className="text-left p-2 border">Confidence</th>
                  <th className="text-left p-2 border">Impact</th>
                  <th className="text-left p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr><td colSpan={5} className="p-2 border text-gray-400">None</td></tr>
                ) : recommendations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{r.title}</td>
                    <td className="p-2 border capitalize">{r.sourceDomain}</td>
                    <td className="p-2 border">{Math.round(r.confidence * 100)}%</td>
                    <td className="p-2 border">{r.impactScore}</td>
                    <td className="p-2 border space-x-2">
                      {missions.length > 0 && (
                        <button
                          onClick={() => handleAccept(r.id, missions[0].id)}
                          disabled={busyId === r.id}
                          className="text-green-600 hover:underline disabled:opacity-50"
                        >
                          Accept into "{missions[0].title.slice(0, 12)}"
                        </button>
                      )}
                      <button onClick={() => handleDismiss(r.id)} disabled={busyId === r.id} className="text-red-600 hover:underline disabled:opacity-50">Dismiss</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold mb-3">Learning Snapshots</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {learning.map((l) => (
              <div key={l.sourceDomain} className="bg-white border rounded-lg p-4">
                <div className="text-sm font-medium capitalize">{l.sourceDomain}</div>
                <div className="text-xs text-gray-500 mt-1">{l.totalAccepted}/{l.totalShown} accepted</div>
                <div className="text-xs text-gray-500">x{l.confidenceAdjustment.toFixed(2)} confidence</div>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-semibold mb-3">History ({history.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Action</th>
                  <th className="text-left p-2 border">Actor</th>
                  <th className="text-left p-2 border">Request</th>
                  <th className="text-left p-2 border">Notes</th>
                  <th className="text-left p-2 border">At</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={5} className="p-2 border text-gray-400">No history yet</td></tr>
                ) : history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="p-2 border capitalize">{h.action.replace(/_/g, ' ')}</td>
                    <td className="p-2 border">{h.actor}</td>
                    <td className="p-2 border text-xs text-gray-500">{h.requestId.slice(0, 8)}</td>
                    <td className="p-2 border text-xs">{h.notes ?? '-'}</td>
                    <td className="p-2 border">{new Date(h.at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xl font-bold text-blue-600">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
