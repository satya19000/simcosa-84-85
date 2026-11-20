import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { DEFAULT_SETTINGS, TEMPLATE_LIST, TEMPLATES, formatDuration, type ReportLanguage, type SpokenLanguage, type TaskStatus, type TemplateId, type UserSettings } from "@meetbrief/shared";
import { useUid } from "../lib/auth";
import { useAllTasks, useMeeting, useReport, useSettings } from "../lib/data";
import { api } from "../lib/api";
import { TaskList } from "../components/TaskList";
import { Banner, Button, Card, EmptyState, Field, Input, Select } from "../components/ui";

export function ActionItemsPage() {
  const uid = useUid();
  const tasks = useAllTasks(uid);
  const [status, setStatus] = useState<TaskStatus | "all" | "pending">("pending");
  const [who, setWho] = useState("");
  const list = useMemo(
    () =>
      tasks.data
        .filter((t) => (status === "all" ? true : status === "pending" ? t.status !== "done" : t.status === status))
        .filter((t) => !who || `${t.assignee ?? ""} ${t.assigneeDesignation ?? ""}`.toLowerCase().includes(who.toLowerCase()))
        .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")),
    [tasks.data, status, who],
  );
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold md:text-3xl">Action items</h1>
      <div className="flex flex-wrap gap-3">
        <Select aria-label="Filter by status" className="!w-auto" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="pending">Not done</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="all">All</option>
        </Select>
        <Input aria-label="Filter by responsible person" placeholder="Responsible person…" className="max-w-xs" value={who} onChange={(e) => setWho(e.target.value)} />
      </div>
      {tasks.error && <Banner tone="error">{tasks.error}</Banner>}
      {tasks.loading ? <p className="text-muted">Loading…</p> : list.length ? <TaskList tasks={list} showMeeting /> : <EmptyState title="No action items here" />}
    </div>
  );
}

