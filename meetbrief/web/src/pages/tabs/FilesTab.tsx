import { useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { Download } from "lucide-react";
import { formatBytes, formatDuration, type Meeting } from "@meetbrief/shared";
import { storage } from "../../lib/firebase";
import { useFiles, useSegments } from "../../lib/data";
import { Banner, Button, Card, EmptyState } from "../../components/ui";

async function open(path: string) {
  window.open(await getDownloadURL(ref(storage, path)), "_blank", "noopener");
}

export function FilesTab({ meeting: m }: { meeting: Meeting }) {
  const files = useFiles(m.id);
  const segments = useSegments(m.id);
  const [error, setError] = useState<string>();
  const go = (path: string) => open(path).catch((e: Error) => setError(e.message));

  return (
    <div className="space-y-5 pt-5">
      {error && <Banner tone="error">{error}</Banner>}
      <Card>
        <h2 className="mb-3 text-lg font-bold">Original audio</h2>
        <p className="mb-3 text-sm text-muted">Originals are kept unchanged. Recorded audio is stored in short chunks per segment.</p>
        {segments.data.length === 0 ? (
          <EmptyState title="No audio yet" />
        ) : (
          <ul className="divide-y divide-line">
            {segments.data.map((s) => (
              <li key={s.index} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <span className="font-medium">{s.kind === "file" ? s.originalFileName : `Recorded segment ${s.index + 1}`}</span>
                  <span className="block text-sm text-muted">
                    {s.durationMs ? formatDuration(s.durationMs) : ""} {s.bytes ? `· ${formatBytes(s.bytes)}` : ""} {s.kind === "chunks" ? `· ${s.chunkCount} chunks` : ""} · {s.status}
                  </span>
                </span>
                {s.kind === "file" && s.objectPath && s.status === "uploaded" && (
                  <Button size="sm" variant="secondary" onClick={() => go(s.objectPath!)}><Download size={16} aria-hidden /> Download</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-bold">Generated files</h2>
        {files.data.length === 0 ? (
          <EmptyState title="Nothing generated yet">Exports from the Minutes tab appear here.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {files.data.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <span className="font-medium">{f.label}</span>
                  <span className="block text-sm text-muted">{f.format.toUpperCase()}{f.bytes ? ` · ${formatBytes(f.bytes)}` : ""} · {new Date(f.createdAt).toLocaleString("en-IN")}</span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => go(f.path)}><Download size={16} aria-hidden /> Open</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
