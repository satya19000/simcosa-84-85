import type { ComputerCapabilityDescriptor, ComputerRiskLevel } from '../../lib/computerControlService'

const RISK_BADGE: Record<ComputerRiskLevel, string> = {
  low: 'bg-green-900/40 text-green-300 border border-green-700/50',
  medium: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
  high: 'bg-orange-900/40 text-orange-300 border border-orange-700/50',
  critical: 'bg-red-900/40 text-red-300 border border-red-700/50',
}

interface CapabilityCardProps {
  capability: ComputerCapabilityDescriptor
}

export default function CapabilityCard({ capability }: CapabilityCardProps) {
  const isBlocked = capability.alwaysBlocked ?? false
  const isPolicyBlocked = capability.policyBlocked ?? false

  return (
    <div className={`rounded-lg border p-4 ${isBlocked ? 'border-red-700/50 bg-red-900/10' : 'border-white/10 bg-white/5'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-white">{capability.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${RISK_BADGE[capability.riskLevel]}`}>
          {capability.riskLevel}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3">{capability.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {capability.requiresApproval && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-700/50 text-purple-300">
            Approval Required
          </span>
        )}
        {!capability.reversible && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900/40 border border-orange-700/50 text-orange-300">
            Irreversible
          </span>
        )}
        {isBlocked && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/40 border border-red-700/50 text-red-300 font-semibold">
            ALWAYS BLOCKED
          </span>
        )}
        {isPolicyBlocked && !isBlocked && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/30 border border-red-700/40 text-red-400">
            Policy Blocked
          </span>
        )}
        {capability.auditRequired && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-700/50 text-blue-300">
            Audited
          </span>
        )}
      </div>
    </div>
  )
}
