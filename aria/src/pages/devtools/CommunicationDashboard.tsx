import { useState, useEffect } from 'react'
import {
  getProviderHealth,
  listCommunicationProviders,
  listConversationThreads,
  getCommunicationStats,
  listScheduledMessages,
  syncCommunicationProvider,
  type ProviderHealth,
  type ProviderType,
  type ConversationThread,
  type CommunicationStats,
  type ScheduledMessage,
} from '../../lib/communicationService'

export default function CommunicationDashboard() {
  const [providers, setProviders] = useState<Array<{ id: string; name: string; type: ProviderType }>>([])
  const [health, setHealth] = useState<ProviderHealth[]>([])
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [stats, setStats] = useState<CommunicationStats | null>(null)
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [p, h, t, s, sch] = await Promise.all([
        listCommunicationProviders(),
        getProviderHealth(),
        listConversationThreads({ limit: 50 }),
        getCommunicationStats(),
        listScheduledMessages(),
      ])
      setProviders(p)
      setHealth(h)
      setThreads(t)
      setStats(s)
      setScheduled(sch)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleSync(providerId: string) {
    setSyncing(providerId)
    try {
      await syncCommunicationProvider(providerId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Communication Developer Dashboard</h1>
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
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Stat label="Total Messages" value={stats.totalMessages} />
              <Stat label="Total Threads" value={stats.totalThreads} />
              <Stat label="Unread" value={stats.unreadCount} />
              <Stat label="Scheduled" value={scheduled.length} />
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Connected Providers & Health</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Provider</th>
                  <th className="text-left p-2 border">Type</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Latency</th>
                  <th className="text-left p-2 border">Last Checked</th>
                  <th className="text-left p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => {
                  const h = health.find((x) => x.providerId === p.id)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{p.name}</td>
                      <td className="p-2 border capitalize">{p.type.replace('_', ' ')}</td>
                      <td className="p-2 border">{h?.status ?? 'unknown'}</td>
                      <td className="p-2 border">{h?.latencyMs ? `${h.latencyMs}ms` : '-'}</td>
                      <td className="p-2 border">{h?.lastCheckedAt ? new Date(h.lastCheckedAt).toLocaleString() : '-'}</td>
                      <td className="p-2 border">
                        <button
                          onClick={() => void handleSync(p.id)}
                          disabled={syncing === p.id}
                          className="text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {syncing === p.id ? 'Syncing...' : 'Sync'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-3">Messages by Provider</h3>
                {Object.entries(stats.byProvider).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span className="text-gray-600">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-3">Messages by Direction</h3>
                {Object.entries(stats.byDirection).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span className="capitalize text-gray-600">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Conversation Threads ({threads.length})</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Subject</th>
                  <th className="text-left p-2 border">Provider</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Messages</th>
                  <th className="text-left p-2 border">Unread</th>
                  <th className="text-left p-2 border">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-2 border truncate max-w-xs">{t.subject ?? '(no subject)'}</td>
                    <td className="p-2 border capitalize">{t.providerType.replace('_', ' ')}</td>
                    <td className="p-2 border">{t.status}</td>
                    <td className="p-2 border">{t.messageCount}</td>
                    <td className="p-2 border">{t.unreadCount}</td>
                    <td className="p-2 border">{new Date(t.lastMessageAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold mb-3">Scheduled Messages ({scheduled.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Provider</th>
                  <th className="text-left p-2 border">Body</th>
                  <th className="text-left p-2 border">Scheduled For</th>
                  <th className="text-left p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduled.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{m.providerId}</td>
                    <td className="p-2 border truncate max-w-xs">{m.body}</td>
                    <td className="p-2 border">{new Date(m.scheduledFor).toLocaleString()}</td>
                    <td className="p-2 border">{m.status}</td>
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
