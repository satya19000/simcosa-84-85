import { Search } from 'lucide-react'
import { MARKETPLACE_CATEGORIES, type MarketplaceCategory } from '@/lib/marketplaceService'

interface MarketplaceFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category: MarketplaceCategory | ''
  onCategoryChange: (value: MarketplaceCategory | '') => void
}

export function MarketplaceFilters({ search, onSearchChange, category, onCategoryChange }: MarketplaceFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search skills..."
          className="w-full glass border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => onCategoryChange('')}
          className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
            category === '' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          All
        </button>
        {MARKETPLACE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onCategoryChange(c)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              category === c ? 'bg-[#7C3AED] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
