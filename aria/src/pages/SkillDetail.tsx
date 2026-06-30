import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SkillDetailPanel } from '@/components/marketplace/SkillDetailPanel'
import { SkillInstallModal } from '@/components/marketplace/SkillInstallModal'
import { getSkillDetail, installSkill, reviewSkill, type MarketplaceItemRecord } from '@/lib/marketplaceService'
import { listMyTenants, type TenantRecord } from '@/lib/securityService'

export default function SkillDetail() {
  const { skillId } = useParams<{ skillId: string }>()
  const navigate = useNavigate()

  const [item, setItem] = useState<MarketplaceItemRecord | null>(null)
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInstall, setShowInstall] = useState(false)
  const [installNotice, setInstallNotice] = useState('')

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewNotice, setReviewNotice] = useState('')

  const load = useCallback(async () => {
    if (!skillId) return
    setLoading(true)
    setError('')
    try {
      const [detail, t] = await Promise.all([getSkillDetail(skillId), listMyTenants().catch(() => [])])
      setItem(detail)
      setTenants(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load skill')
    } finally {
      setLoading(false)
    }
  }, [skillId])

  useEffect(() => { void load() }, [load])

  async function handleInstall(tenantId: string) {
    if (!skillId) return
    const record = await installSkill(tenantId, skillId)
    setInstallNotice(
      record.status === 'submitted'
        ? 'Install requested — this skill needs approval before it becomes active.'
        : 'Skill installed successfully.'
    )
  }

  async function handleSubmitReview() {
    if (!skillId || !item) return
    setReviewBusy(true)
    setReviewNotice('')
    try {
      await reviewSkill(skillId, reviewRating, reviewText, item.manifest.version)
      setReviewNotice('Review submitted. Thank you!')
      setReviewText('')
    } catch (e) {
      setReviewNotice(e instanceof Error ? e.message : 'Failed to submit review')
    } finally {
      setReviewBusy(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-5 safe-top overflow-y-auto h-[calc(100vh-96px)]">
      <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Marketplace
      </button>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !item ? (
        <ErrorState title="Not found" message="This skill could not be found." />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <SkillDetailPanel item={item} />

          {installNotice && (
            <Card className="p-3.5 border-l-2 border-l-[#7C3AED]">
              <p className="text-xs text-white/70">{installNotice}</p>
            </Card>
          )}

          <Button className="w-full" onClick={() => setShowInstall(true)}>
            Install Skill
          </Button>

          <Card className="p-4">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-3">Leave a Review</p>
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setReviewRating(i + 1)}>
                  <Star className={`w-5 h-5 ${i < reviewRating ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this skill..."
              rows={3}
              className="w-full glass border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 mb-3"
            />
            {reviewNotice && <p className="text-xs text-white/50 mb-3">{reviewNotice}</p>}
            <Button variant="secondary" className="w-full" disabled={!reviewText.trim() || reviewBusy} loading={reviewBusy} onClick={() => void handleSubmitReview()}>
              Submit Review
            </Button>
          </Card>
        </motion.div>
      )}

      <SkillInstallModal
        isOpen={showInstall}
        item={item}
        tenants={tenants}
        onClose={() => setShowInstall(false)}
        onInstall={handleInstall}
      />
    </div>
  )
}
