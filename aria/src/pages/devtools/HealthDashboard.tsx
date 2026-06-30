import { useState, useEffect } from 'react'
import {
  getHealthProviderHealth,
  listHealthProviders,
  listPatients,
  listHealthFacilities,
  listDiseases,
  listHealthPrograms,
  getHealthStats,
  listHealthSuggestions,
  dismissHealthSuggestion,
  type ProviderHealth,
  type Patient,
  type HealthFacility,
  type DiseaseInfo,
  type HealthProgram,
  type HealthStats,
  type HealthSuggestion,
} from '../../lib/healthService'

export default function HealthDashboard() {
  const [providers, setProviders] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [health, setHealth] = useState<ProviderHealth[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [facilities, setFacilities] = useState<HealthFacility[]>([])
  const [diseases, setDiseases] = useState<DiseaseInfo[]>([])
  const [programs, setPrograms] = useState<HealthProgram[]>([])
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [suggestions, setSuggestions] = useState<HealthSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [p, h, pts, f, d, pr, s, sg] = await Promise.all([
        listHealthProviders(),
        getHealthProviderHealth(),
        listPatients(50),
        listHealthFacilities(),
        listDiseases(),
        listHealthPrograms(),
        getHealthStats(),
        listHealthSuggestions(),
      ])
      setProviders(p)
      setHealth(h)
      setPatients(pts)
      setFacilities(f)
      setDiseases(d)
      setPrograms(pr)
      setStats(s)
      setSuggestions(sg)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleDismiss(suggestionId: string) {
    setDismissing(suggestionId)
    try {
      await dismissHealthSuggestion(suggestionId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dismiss failed')
    } finally {
      setDismissing(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Healthcare Developer Dashboard</h1>
        <button
          onClick={() => void load()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Stat label="Total Patients" value={stats.totalPatients} />
              <Stat label="Upcoming Appointments" value={stats.upcomingAppointments} />
              <Stat label="Medication Adherence" value={`${Math.round(stats.medicationAdherenceRate * 100)}%`} />
              <Stat label="Vaccination Coverage" value={`${Math.round(stats.vaccinationCoverage * 100)}%`} />
              <Stat label="Pending Follow-ups" value={stats.pendingFollowUps} />
              <Stat label="Facilities" value={stats.facilitiesCount} />
              <Stat label="Registered Plugins" value={programs.length} />
              <Stat label="Pending Suggestions" value={suggestions.length} />
            </div>
          )}

          <h2 className="text-lg font-semibold mb-3">Registered Health Data Providers</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Provider</th>
                  <th className="text-left p-2 border">Type</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {providers.length === 0 ? (
                  <tr><td colSpan={4} className="p-2 border text-gray-400">No providers registered yet</td></tr>
                ) : providers.map((p) => {
                  const h = health.find((x) => x.providerId === p.id)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{p.name}</td>
                      <td className="p-2 border capitalize">{p.type.replace('_', ' ')}</td>
                      <td className="p-2 border">{h?.status ?? 'unknown'}</td>
                      <td className="p-2 border">{h?.lastCheckedAt ? new Date(h.lastCheckedAt).toLocaleString() : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold mb-3">Registered Public Health Plugins / Programs ({programs.length})</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Program</th>
                  <th className="text-left p-2 border">Description</th>
                  <th className="text-left p-2 border">Diseases Tracked</th>
                </tr>
              </thead>
              <tbody>
                {programs.length === 0 ? (
                  <tr><td colSpan={3} className="p-2 border text-gray-400">No programs registered yet</td></tr>
                ) : programs.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{p.name}</td>
                    <td className="p-2 border">{p.description ?? '-'}</td>
                    <td className="p-2 border">{p.diseaseIds?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold mb-3">Patients ({patients.length})</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Name</th>
                  <th className="text-left p-2 border">DOB</th>
                  <th className="text-left p-2 border">Allergies</th>
                  <th className="text-left p-2 border">Medical History</th>
                  <th className="text-left p-2 border">Updated</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr><td colSpan={5} className="p-2 border text-gray-400">No patients yet</td></tr>
                ) : patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{p.demographics.fullName}</td>
                    <td className="p-2 border">{p.demographics.dateOfBirth ?? '-'}</td>
                    <td className="p-2 border">{p.allergies.length}</td>
                    <td className="p-2 border">{p.medicalHistory.length}</td>
                    <td className="p-2 border">{new Date(p.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">Facilities ({facilities.length})</h3>
              {facilities.length === 0 ? (
                <div className="text-gray-400 text-sm">No facilities yet</div>
              ) : facilities.map((f) => (
                <div key={f.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-gray-600">{f.name}</span>
                  <span className="font-medium capitalize">{f.type.replace('_', ' ')}</span>
                </div>
              ))}
              {stats && (
                <div className="mt-3 pt-3 border-t">
                  {Object.entries(stats.byFacilityType).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs py-1 text-gray-500">
                      <span className="capitalize">{k.replace('_', ' ')}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">Disease Knowledge Base ({diseases.length})</h3>
              {diseases.length === 0 ? (
                <div className="text-gray-400 text-sm">No diseases registered yet</div>
              ) : diseases.map((d) => (
                <div key={d.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-gray-600">{d.name}</span>
                  <span className="font-medium">{d.symptoms.length} symptoms</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-3">Pending Suggestions — Require Approval ({suggestions.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border">Type</th>
                  <th className="text-left p-2 border">Title</th>
                  <th className="text-left p-2 border">Description</th>
                  <th className="text-left p-2 border">Created</th>
                  <th className="text-left p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.length === 0 ? (
                  <tr><td colSpan={5} className="p-2 border text-gray-400">No pending suggestions</td></tr>
                ) : suggestions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-2 border capitalize">{s.type.replace(/_/g, ' ')}</td>
                    <td className="p-2 border">{s.title}</td>
                    <td className="p-2 border truncate max-w-xs">{s.description}</td>
                    <td className="p-2 border">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="p-2 border">
                      <button
                        onClick={() => void handleDismiss(s.id)}
                        disabled={dismissing === s.id}
                        className="text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {dismissing === s.id ? 'Dismissing...' : 'Dismiss'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
