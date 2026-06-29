import { useState, useEffect, useCallback } from 'react'
import { memoryGraphService } from '../lib/memoryGraphService'
import type { GraphNode, GraphEdge, GraphSearchResult, GraphStats } from '../lib/memoryGraphService'

type Tab = 'overview' | 'nodes' | 'search' | 'validate' | 'extract'

export default function MemoryGraphDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Overview
  const [stats, setStats] = useState<GraphStats | null>(null)
  const [topContacts, setTopContacts] = useState<unknown[]>([])
  const [activeProjects, setActiveProjects] = useState<unknown[]>([])

  // Nodes
  const [nodes, setNodes] = useState<GraphNode[]>([])

  // Search
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState<string>('hybrid')
  const [searchResults, setSearchResults] = useState<GraphSearchResult[]>([])

  // Validate
  const [validationReport, setValidationReport] = useState<{ valid: boolean; issues: unknown[]; checkedNodes: number; checkedEdges: number; ranAt: string } | null>(null)

  // Extract
  const [extractText, setExtractText] = useState('Dr. Ramesh works at District Hospital in Vijayawada.')
  const [extractedEdges, setExtractedEdges] = useState<GraphEdge[]>([])

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await memoryGraphService.getStats({})
      setStats(data.stats)
      setTopContacts(data.topContacts)
      setActiveProjects(data.activeProjects)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'overview') loadOverview()
    if (tab === 'nodes') loadNodes()
  }, [tab])

  async function loadNodes() {
    try {
      setLoading(true)
      setError(null)
      const data = await memoryGraphService.listNodes({ limit: 100 })
      setNodes(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function runSearch() {
    if (!query) return
    try {
      setLoading(true)
      setError(null)
      const data = await memoryGraphService.searchGraph({ query, mode: searchMode, maxNodes: 20, includeEdges: true })
      setSearchResults(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function runValidation() {
    try {
      setLoading(true)
      setError(null)
      const report = await memoryGraphService.validate({})
      setValidationReport(report)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function runExtract() {
    if (!extractText) return
    try {
      setLoading(true)
      setError(null)
      const edges = await memoryGraphService.extractRelationships({ text: extractText })
      setExtractedEdges(edges)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function rebuildIndex() {
    try {
      setLoading(true)
      setError(null)
      await memoryGraphService.rebuildIndex({})
      await loadOverview()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'nodes', label: 'Nodes' },
    { id: 'search', label: 'Search' },
    { id: 'validate', label: 'Validate' },
    { id: 'extract', label: 'Extract' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-violet-400">Memory Graph</h1>
            <p className="text-xs text-gray-500 mt-0.5">Long-term relational knowledge store</p>
          </div>
          <button
            onClick={rebuildIndex}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            Rebuild Index
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 px-6">
        <div className="max-w-5xl mx-auto flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {loading && !stats ? (
              <div className="text-gray-400 text-sm">Loading statistics…</div>
            ) : stats ? (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Nodes', value: stats.nodeCount, color: 'text-violet-400' },
                    { label: 'Edges', value: stats.edgeCount, color: 'text-cyan-400' },
                    { label: 'Orphans', value: stats.orphanNodes, color: 'text-yellow-400' },
                    { label: 'Avg Degree', value: stats.avgEdgesPerNode, color: 'text-green-400' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 rounded-xl p-4 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Node type distribution */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-300 mb-3">Node Types</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(stats.nodesByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-300">{type}</span>
                        <span className="text-xs font-semibold text-violet-400">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most connected */}
                {stats.mostConnectedNodes.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm font-semibold text-gray-300 mb-3">Most Connected Nodes</div>
                    <div className="space-y-1">
                      {stats.mostConnectedNodes.slice(0, 8).map((n) => (
                        <div key={n.id} className="flex items-center justify-between py-1 border-b border-white/5">
                          <span className="text-sm truncate">{n.title}</span>
                          <span className="text-xs text-cyan-400 ml-2 shrink-0">{n.degree} edges</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top contacts + active projects */}
                <div className="grid md:grid-cols-2 gap-4">
                  {topContacts.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-sm font-semibold text-gray-300 mb-3">Top Contacts</div>
                      {(topContacts as Array<{ title: string; mentions: number }>).map((c, i) => (
                        <div key={i} className="flex justify-between py-1 text-sm border-b border-white/5">
                          <span className="truncate">{c.title}</span>
                          <span className="text-violet-400 ml-2">{c.mentions}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeProjects.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-sm font-semibold text-gray-300 mb-3">Active Projects</div>
                      {(activeProjects as Array<{ title: string; taskCount: number }>).map((p, i) => (
                        <div key={i} className="flex justify-between py-1 text-sm border-b border-white/5">
                          <span className="truncate">{p.title}</span>
                          <span className="text-cyan-400 ml-2">{p.taskCount} tasks</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-sm">No data yet. Start by building memory from contacts or tasks.</div>
            )}
          </div>
        )}

        {/* Nodes */}
        {tab === 'nodes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{nodes.length} node(s)</span>
              <button onClick={loadNodes} className="text-xs text-violet-400 hover:text-violet-300">Refresh</button>
            </div>
            {nodes.length === 0 && !loading && (
              <div className="text-gray-500 text-sm">No nodes yet.</div>
            )}
            <div className="space-y-2">
              {nodes.map((n) => (
                <div key={n.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{n.title}</span>
                        {n.pinned && <span className="text-xs text-yellow-400">📌</span>}
                      </div>
                      {n.summary && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.summary}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs px-2 py-0.5 bg-violet-900/40 text-violet-300 rounded">{n.type}</div>
                      <div className="text-xs text-gray-500 mt-1">imp: {n.importance}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        {tab === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Search the memory graph…"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
              >
                {['hybrid', 'keyword', 'semantic', 'relationship'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                onClick={runSearch}
                disabled={loading || !query}
                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg"
              >
                {loading ? '…' : 'Search'}
              </button>
            </div>
            <div className="space-y-3">
              {searchResults.map((r) => (
                <div key={r.node.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{r.node.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.matchReason}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-violet-300">{r.node.type}</div>
                      <div className="text-xs text-gray-500">score: {r.score.toFixed(1)}</div>
                    </div>
                  </div>
                  {r.edges && r.edges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.edges.slice(0, 5).map((e) => (
                        <span key={e.id} className="text-xs bg-white/10 rounded px-1.5 py-0.5 text-gray-300">
                          {e.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {searchResults.length === 0 && !loading && query && (
                <div className="text-gray-500 text-sm">No results.</div>
              )}
            </div>
          </div>
        )}

        {/* Validate */}
        {tab === 'validate' && (
          <div className="space-y-4">
            <button
              onClick={runValidation}
              disabled={loading}
              className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg"
            >
              {loading ? 'Running…' : 'Run Integrity Check'}
            </button>
            {validationReport && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${validationReport.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {validationReport.valid ? '✓ Valid' : '✗ Issues found'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {validationReport.checkedNodes} nodes, {validationReport.checkedEdges} edges checked
                  </span>
                </div>
                {validationReport.issues.length > 0 ? (
                  <div className="bg-white/5 rounded-xl divide-y divide-white/5">
                    {(validationReport.issues as Array<{ severity: string; message: string }>).map((issue, i) => (
                      <div key={i} className="px-4 py-2 flex items-start gap-2">
                        <span className={`text-xs font-semibold ${issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-300">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No issues found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Extract */}
        {tab === 'extract' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Text to extract relationships from</label>
              <textarea
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
            <button
              onClick={runExtract}
              disabled={loading || !extractText}
              className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg"
            >
              {loading ? 'Extracting…' : 'Extract & Save Relationships'}
            </button>
            {extractedEdges.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="text-sm font-semibold text-gray-300">{extractedEdges.length} relationship(s) saved</div>
                {extractedEdges.map((e) => (
                  <div key={e.id} className="text-xs text-gray-300 bg-white/5 rounded px-3 py-1.5">
                    <span className="text-violet-300">{e.fromId.slice(0, 8)}…</span>
                    <span className="mx-2 text-gray-500">{e.type}</span>
                    <span className="text-cyan-300">{e.toId.slice(0, 8)}…</span>
                    <span className="ml-2 text-gray-500">conf: {e.confidence.toFixed(2)}</span>
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
