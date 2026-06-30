import type { PolicyRecord } from '../../lib/securityService'

const RESULT_COLOR: Record<string, string> = {
  allow: 'text-green-600',
  deny: 'text-red-600',
  requireApproval: 'text-amber-600',
  requireElevatedRole: 'text-purple-600',
  auditOnly: 'text-blue-600',
}

export default function PolicyList({ policies }: { policies: PolicyRecord[] }) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">Name</th>
            <th className="text-left p-2 border">Action</th>
            <th className="text-left p-2 border">Result</th>
            <th className="text-left p-2 border">Required Role</th>
            <th className="text-left p-2 border">Enabled</th>
            <th className="text-left p-2 border">Updated</th>
          </tr>
        </thead>
        <tbody>
          {policies.length === 0 ? (
            <tr><td colSpan={6} className="p-2 border text-gray-400">No policies yet</td></tr>
          ) : policies.map((p) => (
            <tr key={p.policyId} className="hover:bg-gray-50">
              <td className="p-2 border font-medium">{p.name}</td>
              <td className="p-2 border font-mono text-xs">{p.action}</td>
              <td className={`p-2 border font-medium ${RESULT_COLOR[p.result] ?? ''}`}>{p.result}</td>
              <td className="p-2 border text-xs text-gray-500">{p.requiredRole ?? '-'}</td>
              <td className="p-2 border">{p.enabled ? 'Yes' : 'No'}</td>
              <td className="p-2 border">{new Date(p.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
