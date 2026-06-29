import { useState, useEffect } from 'react'
import { getAgentStatus, runAgentGraph } from '../lib/agentService'
import type { AgentStatusResponse } from '../lib/agentService'
import type { GraphRunResult } from '../types/agentTypes'

export default function AgentDashboard() {
  const [status, setStatus] = useState<AgentStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<GraphRunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [query, setQuery] = useState('What tasks do I have today?')

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      setError(null)
      const data = await getAgentStatus()
      setStatus(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function runTestGraph() {
    try {
      setRunning(true)
      setTestResult(null)
      const result = await runAgentGraph({
        tasks: [
          {
            capability: 'knowledge',
            description: 'Answer user question',
            input: { question: query },
            priority: 50,
          },
        ],
      })
      setTestResult(result)
    } catch (err) {
      setError(String(err))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-violet-400">Agent Dashboard</h1>
          <button
            onClick={loadStatus}
            className="px-3 py-1 text-sm bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-400 text-sm">Loading agents…</div>
        ) : status ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: status.stats.total, color: 'text-white' },
                { label: 'Idle', value: status.stats.idle, color: 'text-green-400' },
                { label: 'Busy', value: status.stats.busy, color: 'text-yellow-400' },
                { label: 'Error', value: status.stats.error, color: 'text-red-400' },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Agent list */}
            <div className="bg-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold text-gray-300">
                Registered Agents
              </div>
              <div className="divide-y divide-white/5">
                {status.manifests.map((m) => (
                  <div key={m.id} className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{m.name}</span>
                        {m.placeholder && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">
                            placeholder
                          </span>
                        )}
                        <span className="text-xs text-gray-500">v{m.version}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{m.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.capabilities.map((c) => (
                          <span
                            key={c}
                            className="text-xs px-1.5 py-0.5 bg-violet-900/40 text-violet-300 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {/* Test runner */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-gray-300">Test Agent Graph</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              placeholder="Enter a question…"
            />
            <button
              onClick={runTestGraph}
              disabled={running}
              className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {running ? 'Running…' : 'Run'}
            </button>
          </div>

          {testResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    testResult.status === 'completed' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {testResult.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{testResult.totalDurationMs}ms</span>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-sm text-gray-200 whitespace-pre-wrap">
                {testResult.assembledResponse || testResult.error || '(no response)'}
              </div>
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-400">Raw task results</summary>
                <pre className="mt-2 bg-black/30 rounded p-2 overflow-auto max-h-64">
                  {JSON.stringify(testResult.taskResults, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
