import { motion } from 'framer-motion'
import { Upload, Shield, FileText, CreditCard, Stethoscope, Briefcase, User, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const categories = [
  { icon: User, label: 'Identity', count: 0, color: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/10' },
  { icon: Stethoscope, label: 'Medical', count: 0, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { icon: CreditCard, label: 'Financial', count: 0, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { icon: FileText, label: 'Legal', count: 0, color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10' },
  { icon: Briefcase, label: 'Work', count: 0, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: FileText, label: 'Personal', count: 0, color: 'text-pink-400', bg: 'bg-pink-400/10' },
]

export default function Vault() {
  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vault</h1>
          <p className="text-xs text-white/40 mt-0.5">AES-256 encrypted · Private</p>
        </div>
        <Button size="sm">
          <Upload className="w-4 h-4" /> Upload
        </Button>
      </div>

      {/* Security banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card glow="violet" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Military-grade encryption</p>
            <p className="text-xs text-white/40">All documents are encrypted before upload</p>
          </div>
          <div className="ml-auto">
            <Lock className="w-4 h-4 text-[#7C3AED]" />
          </div>
        </Card>
      </motion.div>

      {/* Categories */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Categories</h2>
        <div className="grid grid-cols-3 gap-3">
          {categories.map(({ icon: Icon, label, count, color, bg }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all active:scale-95"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs text-white/70 font-medium">{label}</span>
              <span className="text-[10px] text-white/30">{count} files</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent docs placeholder */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Recent Documents</h2>
        <Card className="py-10 text-center">
          <Upload className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">No documents yet</p>
          <p className="text-xs text-white/25 mt-1">Upload your first document to get started</p>
        </Card>
      </div>
    </div>
  )
}
