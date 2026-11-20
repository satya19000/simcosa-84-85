import { useState } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { FileDown, Printer, RefreshCw } from "lucide-react";
import { formatDuration, type Meeting, type MeetingReport } from "@meetbrief/shared";
import { db } from "../../lib/firebase";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { clean, nowIso, useReport } from "../../lib/data";
import { Banner, Button, Card, EmptyState, Field, Input, Modal, Textarea } from "../../components/ui";

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function MinutesTab({ meeting: m, onSeek }: { meeting: Meeting; onSeek: (ms: number) => void }) {
  const report = useReport(m.id);
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MeetingReport>();
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string }>();
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [exporting, setExporting] = useState<string>();

  if (report.loading) return <p className="pt-5 text-muted">Loading…</p>;
  const r = report.data;
  if (!r) return <div className="pt-5"><EmptyState title="Minutes not ready yet">They are written automatically after transcription.</EmptyState></div>;

  const exportAs = async (f: "docx" | "md" | "txt" | "transcript") => {
    setExporting(f);
    setMsg(undefined);
    try {
      await api.download(m.id, f);
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    } finally {
      setExporting(undefined);
    }
  };

  const save = async () => {
    if (!draft) return;
    try {
      await updateDoc(doc(db, "meetings", m.id, "reports", "current"), clean({ ...draft, editedAt: nowIso(), editedBy: user?.uid }));
      setEditing(false);
      setMsg({ tone: "ok", text: "Minutes saved." });
    } catch (e) {
      setMsg({ tone: "error", text: `Could not save: ${(e as Error).message}` });
    }
  };

  return (
    <div className="space-y-5 pt-5">
      <div className="no-print flex flex-wrap gap-2">
        {!editing ? (
          <Button variant="secondary" onClick={() => { setDraft(structuredClone(r)); setEditing(true); }}>Edit minutes</Button>
        ) : (
          <>
            <Button onClick={save}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </>
        )}
        <Button variant="secondary" disabled={!!exporting} onClick={() => exportAs("docx")}><FileDown size={18} aria-hidden /> Word (.docx)</Button>
        <Link to={`/meetings/${m.id}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 font-semibold">
          <Printer size={18} aria-hidden /> Print / PDF
        </Link>
        <Button variant="ghost" disabled={!!exporting} onClick={() => exportAs("md")}>Markdown</Button>
        <Button variant="ghost" disabled={!!exporting} onClick={() => exportAs("txt")}>Text</Button>
        <Button variant="ghost" disabled={!!exporting} onClick={() => exportAs("transcript")}>Transcript</Button>
        <Button variant="ghost" onClick={() => setConfirmRegen(true)}><RefreshCw size={18} aria-hidden /> Regenerate</Button>
      </div>
      {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
      {r.editedAt && !editing && <p className="text-sm text-muted">Edited {new Date(r.editedAt).toLocaleString("en-IN")}</p>}

      {editing && draft ? (
        <Card className="space-y-5">
          <Field label="Title">{(id) => <Input id={id} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />}</Field>
          <Field label="Summary">{(id) => <Textarea id={id} rows={5} value={draft.executiveSummary} onChange={(e) => setDraft({ ...draft, executiveSummary: e.target.value })} />}</Field>
          {draft.teluguSummary !== undefined && (
            <Field label="Telugu summary">{(id) => <Textarea id={id} lang="te" className="telugu" rows={4} value={draft.teluguSummary} onChange={(e) => setDraft({ ...draft, teluguSummary: e.target.value })} />}</Field>
          )}
          {draft.minutes.map((s, i) => (
            <Field key={i} label={s.heading} hint="One point per line.">
              {(id) => (
                <Textarea
                  id={id}
                  rows={Math.max(3, s.points.length + 1)}
                  defaultValue={s.points.join("\n")}
                  onChange={(e) => setDraft({ ...draft, minutes: draft.minutes.map((x, j) => (j === i ? { ...x, points: lines(e.target.value) } : x)) })}
                />
              )}
            </Field>
          ))}
          <Field label="Decisions" hint="One decision per line.">
            {(id) => (
              <Textarea id={id} rows={4} defaultValue={draft.decisions.map((d) => d.text).join("\n")}
                onChange={(e) => setDraft({ ...draft, decisions: lines(e.target.value).map((text, i) => ({ ...draft.decisions[i], text })) })} />
            )}
          </Field>
          <Field label="Next meeting">{(id) => <Input id={id} value={draft.nextMeeting ?? ""} onChange={(e) => setDraft({ ...draft, nextMeeting: e.target.value })} />}</Field>
          <p className="text-sm text-muted">Edit action items on the Action Items tab.</p>
        </Card>
      ) : (
        <Card className="space-y-6">
          <div>
            {m.department && <p className="font-semibold text-muted">{m.department}</p>}
            <h2 className="text-2xl font-bold">{r.title}</h2>
            <p className="text-muted">{[m.date, m.startTime, m.venue || m.platform, m.chairperson && `Chair: ${m.chairperson}`].filter(Boolean).join(" · ")}</p>
          </div>
          <section>
            <h3 className="mb-2 text-lg font-bold">Summary</h3>
            <p className="leading-relaxed">{r.executiveSummary}</p>
            {r.teluguSummary && <p className="telugu mt-3 leading-relaxed" lang="te">{r.teluguSummary}</p>}
          </section>
          {r.minutes.filter((s) => s.points.length).map((s, i) => (
            <section key={i}>
              <h3 className="mb-2 text-lg font-bold">{s.heading}</h3>
              <ul className="list-disc space-y-1.5 pl-6">{s.points.map((p, j) => <li key={j} className={r.language === "te" ? "telugu" : ""}>{p}</li>)}</ul>
            </section>
          ))}
          {r.decisions.length > 0 && (
            <section>
              <h3 className="mb-2 text-lg font-bold">Decisions</h3>
              <ol className="list-decimal space-y-1.5 pl-6">
                {r.decisions.map((d, i) => (
                  <li key={i}>{d.text}{d.owner && ` (${d.owner})`}
                    {d.sourceStartMs !== undefined && <button className="no-print ml-2 text-sm text-brand underline" onClick={() => onSeek(d.sourceStartMs!)}>{formatDuration(d.sourceStartMs)}</button>}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {r.actionItems.length > 0 && (
            <section>
              <h3 className="mb-2 text-lg font-bold">Action points</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <thead><tr className="border-b border-line text-sm text-muted"><th className="py-2 pr-3">#</th><th className="py-2 pr-3">Action</th><th className="py-2 pr-3">Responsibility</th><th className="py-2">Timeline</th></tr></thead>
                  <tbody>
                    {r.actionItems.map((a, i) => (
                      <tr key={i} className="border-b border-line align-top">
                        <td className="py-2 pr-3">{i + 1}</td>
                        <td className="py-2 pr-3">{a.title}</td>
                        <td className="py-2 pr-3">{[a.assignee, a.assigneeDesignation].filter(Boolean).join(", ") || "—"}</td>
                        <td className="py-2">{a.dueDate || a.dueText || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {r.openQuestions.length > 0 && (
            <section><h3 className="mb-2 text-lg font-bold">Open questions</h3><ul className="list-disc pl-6">{r.openQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul></section>
          )}
          {r.nextMeeting && <section><h3 className="mb-2 text-lg font-bold">Next meeting</h3><p>{r.nextMeeting}</p></section>}
          <p className="text-sm text-muted">Generated by {r.provider === "mock" ? "the demo provider" : `${r.provider} (${r.model})`} on {new Date(r.generatedAt).toLocaleString("en-IN")}. AI-generated minutes can contain errors — verify names and figures before circulating.</p>
        </Card>
      )}

      <Modal open={confirmRegen} onClose={() => setConfirmRegen(false)} title="Regenerate minutes?">
        <p className="mb-6">The minutes will be rewritten from the transcript using the current meeting details{r.editedAt ? ". Your manual edits to the minutes will be replaced" : ""}. Action items you have already updated are kept.</p>
        <div className="flex gap-3">
          <Button onClick={async () => {
            setConfirmRegen(false);
            try { await api.regenerate(m.id); setMsg({ tone: "ok", text: "Rewriting minutes… progress shows above." }); }
            catch (e) { setMsg({ tone: "error", text: (e as Error).message }); }
          }}>Regenerate</Button>
          <Button variant="secondary" onClick={() => setConfirmRegen(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
