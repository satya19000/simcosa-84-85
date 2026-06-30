import { useState } from 'react'
import type { ComputerActionStep } from '../../lib/computerControlService'
import { requestComputerApproval } from '../../lib/computerControlService'

interface ComputerApprovalPanelProps {
  tenantId: string
  planId: string
  pendingStep: ComputerActionStep | null
  onApprovalRequested: (approvalId: string) => void
  onClose: () => void
}

export default function ComputerApprovalPanel({
  tenantId, planId, pendingStep, onApprovalRequested, onClose,
}: ComputerApprovalPanelProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!pendingStep) return null

  async function handleRequest() {
    if (!pendingStep) return
    setBusy(true)
    setError('')
    try {
      const result = await requestComputerApproval({
        tenantId,
        planId,
        stepIndex: pendingStep.stepIndex,
        capabilityId: pendingStep.capabilityId,
        riskLevel: pendingStep.riskLevel,
        description: pendingStep.description,
        reason: `User requested computer action: ${pendingStep.description}`,
        irreversible: !pendingStep.reversible,
      })
      onApprovalRequested(result.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-purple-700/50 bg-purple-900/20 p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Approval Required</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
      </div>

      <p className="text-xs text-gray-300 mb-2">{pendingStep.description}</p>
      <div className="flex gap-2 flex-wrap mb-3">
        <code className="text-xs text-purple-300 bg-purple-900/30 px-1 rounded">{pendingStep.capabilityId}</code>
        <span className="text-xs text-yellow-400">{pendingStep.riskLevel} risk</span>
        {!pendingStep.reversible && <span className="text-xs text-orange-400">Irreversible</span>}
      </div>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <p className="text-xs text-gray-500 mb-3">
        This will create an approval request in the ARIA Approval System.
        ARIA will not execute this action until you explicitly approve it.
      </p>

      <button
        onClick={handleRequest}
        disabled={busy}
        className="w-full text-sm py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-50 font-medium"
      >
        {busy ? 'Requesting...' : 'Request Approval'}
      </button>
    </div>
  )
}
