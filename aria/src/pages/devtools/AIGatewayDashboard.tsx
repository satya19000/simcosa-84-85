import { useState, useEffect } from 'react'
import { listMyTenants, type TenantRecord } from '../../lib/securityService'
import {
  listAIProviders,
  listAIModels,
  testAIProvider,
  getAIUsage,
  updateModelPolicy,
  type AIProviderId,
  type ModelDescriptor,
  type AIUsageRecord,
  type ProviderHealthRecord,
  type AIPolicyRecord,
} from '../../lib/aiGatewayService'
import ProviderHealthCard from '../../components/ai-gateway/ProviderHealthCard'
import ModelCatalogTable from '../../components/ai-gateway/ModelCatalogTable'
import UsageChart from '../../components/ai-gateway/UsageChart'
import ModelPolicyPanel from '../../components/ai-gateway/ModelPolicyPanel'
import FallbackChainView from '../../components/ai-gateway/FallbackChainView'

export default function AIGatewayDashboard() {
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [providers, setProviders] = useState<AIProviderId[]>([])
  const [models, setModels] = useState<ModelDescriptor[]>([])
  const [usage, setUsage] = useState<AIUsageRecord[]>([])
  const [health, setHealth] = useState<Record<string, ProviderHealthRecord | null>>({})
  const [policy, setPolicy] = useState<AIPolicyRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadTenants()
    void loadCatalog()
  }, [])

  useEffect(() => {
    if (selectedTenantId) void loadTenantData(selectedTenantId)
  }, [selectedTenantId])

  async function loadTenants() {
    try {
      const t = await listMyTenants()
      setTenants(t)
      if (t.length > 0 && !selectedTenantId) setSelectedTenantId(t[0].tenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenants')
    }
  }

  async function loadCatalog() {
    try {
      const [p, m] = await Promise.all([listAIProviders(), listAIModels()])
      setProviders(p)
      setModels(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load AI catalog')
    } finally {
      setLoading(false)
    }
  }

  async function loadTenantData(tenantId: string) {
    setLoading(true)
    setError('')
    try {
      const u = await getAIUsage(tenantId, 100)
      setUsage(u)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenant AI data')
    } finally {
      setLoading(false)
    }
  }

  async function handleTestProvider(providerId: AIProviderId) {
    if (!selectedTenantId) return
    setBusyId(`test-${providerId}`)
    try {
      const record = await testAIProvider(selectedTenantId, providerId)
      setHealth((prev) => ({ ...prev, [providerId]: record }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Provider health check failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleSavePolicy(fields: Parameters<typeof updateModelPolicy>[1]) {
    if (!selectedTenantId) return
    setBusyId('save-policy')
    try {
      const updated = await updateModelPolicy(selectedTenantId, fields)
      setPolicy(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Policy update failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Gateway Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Multi-LLM routing, provider health, usage/cost, and policy. Local LLM provider is a placeholder — not functional.
          </p>
        </div>
        <button
          onClick={() => (selectedTenantId ? void loadTenantData(selectedTenantId) : void loadTenants())}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      <div className="bg-white border rounded-lg p-4 mb-8 flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-500">Tenant:</label>
        <select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select a tenant...</option>
          {tenants.map((t) => (
            <option key={t.tenantId} value={t.tenantId}>{t.name} ({t.tenantType})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-3">Provider Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {providers.map((p) => (
              <ProviderHealthCard
                key={p}
                providerId={p}
                record={health[p] ?? null}
                busy={busyId === `test-${p}`}
                onTest={handleTestProvider}
              />
            ))}
          </div>

          <h2 className="text-lg font-semibold mb-3">Model Catalog ({models.length})</h2>
          <div className="mb-8">
            <ModelCatalogTable models={models} />
          </div>

          {!selectedTenantId ? (
            <div className="text-gray-400">Select a tenant to view usage, fallback activity, and policy.</div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-3">Usage & Cost</h2>
              <div className="mb-8">
                <UsageChart usage={usage} />
              </div>

              <h2 className="text-lg font-semibold mb-3">Fallback Events</h2>
              <div className="mb-8">
                <FallbackChainView usage={usage} />
              </div>

              <h2 className="text-lg font-semibold mb-3">Policy</h2>
              <div className="mb-8">
                <ModelPolicyPanel policy={policy} busy={busyId === 'save-policy'} onSave={handleSavePolicy} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
