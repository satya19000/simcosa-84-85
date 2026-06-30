import { useState, useEffect } from 'react'
import {
  listPendingApprovals,
  listUrgentApprovals,
  listExpiredApprovals,
  listExecutedApprovals,
  listDelegatedApprovals,
  listRejectedApprovals,
  getApprovalStats,
  getApprovalMetrics,
  listApprovalHistory,
  getApprovalPolicyBands,
  approveRequest,
  rejectRequest,
  rollbackApprovalRequest,
  type ApprovalRequest,
  type ApprovalStats,
  type ApprovalMetricsSnapshot,
  type ApprovalHistoryEntry,
  type ApprovalPolicyBands,
} from '../../lib/delegationService'

export default function ApprovalDashboard() {
  const [pending, setPending] = useState<ApprovalRequest[]>([])
  const [urgent, setUrgent] = useState<ApprovalRequest[]>([])
  const [expired, setExpired] = useState<ApprovalRequest[]>([])
  const [executed, setExecuted] = useState<ApprovalRequest[]>([])
  const [delegated, setDelegated] = useState<ApprovalRequest[]>([])
  const [rejected, setRejected] = useState<ApprovalRequest[]>([])
  const [stats, setStats] = useState<ApprovalStats | null>(null)
  const [metrics, setMetrics] = useState<ApprovalMetricsSnapshot | null>(null)
  const [history, setHistory] = useState<ApprovalHistoryEntry[]>([])
  const [policy, setPolicy] = useState<ApprovalPolicyBands | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rollbackTarget, setRollbackTarget] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [p, u, ex, exec, del, rej, s, m, h, pol] = await Promise.all([
        listPendingApprovals(),
        listUrgentApprovals(),
        listExpiredApprovals(),
        listExecutedApprovals(),
        listDelegatedApprovals(),
        listRejectedApprovals(),
        getApprovalStats(),
        getApprovalMetrics(),
        listApprovalHistory(),
        getApprovalPolicyBands(),
      ])
      setPending(p)
      setUrgent(u)
      setExpired(ex)
      setExecuted(exec)
      setDelegated(del)
      setRejected(rej)
      setStats(s)
      setMetrics(m)
      setHistory(h)
      setPolicy(pol)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setBusyId(id)
    try {
      await approveRequest(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: string) {
    setBusyId(id)
    try {
      await rejectRequest(id, 'Rejected from devtools dashboard')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRollback() {
    if (!rollbackTarget) return
    setBusyId(rollbackTarget)
    try {
      await rollbackApprovalRequest(rollbackTarget)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rollback failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Approval Developer Dashboard</h1>
        <button
          onClick={() => void load()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Stat label="Total Approvals" value={metrics.totalApprovals} />
              <Stat label="Pending" value={metrics.totalPending} />
              <Stat label="Approved" value={metrics.totalApproved} />
              <Stat label="Rejected" value={metrics.totalRejected} />
              <Stat label="Expired" value={metrics.totalExpired} />
              <Stat label="Auto-Executed" value={metrics.totalAutoExecuted} />
              <Stat label="Executed" value={metrics.totalExecuted} />
              <Stat label="Rolled Back" value={metrics.totalRolledBack} />
              <Stat label="Delegated" value={metrics.totalDelegated} />
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Stat label="Approval Rate" value={`${Math.round(stats.approvalRate * 100)}%`} />
              <Stat label="Rejection Rate" value={`${Math.round(stats.rejectionRate * 100)}%`} />
              <Stat label="Expiry Rate" value={`${Math.round(stats.expiryRate * 100)}%`} />
              <Stat label="Avg Time to Decision" value={stats.avgTimeToDecisionMs ? `${Math.round(stats.avgTimeToDecisionMs / 60000)}m` : '-'} />
            </div>
          )}

          {policy && (
            <div className="bg-white border rounded-lg p-4 mb-8">
              <h3 className="font-medium mb-3">Policy — Risk Bands (Read-Only)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">Auto-execute below:</span> {policy.autoExecuteThreshold}</div>
                <div><span className="text-gray-500">Simple approval below:</span> {policy.simpleThreshold}</div>
                <div><span className="text-gray-500">Executive approval below:</span> {policy.executiveThreshold}</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Always-manual triggers: {policy.alwaysManualTriggers.join(', ')}
              </div>
            </div>
          )}

          <ApprovalTable title="Pending Approvals" items={pending} busyId={busyId} onApprove={handleApprove} onReject={handleReject} />
          <ApprovalTable title="Urgent — Expiring Soon" items={urgent} busyId={busyId} onApprove={handleApprove} onReject={handleReject} />
          <ApprovalTable title="Expired" items={expired} busyId={busyId} />
          <ApprovalTable title="Recently Executed" items={executed} busyId={busyId} />
          <ApprovalTable title="Delegated Work" items={delegated} busyId={busyId} />
          <ApprovalTable title="Rejected Work" items={rejected} busyId={busyId} />

          <h2 className="text-lg font-semibold mb-3">Rollback Tests</h2>
          <div className="bg-white border rounded-lg p-4 mb-8 flex items-center gap-3">
            <select
              value={rollbackTarget}
              onChange={(e) => setRollbackTarget(e.target.value)}
              className="border rounded px-2 py-1 text-sm flex-1"
            >
              <option value="">Select an executed approval...</option>
              {executed.map((r) => (
                <option key={r.id} value={r.id}>{r.title} ({r.id.slice(0, 8)})</option>
              ))}
            </select>
            <button
              onClick={() => void handleRollback()}
              disabled={!rollbackTarget || busyId === rollbackTarget}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
            >
              {busyId === rollbackTarget ? 'Rolling back...' : 'Trigger Rollback'}
            </button>
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

function ApprovalTable({
  title, items, busyId, onApprove, onReject,
}: {
  title: string
  items: ApprovalRequest[]
  busyId: string | null
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}) {
  return (
    <>
      <h2 className="text-lg font-semibold mb-3">{title} ({items.length})</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2 border">Title</th>
              <th className="text-left p-2 border">Trigger</th>
              <th className="text-left p-2 border">Risk</th>
              <th className="text-left p-2 border">Level</th>
              <th className="text-left p-2 border">Status</th>
              <th className="text-left p-2 border">Expires</th>
              {(onApprove || onReject) && <th className="text-left p-2 border">Action</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} className="p-2 border text-gray-400">None</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-2 border">{r.title}</td>
                <td className="p-2 border capitalize">{r.triggerType.replace(/_/g, ' ')}</td>
                <td className="p-2 border">{r.riskScore} ({r.riskLevel})</td>
                <td className="p-2 border capitalize">{r.approvalLevel}</td>
                <td className="p-2 border capitalize">{r.status.replace(/_/g, ' ')}</td>
                <td className="p-2 border">{new Date(r.expiresAt).toLocaleString()}</td>
                {(onApprove || onReject) && (
                  <td className="p-2 border space-x-2">
                    {onApprove && (
                      <button
                        onClick={() => onApprove(r.id)}
                        disabled={busyId === r.id}
                        className="text-green-600 hover:underline disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {onReject && (
                      <button
                        onClick={() => onReject(r.id)}
                        disabled={busyId === r.id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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
