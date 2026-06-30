import type { SecurityAuditRecord } from '../../lib/securityService'

const RISK_COLOR: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-amber-600',
  high: 'text-red-600',
  critical: 'text-red-800 font-bold',
}

export default function SecurityAuditFeed({ events }: { events: SecurityAuditRecord[] }) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">Action</th>
            <th className="text-left p-2 border">Resource</th>
            <th className="text-left p-2 border">Actor</th>
            <th className="text-left p-2 border">Risk</th>
            <th className="text-left p-2 border">At</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr><td colSpan={5} className="p-2 border text-gray-400">No audit events yet</td></tr>
          ) : events.map((e) => (
            <tr key={e.eventId} className="hover:bg-gray-50">
              <td className="p-2 border capitalize">{e.action.replace(/_/g, ' ')}</td>
              <td className="p-2 border text-xs text-gray-500">{e.resource}</td>
              <td className="p-2 border text-xs text-gray-500">{e.actorId.slice(0, 8)}</td>
              <td className={`p-2 border capitalize ${RISK_COLOR[e.riskLevel] ?? ''}`}>{e.riskLevel}</td>
              <td className="p-2 border">{new Date(e.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
