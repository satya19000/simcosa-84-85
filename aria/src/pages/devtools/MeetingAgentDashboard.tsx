import { useState, useEffect } from 'react'
import { Mic, Shield, Brain, ListChecks, Users } from 'lucide-react'
import { listMyTenants, type TenantRecord } from '../../lib/securityService'
import {
  createMeetingSession,
  startMeetingSession,
  endMeetingSession,
  listMeetingSessions,
  generateMeetingSummary,
  extractMeetingActionItems,
  type MeetingSession,
  type MeetingSummary,
  type MeetingActionItem,
} from '../../lib/meetingAgentService'

export default function MeetingAgentDashboard() {
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [sessions, setSessions] = useState<MeetingSession[]>([])
  const [selectedSession, setSelectedSession] = useState<MeetingSession | null>(null)
  const [summary, setSummary] = useState<MeetingSummary | null>(null)
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 99)])
  }

  useEffect(() => { void init() }, [])
  useEffect(() => { if (selectedTenantId) void loadSessions() }, [selectedTenantId])

  async function init() {
    try {
      const ts = await listMyTenants()
      setTenants(ts)
      if (ts.length > 0) setSelectedTenantId(ts[0].tenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Init failed')
    } finally {
      setLoading(false)
    }
  }

  async function loadSessions() {
    if (!selectedTenantId) return
    try {
      const list = await listMeetingSessions(selectedTenantId)
      setSessions(list)
      addLog(`Loaded ${list.length} sessions`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    }
  }

  async function run<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    setBusy(true)
    setError('')
    try {
      addLog(`→ ${label}`)
      const result = await fn()
      addLog(`✓ ${label} done`)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      addLog(`✗ ${label}: ${msg}`)
      return null
    } finally {
      setBusy(false)
    }
  }

  async function handleQuickTest() {
    const session = await run('Create meeting session', () =>
      createMeetingSession({
        tenantId: selectedTenantId,
        title: `Dev Test Meeting ${Date.now()}`,
        type: 'voiceNote',
        notes: 'DevTools test session',
      })
    )
    if (!session) return
    setSessions((prev) => [session, ...prev])

    const started = await run('Start session', () =>
      startMeetingSession(selectedTenantId, session.sessionId)
    )
    if (!started) return
    setSelectedSession(started)

    // Note: In real use, transcript chunks come from the frontend browser speech API.
    // Here we just log the test flow.
    addLog('ℹ Transcript chunk addition requires frontend browser Web Speech API')

    const ended = await run('End session', () =>
      endMeetingSession(selectedTenantId, session.sessionId)
    )
    if (ended) setSelectedSession(ended)
  }

  async function handleGenerateSummary() {
    if (!selectedSession) return
    const sum = await run('Generate summary', () =>
      generateMeetingSummary(selectedTenantId, selectedSession.sessionId)
    )
    if (sum) setSummary(sum)
  }

  async function handleExtractActions() {
    if (!selectedSession) return
    const items = await run('Extract action items', () =>
      extractMeetingActionItems(selectedTenantId, selectedSession.sessionId)
    )
    if (items) setActionItems(items)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#7C3AED]" />
            Meeting Agent Dashboard
          </h1>
          <p className="text-xs text-white/40 mt-1">DevTools — Phase 5.7</p>
        </div>

        {/* Safety invariants */}
        <div className="mb-5 p-4 rounded-xl glass border border-green-700/30">
          <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Active Safety Invariants
          </p>
          <ul className="text-xs text-green-400/70 space-y-1">
            <li>• Stealth recording: unconditionally blocked (MeetingSafetyGuard)</li>
            <li>• Hidden microphone: unconditionally blocked</li>
            <li>• Auto-send communications: blocked — all go through MeetingApprovalBridge → ApprovalEngine</li>
            <li>• Auto-task creation: blocked — action items are suggestions only</li>
            <li>• Transcript sharing without approval: blocked</li>
          </ul>
        </div>

        {loading ? (
          <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Controls */}
            <div className="p-4 rounded-xl glass border border-white/10">
              <p className="text-sm font-semibold text-white/80 mb-3">Controls</p>

              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded-xl glass border border-white/10 text-sm text-white/80 bg-transparent"
              >
                {tenants.map((t) => (
                  <option key={t.tenantId} value={t.tenantId} className="bg-[#1a1a2e]">{t.name}</option>
                ))}
              </select>

              {error && (
                <div className="mb-3 p-2 rounded-lg bg-red-900/20 border border-red-700/40 text-red-400 text-xs">{error}</div>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleQuickTest}
                  disabled={busy || !selectedTenantId}
                  className="w-full py-2 rounded-xl bg-[#7C3AED]/70 hover:bg-[#7C3AED] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {busy ? 'Running…' : 'Quick Test (create → start → end)'}
                </button>
                <button
                  onClick={handleGenerateSummary}
                  disabled={busy || !selectedSession}
                  className="w-full py-2 rounded-xl glass border border-[#7C3AED]/30 text-[#7C3AED] text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Generate Summary
                </button>
                <button
                  onClick={handleExtractActions}
                  disabled={busy || !selectedSession}
                  className="w-full py-2 rounded-xl glass border border-white/10 text-white/60 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  Extract Action Items
                </button>
                <button
                  onClick={loadSessions}
                  disabled={busy}
                  className="w-full py-2 rounded-xl glass border border-white/10 text-white/50 text-sm transition-colors disabled:opacity-50"
                >
                  Reload Sessions
                </button>
              </div>

              {selectedSession && (
                <div className="mt-3 p-2 rounded-lg bg-white/5 text-xs">
                  <p className="text-white/50 font-medium">Selected Session</p>
                  <p className="text-white/80 mt-1">{selectedSession.title}</p>
                  <p className="text-white/40">{selectedSession.status} · {selectedSession.type}</p>
                </div>
              )}
            </div>

            {/* Log */}
            <div className="p-4 rounded-xl glass border border-white/10">
              <p className="text-sm font-semibold text-white/80 mb-3">Activity Log</p>
              <div className="space-y-1 max-h-80 overflow-y-auto font-mono">
                {log.length === 0 ? (
                  <p className="text-xs text-white/30">No activity yet.</p>
                ) : (
                  log.map((line, i) => (
                    <p key={i} className={`text-xs ${
                      line.includes('✗') ? 'text-red-400' : line.includes('✓') ? 'text-green-400' : 'text-white/50'
                    }`}>{line}</p>
                  ))
                )}
              </div>
            </div>

            {/* Sessions */}
            <div className="md:col-span-2 p-4 rounded-xl glass border border-white/10">
              <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-white/40" />
                Sessions ({sessions.length})
              </p>
              {sessions.length === 0 ? (
                <p className="text-xs text-white/30">No sessions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-white/60">
                    <thead>
                      <tr className="text-white/30 border-b border-white/10">
                        <th className="text-left pb-2">Title</th>
                        <th className="text-left pb-2">Type</th>
                        <th className="text-left pb-2">Status</th>
                        <th className="text-left pb-2">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sessions.map((s) => (
                        <tr
                          key={s.sessionId}
                          onClick={() => setSelectedSession(s)}
                          className={`cursor-pointer hover:bg-white/5 transition-colors ${selectedSession?.sessionId === s.sessionId ? 'bg-[#7C3AED]/10' : ''}`}
                        >
                          <td className="py-2 text-white/80">{s.title}</td>
                          <td className="py-2 capitalize">{s.type}</td>
                          <td className="py-2 capitalize">{s.status}</td>
                          <td className="py-2">{new Date(s.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Summary */}
            {summary && (
              <div className="md:col-span-2 p-4 rounded-xl glass border border-[#7C3AED]/30">
                <p className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#7C3AED]" />
                  Last Summary
                </p>
                <p className="text-sm text-white/80">{summary.shortSummary}</p>
                {summary.decisionsMade.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-white/40 mb-1">Decisions:</p>
                    {summary.decisionsMade.map((d, i) => <p key={i} className="text-xs text-white/60">• {d}</p>)}
                  </div>
                )}
              </div>
            )}

            {/* Action items */}
            {actionItems.length > 0 && (
              <div className="md:col-span-2 p-4 rounded-xl glass border border-white/10">
                <p className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-white/40" />
                  Action Items (Suggestions only — require approval)
                </p>
                {actionItems.map((item) => (
                  <div key={item.actionItemId} className="p-2 mb-1.5 rounded-lg bg-white/5 text-xs">
                    <span className="text-[#7C3AED] mr-2">[{item.type}]</span>
                    <span className="text-white/70">{item.description}</span>
                    <span className="ml-2 text-white/30">({item.approvalStatus})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
