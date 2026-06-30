import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Store } from 'lucide-react'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard'
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters'
import { listMarketplaceCatalog, type MarketplaceItemRecord, type MarketplaceCategory } from '@/lib/marketplaceService'

export default function Marketplace() {
  const navigate = useNavigate()
  const [items, setItems] = useState<MarketplaceItemRecord[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<MarketplaceCategory | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const page = await listMarketplaceCatalog({ search: search || undefined, category: category || undefined })
      setItems(page.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load marketplace')
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    const t = setTimeout(() => void load(), 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="px-4 pt-6 pb-8 space-y-5 safe-top overflow-y-auto h-[calc(100vh-96px)]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-5 h-5 text-[#7C3AED]" />
          <h1 className="text-xl font-bold text-white">Marketplace</h1>
        </div>
        <p className="text-xs text-white/40">Browse and install AI skills, plugins &amp; workflows</p>
      </motion.div>

      <MarketplaceFilters search={search} onSearchChange={setSearch} category={category} onCategoryChange={setCategory} />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState icon={Store} title="No skills found" description="Try a different search or category." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <MarketplaceCard key={item.itemId} item={item} onClick={() => navigate(`/marketplace/${item.itemId}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
