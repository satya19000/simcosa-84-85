import { useState, useEffect } from 'react'
import { AI_PROVIDER_IDS, type AIPolicyRecord, type AIProviderId } from '../../lib/aiGatewayService'

interface Props {
  policy: AIPolicyRecord | null
  busy: boolean
  onSave: (fields: Partial<Pick<AIPolicyRecord, 'allowedProviders' | 'blockedProviders' | 'maxMonthlySpendUsd' | 'privacyRestriction' | 'localOnlyMode'>>) => void
}

export default function ModelPolicyPanel({ policy, busy, onSave }: Props) {
  const [blocked, setBlocked] = useState<AIProviderId[]>(policy?.blockedProviders ?? [])
  const [maxSpend, setMaxSpend] = useState<string>(policy?.maxMonthlySpendUsd?.toString() ?? '')
  const [localOnly, setLocalOnly] = useState(policy?.localOnlyMode ?? false)

  useEffect(() => {
    setBlocked(policy?.blockedProviders ?? [])
    setMaxSpend(policy?.maxMonthlySpendUsd?.toString() ?? '')
    setLocalOnly(policy?.localOnlyMode ?? false)
  }, [policy])

  function toggleBlocked(p: AIProviderId) {
    setBlocked((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Tenant AI Policy</h3>

      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Blocked providers</div>
        <div className="flex flex-wrap gap-2">
          {AI_PROVIDER_IDS.map((p) => (
            <label key={p} className="flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer">
              <input type="checkbox" checked={blocked.includes(p)} onChange={() => toggleBlocked(p)} />
              <span className="capitalize">{p}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1">Max monthly spend (USD, blank = unlimited)</label>
        <input
          value={maxSpend}
          onChange={(e) => setMaxSpend(e.target.value)}
          placeholder="e.g. 50"
          className="border rounded px-2 py-1 text-sm w-40"
        />
      </div>

      <div className="mb-3">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={localOnly} onChange={(e) => setLocalOnly(e.target.checked)} />
          Local-only mode
          <span className="text-amber-600">(placeholder — fails closed; no functional local provider yet)</span>
        </label>
      </div>

      <button
        onClick={() =>
          onSave({
            blockedProviders: blocked,
            maxMonthlySpendUsd: maxSpend.trim() ? Number(maxSpend) : null,
            localOnlyMode: localOnly,
          })
        }
        disabled={busy}
        className="bg-green-600 text-white text-sm px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {busy ? 'Saving...' : 'Save Policy'}
      </button>
    </div>
  )
}