export function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof api.search>>["results"]>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold md:text-3xl">Search</h1>
      <form
        className="flex gap-2"
        role="search"
        onSubmit={async (e) => {
          e.preventDefault();
          if (q.trim().length < 2) return;
          setBusy(true);
          setError(undefined);
          try {
            setResults((await api.search(q.trim())).results);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input type="search" aria-label="Search meetings and transcripts" placeholder="Search titles, agendas, summaries and transcripts (Telugu or English)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" disabled={busy}><SearchIcon size={18} aria-hidden /> Search</Button>
      </form>
      {error && <Banner tone="error">{error}</Banner>}
      {results && (results.length === 0 ? <EmptyState title="No matches" /> : (
        <ul className="space-y-3">
          {results.map((r, i) => (
            <li key={i}>
              <Link to={`/meetings/${r.meetingId}${r.field === "transcript" ? "?tab=transcript" : ""}`}>
                <Card className="hover:border-brand">
                  <p className="font-semibold">{r.title} <span className="font-normal text-muted">· {r.date}</span></p>
                  <p className="mt-1 text-sm text-muted">{r.field}{r.startMs !== undefined ? ` at ${formatDuration(r.startMs)}` : ""}</p>
                  <p className="mt-1">{r.snippet}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const uid = useUid();
  const settings = useSettings(uid);
  const [v, setV] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Initialise the form once from the stored settings; later snapshots must not overwrite edits.
  useEffect(() => {
    if (!settings.loading && !loaded) {
      setV(settings.data);
      setLoaded(true);
    }
  }, [settings.loading, settings.data, loaded]);
  const set = <K extends keyof UserSettings>(k: K, value: UserSettings[K]) => { setSaved(false); setV((s) => ({ ...s, [k]: value })); };
  const sd = v.silenceDetection;
  const setSd = (patch: Partial<UserSettings["silenceDetection"]>) => set("silenceDetection", { ...sd, ...patch });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
      {!loaded ? <p className="text-muted">Loading…</p> : <form className="space-y-6" onSubmit={async (e) => { e.preventDefault(); await settings.save(v); setSaved(true); }}>
        <Card className="grid gap-4 md:grid-cols-2">
          <h2 className="text-lg font-bold md:col-span-2">Defaults for new meetings</h2>
          <Field label="Timezone">{(id) => <Input id={id} value={v.timezone} onChange={(e) => set("timezone", e.target.value)} />}</Field>
          <Field label="Department / organisation">{(id) => <Input id={id} value={v.department ?? ""} onChange={(e) => set("department", e.target.value)} />}</Field>
          <Field label="Meeting template">{(id) => (
            <Select id={id} value={v.defaultTemplateId} onChange={(e) => set("defaultTemplateId", e.target.value as TemplateId)}>
              {TEMPLATE_LIST.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          )}</Field>
          <Field label="Spoken language">{(id) => (
            <Select id={id} value={v.spokenLanguage} onChange={(e) => set("spokenLanguage", e.target.value as SpokenLanguage)}>
              <option value="mixed">Telugu and English (mixed)</option><option value="te">Telugu</option><option value="en">English</option>
            </Select>
          )}</Field>
          <Field label="Report language">{(id) => (
            <Select id={id} value={v.reportLanguage} onChange={(e) => set("reportLanguage", e.target.value as ReportLanguage)}>
              <option value="en">English</option><option value="te">Telugu</option><option value="bilingual">English with Telugu summary</option>
            </Select>
          )}</Field>
        </Card>
        <Card className="grid gap-4 md:grid-cols-2">
          <h2 className="text-lg font-bold md:col-span-2">Recording</h2>
          <Field label="Segment length (minutes)" hint="Each segment uploads as a unit. Default 60.">
            {(id) => <Input id={id} type="number" min={1} max={120} value={v.segmentMinutes} onChange={(e) => set("segmentMinutes", Math.max(1, Math.min(120, Number(e.target.value) || 60)))} />}
          </Field>
          <Field label="Local save interval (seconds)" hint="Shorter loses less audio if the device crashes.">
            {(id) => <Input id={id} type="number" min={2} max={60} value={v.chunkSeconds} onChange={(e) => set("chunkSeconds", Math.max(2, Math.min(60, Number(e.target.value) || 10)))} />}
          </Field>
          <label className="flex items-center gap-3 md:col-span-2">
            <input type="checkbox" className="h-5 w-5 accent-[var(--color-brand)]" checked={v.keepScreenAwake} onChange={(e) => set("keepScreenAwake", e.target.checked)} />
            Keep the screen awake while recording (where supported)
          </label>
        </Card>
        <Card className="grid gap-4 md:grid-cols-3">
          <h2 className="text-lg font-bold md:col-span-3">End-of-meeting detection</h2>
          <label className="flex items-center gap-3 md:col-span-3">
            <input type="checkbox" className="h-5 w-5 accent-[var(--color-brand)]" checked={sd.enabled} onChange={(e) => setSd({ enabled: e.target.checked })} />
            Suggest stopping after a long silence (you can always cancel)
          </label>
          <Field label="Silence for (minutes)">{(id) => <Input id={id} type="number" min={1} max={60} disabled={!sd.enabled} value={sd.silenceMinutes} onChange={(e) => setSd({ silenceMinutes: Math.max(1, Number(e.target.value) || 5) })} />}</Field>
          <Field label="Countdown (seconds)">{(id) => <Input id={id} type="number" min={10} max={300} disabled={!sd.enabled} value={sd.countdownSeconds} onChange={(e) => setSd({ countdownSeconds: Math.max(10, Number(e.target.value) || 60) })} />}</Field>
          <Field label="Silence threshold (dB)" hint="Lower = only very quiet counts as silence.">{(id) => <Input id={id} type="number" min={-80} max={-20} disabled={!sd.enabled} value={sd.thresholdDb} onChange={(e) => setSd({ thresholdDb: Number(e.target.value) || -50 })} />}</Field>
        </Card>
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg">Save settings</Button>
          {saved && <span className="font-medium text-ok" role="status">Saved</span>}
        </div>
      </form>}
    </div>
  );
}

/** Print-friendly minutes. The browser's "Save as PDF" renders Telugu correctly with system fonts. */
export function PrintMinutes() {
  const { id = "" } = useParams();
  const meeting = useMeeting(id);
  const report = useReport(id);
  const m = meeting.data;
  const r = report.data;
  if (!m || !r) return <p className="p-8 text-muted">Loading…</p>;
  return (
    <div className="bg-white">
      <div className="no-print flex justify-center gap-3 border-b border-line p-3">
        <Button onClick={() => window.print()}>Print / Save as PDF</Button>
        <Link className="rounded-xl border border-line px-4 py-2.5 font-semibold" to={`/meetings/${id}?tab=minutes`}>Back</Link>
      </div>
      <article className="print-page mx-auto max-w-3xl space-y-5 p-8 font-serif text-[15px] leading-relaxed">
        <header className="text-center">
          {m.department && <p className="font-bold uppercase">{m.department}</p>}
          <h1 className="mt-1 text-2xl font-bold">{r.title}</h1>
          <p>{m.date} · {m.startTime} ({m.timezone}){m.venue ? ` · ${m.venue}` : ""}{m.platform ? ` · ${m.platform}` : ""}</p>
          {m.chairperson && <p className="font-semibold">Chairperson: {m.chairperson}</p>}
        </header>
        {TEMPLATES[m.templateId].showsAttendance && m.participants.length > 0 && (
          <section><h2 className="font-bold">Attendance</h2>
            <ol className="list-decimal pl-6">{m.participants.map((p, i) => <li key={i}>{[p.name, p.designation].filter(Boolean).join(", ")}</li>)}</ol>
          </section>
        )}
        <section><h2 className="font-bold">Summary</h2><p>{r.executiveSummary}</p>{r.teluguSummary && <p className="telugu mt-2" lang="te">{r.teluguSummary}</p>}</section>
        {r.minutes.filter((s) => s.points.length).map((s, i) => (
          <section key={i}><h2 className="font-bold">{s.heading}</h2><ul className="list-disc pl-6">{s.points.map((p, j) => <li key={j}>{p}</li>)}</ul></section>
        ))}
        {r.decisions.length > 0 && <section><h2 className="font-bold">Decisions</h2><ol className="list-decimal pl-6">{r.decisions.map((d, i) => <li key={i}>{d.text}</li>)}</ol></section>}
        {r.actionItems.length > 0 && (
          <section><h2 className="mb-2 font-bold">Action points</h2>
            <table className="w-full border-collapse text-left text-sm">
              <thead><tr>{["#", "Action", "Responsibility", "Timeline"].map((h) => <th key={h} className="border border-gray-400 px-2 py-1">{h}</th>)}</tr></thead>
              <tbody>{r.actionItems.map((a, i) => (
                <tr key={i}><td className="border border-gray-400 px-2 py-1">{i + 1}</td><td className="border border-gray-400 px-2 py-1">{a.title}</td>
                  <td className="border border-gray-400 px-2 py-1">{[a.assignee, a.assigneeDesignation].filter(Boolean).join(", ") || "—"}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.dueDate || a.dueText || "—"}</td></tr>
              ))}</tbody>
            </table>
          </section>
        )}
        {r.nextMeeting && <section><h2 className="font-bold">Next meeting</h2><p>{r.nextMeeting}</p></section>}
        <footer className="pt-8 text-xs text-gray-500">Prepared with MeetBrief AI from a recording made with participants' knowledge. Verify before circulation.</footer>
      </article>
    </div>
  );
}
