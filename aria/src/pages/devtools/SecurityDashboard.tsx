import { useState, useEffect } from 'react'
import {
  listMyTenants,
  createTenant,
  listRoles,
  listPolicies,
  listSessions,
  revokeSession,
  listAuditEvents,
  getSecurityAnalytics,
  type TenantRecord,
  type RoleRecord,
  type PolicyRecord,
  type SessionRecord,
  type SecurityAuditRecord,
  type SecurityAnalyticsSnapshot,
  type TenantType,
} from '../../lib/securityService'
import RoleList from '../../components/security/RoleList'
import PermissionMatrix from '../../components/security/PermissionMatrix'
import PolicyList from '../../components/security/PolicyList'
import SessionList from '../../components/security/SessionList'
import SecurityAuditFeed from '../../components/security/SecurityAuditFeed'

const TENANT_TYPES: TenantType[] = ['personal', 'organization', 'enterprise', 'government', 'healthcare', 'education']

export default function SecurityDashboard() {
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [policies, setPolicies] = useState<PolicyRecord[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [auditEvents, setAuditEvents] = useState<SecurityAuditRecord[]>([])
  const [analytics, setAnalytics] = useState<SecurityAnalyticsSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantType, setNewTenantType] = useState<TenantType>('personal')

  useEffect(() => {
    void loadTenants()
  }, [])

  useEffect(() => {
    if (selectedTenantId) void loadTenantData(selectedTenantId)
  }, [selectedTenantId])

  async function loadTenants() {
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
  }

  async function loadTenantData(tenantId: string) {
    setLoading(true)
    setError('')
    try {
      const [r, p, s, a, an] = await Promise.all([
        listRoles(tenantId),
        listPolicies(tenantId),
        listSessions(tenantId),
        listAuditEvents(tenantId, 50),
        getSecurityAnalytics(tenantId),
      ])
      setRoles(r)
      setPolicies(p)
      setSessions(s)
      setAuditEvents(a)
      setAnalytics(an)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenant data')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTenant() {
    if (!newTenantName.trim()) return
    setBusyId('create-tenant')
    try {
      const tenant = await createTenant({ name: newTenantName.trim(), tenantType: newTenantType })
      setNewTenantName('')
      await loadTenants()
      setSelectedTenantId(tenant.tenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create tenant failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!selectedTenantId) return
    setBusyId(sessionId)
    try {
      await revokeSession(selectedTenantId, sessionId)
      await loadTenantData(selectedTenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revoke session failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Security Developer Dashboard</h1>
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

        <div className="flex items-center gap-2 ml-auto">
          <input
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            placeholder="New tenant name"
            className="border rounded px-2 py-1 text-sm"
          />
          <select
            value={newTenantType}
            onChange={(e) => setNewTenantType(e.target.value as TenantType)}
            className="border rounded px-2 py-1 text-sm"
          >
            {TENANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={() => void handleCreateTenant()}
            disabled={!newTenantName.trim() || busyId === 'create-tenant'}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Create Tenant
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : !selectedTenantId ? (
        <div className="text-gray-400">No tenant selected. Create or select one above.</div>
      ) : (
        <>
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <Stat label="Identities" value={analytics.identityCount} />
              <Stat label="Active Sessions" value={analytics.activeSessionCount} />
              <Stat label="Roles" value={analytics.roleCount} />
              <Stat label="Policies" value={analytics.policyCount} />
              <Stat label="Recent Audit Events" value={analytics.recentAuditEventCount} />
              <Stat label="High-Risk Events" value={analytics.highRiskAuditEventCount} />
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Roles ({roles.length})</h2>
          <RoleList roles={roles} />

          <h2 className="text-lg font-semibold mb-3">Permission Matrix</h2>
          <PermissionMatrix roles={roles} />

          <h2 className="text-lg font-semibold mb-3">Policies ({policies.length})</h2>
          <PolicyList policies={policies} />

          <h2 className="text-lg font-semibold mb-3">Sessions ({sessions.length})</h2>
          <SessionList sessions={sessions} busyId={busyId} onRevoke={handleRevokeSession} />

          <h2 className="text-lg font-semibold mb-3">Security Audit Log ({auditEvents.length})</h2>
          <SecurityAuditFeed events={auditEvents} />
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
