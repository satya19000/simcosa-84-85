import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Cpu, Activity } from 'lucide-react'
import { fetchPluginStatus } from '@/lib/pluginService'
import type { PluginStatusResult, PluginHealthItem, PluginMetricsItem } from '@/lib/pluginService'

function HealthBadge({ health }: { health: PluginHealthItem['health'] }) {
  if (health === 'healthy') return <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 size={12} /> Healthy</span>
  if (health === 'degraded') return <span className="flex items-center gap-1 text-yellow-400 text-xs"><AlertTriangle size={12} /> Degraded</span>
  if (health === 'unhealthy') return <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle size={12} /> Unhealthy</span>
  return <span className="flex items-center gap-1 text-slate-400 text-xs"><HelpCircle size={12} /> Unknown</span>
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'ENABLED' ? 'text-emerald-400' :
    status === 'ERROR' ? 'text-red-400' :
    status === 'DISABLED' ? 'text-slate-400' :
    'text-violet-400'
  return <span className={`text-xs font-mono ${color}`}>{status}</span>
}

function MetricsCard({ m }: { m: PluginMetricsItem }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-white font-medium text-sm">{m.pluginId}</span>
        <HealthBadge health={m.health} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
        <div><span className="text-white font-semibold">{m.totalExecutions}</span><br />Executions</div>
        <div><span className="text-white font-semibold">{m.totalErrors}</span><br />Errors</div>
        <div><span className="text-white font-semibold">{m.avgExecutionTimeMs}ms</span><br />Avg Time</div>
        <div><span className="text-white font-semibold">{m.totalApiCalls}</span><br />API Calls</div>
        <div><span className="text-white font-semibold">{m.cacheHits}</span><br />Cache Hits</div>
        <div><span className="text-white font-semibold">{m.startupTimeMs}ms</span><br />Startup</div>
      </div>
      {m.lastErrorMessage && (
        <div className="text-red-400 text-xs truncate">Last error: {m.lastErrorMessage}</div>
      )}
    </div>
  )
}

export default function PluginDebug() {
  const [status, setStatus] = useState<PluginStatusResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchPluginStatus()
      setStatus(result)
      setLastRefreshed(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plugin status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Cpu size={20} className="text-violet-400" />
            Plugin Debug
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Developer mode — plugin runtime status</p>
        </div>
        <button
          onClick={refresh}
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

      {lastRefreshed && (
        <p className="text-slate-500 text-xs mb-4">Last refreshed: {lastRefreshed}</p>
      )}

      {status && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{status.health.totalPlugins}</div>
              <div className="text-slate-400 text-xs">Total</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{status.health.enabledPlugins}</div>
              <div className="text-slate-400 text-xs">Enabled</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{status.health.errorPlugins}</div>
              <div className="text-slate-400 text-xs">Errors</div>
            </div>
          </div>

          {/* Plugin list */}
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Activity size={14} className="text-cyan-400" />
            Plugin Status
          </h2>
          <div className="space-y-2 mb-6">
            {status.health.plugins.map((p) => (
              <div key={p.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{p.name}</span>
                  <HealthBadge health={p.health} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono">{p.id}</span>
                  <StatusBadge status={p.status} />
                </div>
                {p.lastErrorMessage && (
                  <div className="text-red-400 text-xs mt-1 truncate">{p.lastErrorMessage}</div>
                )}
              </div>
            ))}
          </div>

          {/* Metrics */}
          {status.metrics.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Metrics</h2>
              <div className="space-y-3">
                {status.metrics.map((m) => (
                  <MetricsCard key={m.pluginId} m={m} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {!status && !loading && !error && (
        <div className="text-slate-400 text-center mt-20">No plugin data available.</div>
      )}
    </div>
  )
}
