import { useState, useEffect } from 'react'
import { listMyTenants, type TenantRecord } from '../../lib/securityService'
import {
  listComputerCapabilities,
  listLocalAgents,
  revokeLocalAgent,
  listBrowserExtensions,
  revokeBrowserExtension,
  planComputerAction,
  registerLocalAgent,
  registerBrowserExtension,
  type ComputerCapabilityDescriptor,
  type LocalAgentRegistration,
  type BrowserExtensionRegistration,
  type ComputerActionPlan,
  type ComputerActionStep,
} from '../../lib/computerControlService'
import CapabilityCard from '../../components/computer-control/CapabilityCard'
import ActionPlanViewer from '../../components/computer-control/ActionPlanViewer'
import ComputerApprovalPanel from '../../components/computer-control/ComputerApprovalPanel'
import LocalAgentList from '../../components/computer-control/LocalAgentList'
import BrowserExtensionList from '../../components/computer-control/BrowserExtensionList'
import SafetyWarning from '../../components/computer-control/SafetyWarning'
import LiveComputerAuditFeed from '../../components/computer-control/LiveComputerAuditFeed'

export default function ComputerControlDashboard() {
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [capabilities, setCapabilities] = useState<ComputerCapabilityDescriptor[]>([])
  const [agents, setAgents] = useState<LocalAgentRegistration[]>([])
  const [extensions, setExtensions] = useState<BrowserExtensionRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [busyAgent, setBusyAgent] = useState<string | null>(null)
  const [busyExt, setBusyExt] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Planning
  const [intent, setIntent] = useState('')
  const [plan, setPlan] = useState<ComputerActionPlan | null>(null)
  const [planBusy, setPlanBusy] = useState(false)
  const [pendingStep, setPendingStep] = useState<ComputerActionStep | null>(null)
  const [planError, setPlanError] = useState('')
  const [approvalIds, setApprovalIds] = useState<Record<number, string>>({})

  // Register forms
  const [agentDeviceId, setAgentDeviceId] = useState('')
  const [agentPublicKey, setAgentPublicKey] = useState('')
  const [extBrowser, setExtBrowser] = useState('')
  const [extVersion, setExtVersion] = useState('')
  const [regBusy, setRegBusy] = useState(false)

  useEffect(() => {
    void loadTenants()
    void loadCapabilities()
  }, [])

  useEffect(() => {
    if (selectedTenantId) {
      void loadAgents()
      void loadExtensions()
    }
  }, [selectedTenantId])

  async function loadTenants() {
    try {
      const t = await listMyTenants()
      setTenants(t)
      if (t.length > 0) setSelectedTenantId(t[0].tenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenants')
    }
  }

  async function loadCapabilities() {
    try {
      const caps = await listComputerCapabilities()
      setCapabilities(caps)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load capabilities')
    } finally {
      setLoading(false)
    }
  }

  async function loadAgents() {
    try {
      const list = await listLocalAgents(selectedTenantId)
      setAgents(list)
    } catch { /* non-critical */ }
  }

  async function loadExtensions() {
    try {
      const list = await listBrowserExtensions(selectedTenantId)
      setExtensions(list)
    } catch { /* non-critical */ }
  }

  async function handlePlan() {
    if (!selectedTenantId || !intent.trim()) return
    setPlanBusy(true)
    setPlanError('')
    setPlan(null)
    try {
      const result = await planComputerAction(selectedTenantId, intent)
      setPlan(result)
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : 'Planning failed')
    } finally {
      setPlanBusy(false)
    }
  }

  async function handleRevokeAgent(agentId: string) {
    setBusyAgent(agentId)
    try {
      await revokeLocalAgent(selectedTenantId, agentId)
      await loadAgents()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revoke failed')
    } finally {
      setBusyAgent(null)
    }
  }

  async function handleRevokeExtension(extensionId: string) {
    setBusyExt(extensionId)
    try {
      await revokeBrowserExtension(selectedTenantId, extensionId)
      await loadExtensions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revoke failed')
    } finally {
      setBusyExt(null)
    }
  }

  async function handleRegisterAgent() {
    if (!agentDeviceId.trim() || !agentPublicKey.trim() || !selectedTenantId) return
    setRegBusy(true)
    try {
      await registerLocalAgent(selectedTenantId, agentDeviceId, agentPublicKey, [])
      setAgentDeviceId('')
      setAgentPublicKey('')
      await loadAgents()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setRegBusy(false)
    }
  }

  async function handleRegisterExtension() {
    if (!extBrowser.trim() || !extVersion.trim() || !selectedTenantId) return
    setRegBusy(true)
    try {
      await registerBrowserExtension(selectedTenantId, extBrowser, extVersion, [])
      setExtBrowser('')
      setExtVersion('')
      await loadExtensions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setRegBusy(false)
    }
  }

  const alwaysBlockedCapabilities = capabilities.filter((c) => c.alwaysBlocked)
  const availableCapabilities = capabilities.filter((c) => !c.alwaysBlocked)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Computer Control Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Computer Control Foundation — safe, permissioned, approval-gated computer/browser assistance.
            Desktop Agent and Browser Extension are PLACEHOLDERS not yet implemented.
          </p>
        </div>
        <button
          onClick={() => { void loadCapabilities(); if (selectedTenantId) { void loadAgents(); void loadExtensions() } }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {/* Tenant selector */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8 flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-400">Tenant:</label>
        <select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          className="border border-white/20 rounded px-2 py-1 text-sm bg-white/10 text-white"
        >
          <option value="">Select a tenant...</option>
          {tenants.map((t) => (
            <option key={t.tenantId} value={t.tenantId}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading capabilities...</div>
      ) : (
        <>
          {/* Safety warnings */}
          {alwaysBlockedCapabilities.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-red-400">Always-Blocked Capabilities</h2>
              {alwaysBlockedCapabilities.map((cap) => (
                <SafetyWarning key={cap.id} capabilityId={cap.id} message={cap.description} />
              ))}
            </div>
          )}

          {/* Capability registry */}
          <h2 className="text-lg font-semibold mb-3">Capability Registry ({availableCapabilities.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {availableCapabilities.map((cap) => (
              <CapabilityCard key={cap.id} capability={cap} />
            ))}
          </div>

          {/* Action planner */}
          {selectedTenantId && (
            <>
              <h2 className="text-lg font-semibold mb-3">Action Planner</h2>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-3">
                  Describe what you want ARIA to help you do. A proposed plan will be created — it will NOT auto-execute.
                </p>
                <div className="flex gap-3">
                  <input
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="e.g. Open the vaccination report and prepare a summary"
                    className="flex-1 rounded px-3 py-2 text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500"
                  />
                  <button
                    onClick={handlePlan}
                    disabled={planBusy || !intent.trim() || !selectedTenantId}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                  >
                    {planBusy ? 'Planning...' : 'Plan'}
                  </button>
                </div>
                {planError && <p className="text-xs text-red-400 mt-2">{planError}</p>}
              </div>

              {plan && (
                <div className="mb-8 space-y-4">
                  <ActionPlanViewer
                    plan={plan}
                    onRequestApproval={setPendingStep}
                    busy={planBusy}
                  />
                  {pendingStep && (
                    <ComputerApprovalPanel
                      tenantId={selectedTenantId}
                      planId={plan.planId}
                      pendingStep={pendingStep}
                      onApprovalRequested={(id) => {
                        setApprovalIds((prev) => ({ ...prev, [pendingStep.stepIndex]: id }))
                        setPendingStep(null)
                      }}
                      onClose={() => setPendingStep(null)}
                    />
                  )}
                  {Object.keys(approvalIds).length > 0 && (
                    <div className="text-xs text-gray-400 p-2 bg-white/5 rounded border border-white/10">
                      Approval requests: {Object.entries(approvalIds).map(([i, id]) => (
                        <span key={i} className="ml-2 text-purple-300">Step {+i + 1}: {id.slice(0, 8)}…</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Local agents */}
              <h2 className="text-lg font-semibold mb-3">Local Agents (Placeholder)</h2>
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded text-xs text-yellow-400">
                Local Desktop Agent is a PLACEHOLDER — no binary or installer exists. Registrations are stored for future use.
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    value={agentDeviceId}
                    onChange={(e) => setAgentDeviceId(e.target.value)}
                    placeholder="Device ID"
                    className="flex-1 min-w-32 rounded px-2 py-1 text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500"
                  />
                  <input
                    value={agentPublicKey}
                    onChange={(e) => setAgentPublicKey(e.target.value)}
                    placeholder="Public Key (placeholder)"
                    className="flex-1 min-w-48 rounded px-2 py-1 text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500"
                  />
                  <button
                    onClick={handleRegisterAgent}
                    disabled={regBusy || !agentDeviceId.trim() || !agentPublicKey.trim()}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                  >
                    Register Agent
                  </button>
                </div>
              </div>
              <div className="mb-8">
                <LocalAgentList agents={agents} onRevoke={handleRevokeAgent} busy={busyAgent} />
              </div>

              {/* Browser extensions */}
              <h2 className="text-lg font-semibold mb-3">Browser Extensions (Placeholder)</h2>
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded text-xs text-yellow-400">
                Browser Extension Bridge is a PLACEHOLDER — no extension is published. Registrations are stored for future use.
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    value={extBrowser}
                    onChange={(e) => setExtBrowser(e.target.value)}
                    placeholder="Browser name (e.g. Chrome)"
                    className="flex-1 min-w-32 rounded px-2 py-1 text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500"
                  />
                  <input
                    value={extVersion}
                    onChange={(e) => setExtVersion(e.target.value)}
                    placeholder="Version (e.g. 1.0.0)"
                    className="w-32 rounded px-2 py-1 text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500"
                  />
                  <button
                    onClick={handleRegisterExtension}
                    disabled={regBusy || !extBrowser.trim() || !extVersion.trim()}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                  >
                    Register Extension
                  </button>
                </div>
              </div>
              <div className="mb-8">
                <BrowserExtensionList extensions={extensions} onRevoke={handleRevokeExtension} busy={busyExt} />
              </div>
            </>
          )}
          {selectedTenantId && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Live Audit Feed</h2>
              <LiveComputerAuditFeed tenantId={selectedTenantId} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
