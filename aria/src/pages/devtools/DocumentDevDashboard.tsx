import { useState, useEffect } from 'react'
import { getDocumentStats, listDocuments, rebuildDocumentIndex, type DocumentStats, type DocumentRecord } from '../../lib/documentService'

export default function DocumentDevDashboard() {
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [rebuilding, setRebuilding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [s, docs] = await Promise.all([getDocumentStats(), listDocuments({ limit: 100 })])
      setStats(s)
      setDocuments(docs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleRebuild() {
    setRebuilding(true)
    try {
      await rebuildDocumentIndex()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rebuild failed')
    } finally {
      setRebuilding(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Document Developer Dashboard</h1>
        <button
          onClick={handleRebuild}
          disabled={rebuilding}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {rebuilding ? 'Rebuilding Index...' : 'Rebuild Index'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          {stats && (
            <>
              <h2 className="text-lg font-semibold mb-3">Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Stat label="Total" value={stats.total} />
                <Stat label="Recent (7d)" value={stats.recentCount} />
                <Stat label="Starred" value={stats.starredCount} />
                <Stat label="Pinned" value={stats.pinnedCount} />
                <Stat label="Total Size" value={`${(stats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium mb-3">By Category</h3>
                  {Object.entries(stats.byCategory).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span className="capitalize text-gray-600">{k.replace('_', ' ')}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium mb-3">By Status</h3>
                  {Object.entries(stats.byStatus).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span className="capitalize text-gray-600">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {stats.topTags.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-medium mb-3">Top Tags</h3>
                  <div className="flex gap-2 flex-wrap">
                    {stats.topTags.map(({ tag, count }) => (
                      <span key={tag} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {tag} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <h2 className="text-lg font-semibold mb-3">All Documents ({documents.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Title</th>
                  <th className="text-left p-2 border">Category</th>
                  <th className="text-left p-2 border">Format</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Size</th>
                  <th className="text-left p-2 border">Created</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="p-2 border truncate max-w-xs">{doc.title}</td>
                    <td className="p-2 border capitalize">{doc.category.replace('_', ' ')}</td>
                    <td className="p-2 border uppercase">{doc.format}</td>
                    <td className="p-2 border">{doc.status}</td>
                    <td className="p-2 border">{doc.sizeBytes > 0 ? `${(doc.sizeBytes / 1024).toFixed(1)} KB` : '-'}</td>
                    <td className="p-2 border">{new Date(doc.createdAt).toLocaleDateString()}</td>
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
