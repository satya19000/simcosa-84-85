import type { BrowserExtensionRegistration } from '../../lib/computerControlService'

interface BrowserExtensionListProps {
  extensions: BrowserExtensionRegistration[]
  onRevoke?: (extensionId: string) => void
  busy?: string | null
}

const PERMISSION_COLORS = {
  pending: 'text-yellow-400',
  granted: 'text-green-400',
  revoked: 'text-red-400',
  expired: 'text-gray-400',
}

export default function BrowserExtensionList({ extensions, onRevoke, busy }: BrowserExtensionListProps) {
  if (extensions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-sm text-gray-400">No browser extensions registered.</p>
        <p className="text-xs text-gray-600 mt-1">Browser Extension Bridge is a PLACEHOLDER — no extension is published yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {extensions.map((ext) => (
        <div key={ext.extensionId} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">{ext.browserName}</span>
                <span className="text-xs text-gray-400">v{ext.version}</span>
                <span className={`text-xs ${PERMISSION_COLORS[ext.permissionStatus]}`}>{ext.permissionStatus}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Extension ID: {ext.extensionId.slice(0, 8)}…</p>
              <p className="text-xs text-gray-500">Registered: {new Date(ext.registeredAt).toLocaleDateString()}</p>
              <p className="text-xs text-yellow-600 mt-1">PLACEHOLDER — no browser extension published</p>
            </div>
            {ext.permissionStatus !== 'revoked' && onRevoke && (
              <button
                onClick={() => onRevoke(ext.extensionId)}
                disabled={busy === ext.extensionId}
                className="shrink-0 text-xs px-2 py-1 rounded bg-red-700/50 hover:bg-red-700 text-red-200 border border-red-700/50 disabled:opacity-50"
              >
                {busy === ext.extensionId ? '…' : 'Revoke'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
