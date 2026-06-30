interface SafetyWarningProps {
  capabilityId?: string
  message?: string
}

export default function SafetyWarning({ capabilityId, message }: SafetyWarningProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-900/30 border border-red-700/50">
      <span className="text-red-400 text-lg mt-0.5">⛔</span>
      <div>
        <p className="text-red-300 font-semibold text-sm">Safety Block</p>
        {capabilityId && <p className="text-red-400 text-xs mt-0.5">Capability: <code className="bg-red-900/30 px-1 rounded">{capabilityId}</code></p>}
        {message && <p className="text-red-400 text-xs mt-1">{message}</p>}
        <p className="text-red-500 text-xs mt-2">credentialAccess is unconditionally blocked and cannot be approved or overridden under any condition.</p>
      </div>
    </div>
  )
}
