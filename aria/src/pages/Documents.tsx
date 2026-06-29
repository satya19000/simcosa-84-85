import { useState, useEffect } from 'react'
import { listDocuments, getDocumentStats, deleteDocument, type DocumentRecord, type DocumentStats } from '../lib/documentService'

const CATEGORIES = ['medical', 'government', 'finance', 'legal', 'personal', 'education', 'research', 'public_health', 'meeting_notes', 'project', 'invoice', 'receipt']

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
  }, [selectedCategory])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [docs, s] = await Promise.all([
        listDocuments(selectedCategory ? { category: selectedCategory } : {}),
        getDocumentStats(),
      ])
      setDocuments(docs)
      setStats(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return
    try {
      await deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const pinned = documents.filter((d) => d.pinned)
  const starred = documents.filter((d) => d.starred)
  const recent = [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Knowledge Workspace</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Documents" value={stats.total} />
          <StatCard label="Recent (7 days)" value={stats.recentCount} />
          <StatCard label="Starred" value={stats.starredCount} />
          <StatCard label="Pinned" value={stats.pinnedCount} />
        </div>
      )}

      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1 rounded text-sm ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded text-sm capitalize ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500">Loading documents...</div>
      ) : (
        <>
          {pinned.length > 0 && (
            <Section title="Pinned" docs={pinned} onDelete={handleDelete} />
          )}
          {starred.length > 0 && (
            <Section title="Starred" docs={starred} onDelete={handleDelete} />
          )}
          <Section title={selectedCategory ? `${selectedCategory.replace('_', ' ')} Documents` : 'Recent Documents'} docs={recent} onDelete={handleDelete} />
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-2xl font-bold text-blue-600">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function Section({ title, docs, onDelete }: { title: string; docs: DocumentRecord[]; onDelete: (id: string) => void }) {
  if (docs.length === 0) return null
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function DocumentCard({ doc, onDelete }: { doc: DocumentRecord; onDelete: (id: string) => void }) {
  const statusColor: Record<string, string> = {
    indexed: 'bg-green-100 text-green-700',
    processing: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 truncate flex-1">{doc.title}</h3>
        <button
          onClick={() => onDelete(doc.id)}
          className="ml-2 text-gray-400 hover:text-red-500 text-xs shrink-0"
        >
          Delete
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-2">
        <span className={`text-xs px-2 py-0.5 rounded ${statusColor[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {doc.status}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 capitalize">
          {doc.category.replace('_', ' ')}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-600 uppercase">
          {doc.format}
        </span>
      </div>
      {doc.tags && doc.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {doc.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="text-xs text-gray-400 mt-2">
        {new Date(doc.createdAt).toLocaleDateString()}
        {doc.sizeBytes > 0 && ` · ${(doc.sizeBytes / 1024).toFixed(1)} KB`}
      </div>
    </div>
  )
}
