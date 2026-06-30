import { PERMISSION_ACTIONS, type RoleRecord } from '../../lib/securityService'

export default function PermissionMatrix({ roles }: { roles: RoleRecord[] }) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border sticky left-0 bg-gray-50">Permission</th>
            {roles.map((r) => (
              <th key={r.roleId} className="text-left p-2 border whitespace-nowrap">{r.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_ACTIONS.map((action) => (
            <tr key={action} className="hover:bg-gray-50">
              <td className="p-2 border font-mono sticky left-0 bg-white">{action}</td>
              {roles.map((r) => (
                <td key={r.roleId} className="p-2 border text-center">
                  {r.permissions.includes(action) ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-gray-300">·</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
