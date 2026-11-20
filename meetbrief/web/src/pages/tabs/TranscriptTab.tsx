import { useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { Pencil } from "lucide-react";
import { formatDuration, type Meeting, type Utterance } from "@meetbrief/shared";
import { db } from "../../lib/firebase";
import { updateMeeting, useTranscript } from "../../lib/data";
import { Banner, Button, EmptyState, Input, Textarea } from "../../components/ui";

export function TranscriptTab({ meeting: m, onSeek }: { meeting: Meeting; onSeek: (ms: number) => void }) {
  const pages = useTranscript(m.id);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<string>();
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState<string>();

  const rows = useMemo(() => pages.data.flatMap((p) => p.utterances.map((u) => ({ u, pageId: p.id }))), [pages.data]);
  const speakers = useMemo(() => [...new Set(rows.map((r) => r.u.speaker).filter(Boolean))], [rows]);
  const visible = filter ? rows.filter((r) => r.u.text.toLowerCase().includes(filter.toLowerCase())) : rows;
  const name = (label: string) => (label ? m.speakerNames?.[label] || `Speaker ${label.replace(/^S/, "")}` : "");

  const saveEdit = async (pageId: string, id: string) => {
    const page = pages.data.find((p) => p.id === pageId);
    if (!page) return;
    const utterances: Utterance[] = page.utterances.map((u) => (u.id === id ? { ...u, text: draft.trim(), edited: true } : u));
    try {
      await updateDoc(doc(db, "meetings", m.id, "transcriptPages", pageId), { utterances });
      setEditing(undefined);
    } catch (e) {
      setError(`Could not save: ${(e as Error).message}`);
    }
  };

  if (pages.loading) return <p className="pt-5 text-muted">Loading transcript…</p>;
  if (!rows.length) return <div className="pt-5"><EmptyState title="No transcript yet">It appears here after processing.</EmptyState></div>;

  return (
    <div className="space-y-4 pt-5">
      <div className="no-print flex flex-wrap items-center gap-3">
        <Input type="search" aria-label="Find in transcript" placeholder="Find in transcript…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />
        {speakers.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setRenaming(!renaming)}>
            Name speakers
          </Button>
        )}
        <span className="text-sm text-muted">
          {pages.data[0]?.provider === "mock" ? "Demo transcription" : `Transcribed with ${pages.data[0]?.provider} ${pages.data[0]?.model}`}
        </span>
      </div>
      {error && <Banner tone="error">{error}</Banner>}
      {renaming && (
        <form
          className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const names = Object.fromEntries(speakers.map((s) => [s, String(fd.get(s) ?? "").trim()]).filter(([, v]) => v));
            await updateMeeting(m.id, { speakerNames: names });
            setRenaming(false);
          }}
        >
          {speakers.map((s) => (
            <label key={s} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-sm text-muted">Speaker {s.replace(/^S/, "")}</span>
              <Input name={s} defaultValue={m.speakerNames?.[s] ?? ""} placeholder="e.g. Collector" />
            </label>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" size="sm">Save names</Button>
          </div>
        </form>
      )}
      <ol className="space-y-1">
        {visible.map(({ u, pageId }) => (
          <li key={u.id} className="group grid grid-cols-[4.5rem_1fr] gap-3 rounded-xl px-2 py-2 hover:bg-white">
            <button className="self-start pt-0.5 text-left font-mono text-sm text-brand underline-offset-2 hover:underline" onClick={() => onSeek(u.startMs)} aria-label={`Play from ${formatDuration(u.startMs)}`}>
              {formatDuration(u.startMs)}
            </button>
            <div>
              {u.speaker && <p className="text-sm font-semibold text-muted">{name(u.speaker)}</p>}
              {editing === u.id ? (
                <div className="space-y-2">
                  <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Edit transcript text" autoFocus />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(pageId, u.id)}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(undefined)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className={`leading-relaxed ${u.lang === "te" || u.lang === "mixed" ? "telugu" : ""}`}>
                  {u.text}
                  {u.edited && <span className="ml-2 text-xs text-muted">(edited)</span>}
                  <button
                    className="no-print ml-2 inline-flex align-middle text-muted opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Edit this line"
                    onClick={() => {
                      setEditing(u.id);
                      setDraft(u.text);
                    }}
                  >
                    <Pencil size={15} aria-hidden />
                  </button>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
