import { useState } from 'react'
import { searchDocuments, type SearchResult } from '../lib/documentService'

export default function DocumentSearch() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'hybrid' | 'keyword' | 'semantic'>('hybrid')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await searchDocuments({ query: query.trim(), mode, limit: 30 })
      setResults(res)
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Global Search</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, tasks, contacts, memory..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="hybrid">Hybrid</option>
            <option value="keyword">Keyword</option>
            <option value="semantic">Semantic</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {searched && !loading && (
        <div className="mb-4 text-sm text-gray-500">
          {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </div>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <div key={`${result.documentId}-${result.chunkId}`} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900">{result.title}</h3>
              <span className="text-xs text-gray-400 ml-2 shrink-0">
                {(result.score * 100).toFixed(0)}% match
              </span>
            </div>
            {result.snippet && (
              <p className="text-sm text-gray-600 line-clamp-3">{result.snippet}</p>
            )}
            <div className="text-xs text-gray-400 mt-2">Document ID: {result.documentId}</div>
          </div>
        ))}
      </div>

      {searched && results.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No results found for "{query}"
        </div>
      )}

      {!searched && (
        <div className="text-center py-12 text-gray-400">
          Search across all your documents, tasks, contacts, and memory
        </div>
      )}
    </div>
  )
}
