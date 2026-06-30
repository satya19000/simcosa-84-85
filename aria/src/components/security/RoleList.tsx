import type { RoleRecord } from '../../lib/securityService'

export default function RoleList({ roles }: { roles: RoleRecord[] }) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">Name</th>
            <th className="text-left p-2 border">Scope</th>
            <th className="text-left p-2 border">Permissions</th>
            <th className="text-left p-2 border">Inherits From</th>
            <th className="text-left p-2 border">System</th>
            <th className="text-left p-2 border">Created</th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 ? (
            <tr><td colSpan={6} className="p-2 border text-gray-400">No roles yet</td></tr>
          ) : roles.map((r) => (
            <tr key={r.roleId} className="hover:bg-gray-50">
              <td className="p-2 border font-medium">{r.name}</td>
              <td className="p-2 border capitalize">{r.scope}</td>
              <td className="p-2 border text-xs text-gray-600">{r.permissions.join(', ') || '-'}</td>
              <td className="p-2 border text-xs text-gray-500">{r.inheritsFrom ?? '-'}</td>
              <td className="p-2 border">{r.isSystem ? 'Yes' : 'No'}</td>
              <td className="p-2 border">{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
