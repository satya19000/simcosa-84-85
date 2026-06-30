import type { SessionRecord } from '../../lib/securityService'

export default function SessionList({
  sessions, busyId, onRevoke,
}: {
  sessions: SessionRecord[]
  busyId?: string | null
  onRevoke?: (sessionId: string) => void
}) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">Identity</th>
            <th className="text-left p-2 border">Device</th>
            <th className="text-left p-2 border">Browser</th>
            <th className="text-left p-2 border">Login</th>
            <th className="text-left p-2 border">Last Active</th>
            <th className="text-left p-2 border">Active</th>
            {onRevoke && <th className="text-left p-2 border">Action</th>}
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr><td colSpan={onRevoke ? 7 : 6} className="p-2 border text-gray-400">No sessions yet</td></tr>
          ) : sessions.map((s) => (
            <tr key={s.sessionId} className="hover:bg-gray-50">
              <td className="p-2 border text-xs text-gray-500">{s.identityId.slice(0, 8)}</td>
              <td className="p-2 border">{s.deviceInfo ?? '-'}</td>
              <td className="p-2 border">{s.browser ?? '-'}</td>
              <td className="p-2 border">{new Date(s.loginAt).toLocaleString()}</td>
              <td className="p-2 border">{new Date(s.lastActiveAt).toLocaleString()}</td>
              <td className="p-2 border">{s.active ? 'Active' : 'Revoked'}</td>
              {onRevoke && (
                <td className="p-2 border">
                  {s.active && (
                    <button
                      onClick={() => onRevoke(s.sessionId)}
                      disabled={busyId === s.sessionId}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
