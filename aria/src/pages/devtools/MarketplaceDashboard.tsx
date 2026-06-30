import { useState, useEffect, useCallback } from 'react'
import {
  listMarketplaceCatalog,
  listInstalledSkills,
  enableSkill,
  disableSkill,
  uninstallSkill,
  revokeSkillPermission,
  getSkillAnalytics,
  type MarketplaceItemRecord,
  type SkillInstallationRecord,
  type SkillAnalyticsSnapshot,
} from '../../lib/marketplaceService'
import { listMyTenants, type TenantRecord } from '../../lib/securityService'
import { InstalledSkillList } from '../../components/marketplace/InstalledSkillList'
import { SkillPermissionList } from '../../components/marketplace/SkillPermissionList'

export default function MarketplaceDashboard() {
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [catalog, setCatalog] = useState<MarketplaceItemRecord[]>([])
  const [installations, setInstallations] = useState<SkillInstallationRecord[]>([])
  const [analytics, setAnalytics] = useState<SkillAnalyticsSnapshot | null>(null)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadTenants = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const t = await listMyTenants()
      setTenants(t)
      if (t.length > 0 && !selectedTenantId) setSelectedTenantId(t[0].tenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }, [selectedTenantId])

  const loadCatalog = useCallback(async () => {
    try {
      const page = await listMarketplaceCatalog({}, 1, 50)
      setCatalog(page.items)
      if (page.items.length > 0 && !selectedItemId) setSelectedItemId(page.items[0].itemId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load catalog')
    }
  }, [selectedItemId])

  const loadTenantData = useCallback(async (tenantId: string) => {
    setLoading(true)
    setError('')
    try {
      const inst = await listInstalledSkills(tenantId)
      setInstallations(inst)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenant data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadTenants(); void loadCatalog() }, [loadTenants, loadCatalog])
  useEffect(() => { if (selectedTenantId) void loadTenantData(selectedTenantId) }, [selectedTenantId, loadTenantData])
  useEffect(() => {
    if (!selectedItemId) return
    void getSkillAnalytics(selectedItemId).then(setAnalytics).catch(() => setAnalytics(null))
  }, [selectedItemId])

  async function handleEnable(installationId: string) {
    if (!selectedTenantId) return
    setBusyId(installationId)
    try {
      await enableSkill(selectedTenantId, installationId)
      await loadTenantData(selectedTenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enable failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDisable(installationId: string) {
    if (!selectedTenantId) return
    setBusyId(installationId)
    try {
      await disableSkill(selectedTenantId, installationId)
      await loadTenantData(selectedTenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Disable failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleUninstall(installationId: string) {
    if (!selectedTenantId) return
    setBusyId(installationId)
    try {
      await uninstallSkill(selectedTenantId, installationId)
      await loadTenantData(selectedTenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Uninstall failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRevokePermission(permissionId: string) {
    if (!selectedTenantId) return
    setBusyId(permissionId)
    try {
      await revokeSkillPermission(selectedTenantId, permissionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revoke failed')
    } finally {
      setBusyId(null)
    }
  }

  const grantedPermissions = installations.flatMap((i) =>
    i.grantedPermissions.map((scope, idx) => ({
      id: `${i.installationId}-${idx}`,
      permissionId: `${i.installationId}-${idx}`,
      tenantId: i.tenantId,
      installationId: i.installationId,
      itemId: i.itemId,
      scope,
      granted: true,
      grantedBy: i.createdBy,
      createdBy: i.createdBy,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }))
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Marketplace Developer Dashboard</h1>
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

        <label className="text-sm text-gray-500 ml-4">Skill (for analytics):</label>
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select a skill...</option>
          {catalog.map((c) => (
            <option key={c.itemId} value={c.itemId}>{c.manifest.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <Stat label="Installs" value={analytics.installs} />
              <Stat label="Uninstalls" value={analytics.uninstalls} />
              <Stat label="Active Users" value={analytics.activeUsers} />
              <Stat label="Errors" value={analytics.errors} />
              <Stat label="Approval Requests" value={analytics.approvalRequests} />
              <Stat label="Permission Grants" value={analytics.permissionGrants} />
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Marketplace Catalog ({catalog.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {catalog.map((c) => (
              <div key={c.itemId} className="bg-white border rounded-lg p-3 text-sm">
                <div className="font-medium">{c.manifest.name}</div>
                <div className="text-xs text-gray-500">{c.manifest.category} &middot; {c.status} &middot; {c.installCount} installs</div>
              </div>
            ))}
          </div>

          {!selectedTenantId ? (
            <div className="text-gray-400">No tenant selected. Select one above to view installations.</div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-3">Installed Skills ({installations.length})</h2>
              <div className="mb-8">
                <InstalledSkillList
                  installations={installations}
                  busyId={busyId}
                  onEnable={(id) => void handleEnable(id)}
                  onDisable={(id) => void handleDisable(id)}
                  onUninstall={(id) => void handleUninstall(id)}
                />
              </div>

              <h2 className="text-lg font-semibold mb-3">Permission Grants ({grantedPermissions.length})</h2>
              <SkillPermissionList grants={grantedPermissions} busyId={busyId} onRevoke={(id) => void handleRevokePermission(id)} />
            </>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xl font-bold text-blue-600">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
