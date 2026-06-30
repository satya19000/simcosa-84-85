import type { ComputerActionPlan, ComputerActionStep, ComputerRiskLevel } from '../../lib/computerControlService'

const RISK_COLORS: Record<ComputerRiskLevel, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

interface ActionPlanViewerProps {
  plan: ComputerActionPlan
  onRequestApproval?: (step: ComputerActionStep) => void
  busy?: boolean
}

export default function ActionPlanViewer({ plan, onRequestApproval, busy }: ActionPlanViewerProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Proposed Plan</h3>
        <span className={`text-xs font-semibold ${RISK_COLORS[plan.overallRiskLevel]}`}>
          Risk: {plan.overallRiskLevel.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4 italic">"{plan.intent}"</p>

      <div className="space-y-2">
        {plan.steps.map((step) => (
          <div key={step.stepIndex} className="flex items-start gap-3 p-3 rounded bg-white/5 border border-white/10">
            <span className="text-xs text-gray-500 shrink-0 mt-0.5">{step.stepIndex + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white">{step.description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <code className="text-xs text-purple-300 bg-purple-900/20 px-1 rounded">{step.capabilityId}</code>
                <span className={`text-xs ${RISK_COLORS[step.riskLevel]}`}>{step.riskLevel}</span>
                {step.requiresApproval && (
                  <span className="text-xs text-purple-400">needs approval</span>
                )}
                {!step.reversible && (
                  <span className="text-xs text-orange-400">irreversible</span>
                )}
              </div>
            </div>
            {step.requiresApproval && onRequestApproval && (
              <button
                onClick={() => onRequestApproval(step)}
                disabled={busy}
                className="shrink-0 text-xs px-2 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-50"
              >
                Request Approval
              </button>
            )}
          </div>
        ))}
      </div>

      {plan.requiresApproval && (
        <p className="text-xs text-yellow-400 mt-3">
          One or more steps require explicit user approval before execution.
        </p>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Status: <span className="text-gray-300">{plan.status}</span> — This plan will NOT auto-execute. Explicit approval is required for each flagged step.
      </p>
    </div>
  )
}
