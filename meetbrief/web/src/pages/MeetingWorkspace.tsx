import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { Mic, RefreshCw, Trash2, Upload } from "lucide-react";
import { TEMPLATES, formatDuration, type Meeting } from "@meetbrief/shared";
import { storage } from "../lib/firebase";
import { api } from "../lib/api";
import { useUid } from "../lib/auth";
import { clean, updateMeeting, useMeeting, useReport, useSegments } from "../lib/data";
import { Banner, Button, Card, Modal, ProgressBar, StatusBadge, Tabs } from "../components/ui";
import { MeetingForm } from "../components/MeetingForm";
import { TranscriptTab } from "./tabs/TranscriptTab";
import { MinutesTab } from "./tabs/MinutesTab";
import { ActionsTab } from "./tabs/ActionsTab";
import { AskTab } from "./tabs/AskTab";
import { FilesTab } from "./tabs/FilesTab";

type TabId = "overview" | "transcript" | "minutes" | "actions" | "ask" | "files";
const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "transcript", label: "Transcript" },
  { id: "minutes", label: "Minutes" },
  { id: "actions", label: "Action Items" },
  { id: "ask", label: "Ask AI" },
  { id: "files", label: "Files" },
];

export function MeetingWorkspace() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as TabId) || "overview";
  const meeting = useMeeting(id);
  const [audioUrl, setAudioUrl] = useState<string>();
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const path = meeting.data?.playbackPath;
    if (path) getDownloadURL(ref(storage, path)).then(setAudioUrl).catch(() => setAudioUrl(undefined));
  }, [meeting.data?.playbackPath]);

  const seek = (ms: number) => {
    if (!audio.current) return;
    audio.current.currentTime = ms / 1000;
    void audio.current.play();
  };

  if (meeting.loading) return <p className="text-muted">Loading…</p>;
  if (!meeting.data) return <Banner tone="error">Meeting not found, or you do not have access.</Banner>;
  const m = meeting.data;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{m.title}</h1>
          <p className="mt-1 text-muted">
            {m.date} · {m.startTime} {m.timezone !== "Asia/Kolkata" && `(${m.timezone})`} · {TEMPLATES[m.templateId]?.name}
            {m.durationMs ? ` · ${formatDuration(m.durationMs)}` : ""}
          </p>
        </div>
        <StatusBadge status={m.status} />
      </header>

      <ProcessingCard meeting={m} />

      {audioUrl && (
        <div className="no-print sticky top-14 z-10 rounded-2xl border border-line bg-white/95 p-2 backdrop-blur md:top-2">
          <audio ref={audio} src={audioUrl} controls preload="metadata" className="w-full" aria-label="Meeting audio" />
        </div>
      )}

      <Tabs tabs={TABS} value={tab} onChange={(t) => setParams(t === "overview" ? {} : { tab: t }, { replace: true })} />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "overview" && <OverviewTab meeting={m} onSeek={seek} />}
        {tab === "transcript" && <TranscriptTab meeting={m} onSeek={seek} />}
        {tab === "minutes" && <MinutesTab meeting={m} onSeek={seek} />}
        {tab === "actions" && <ActionsTab meeting={m} onSeek={seek} />}
        {tab === "ask" && <AskTab meeting={m} />}
        {tab === "files" && <FilesTab meeting={m} />}
      </div>
    </div>
  );
}

function ProcessingCard({ meeting: m }: { meeting: Meeting }) {
  const segments = useSegments(m.id);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pendingSegs = segments.data.filter((s) => s.status !== "uploaded");
  const canProcess = segments.data.length > 0 && pendingSegs.length === 0;

  const start = async (force = false) => {
    setBusy(true);
    setError(undefined);
    try {
      await api.process(m.id, force);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (m.status === "processing" || m.status === "queued") {
    const stale = m.progress?.updatedAt && Date.now() - Date.parse(m.progress.updatedAt) > 20 * 60_000;
    return (
      <Card aria-live="polite">
        <div className="mb-2 flex justify-between gap-3 font-semibold">
          <span>{m.progress?.message ?? "Processing"}</span>
          <span className="tabular-nums">{m.progress?.percent ?? 0}%</span>
        </div>
        <ProgressBar value={m.progress?.percent ?? 0} label="Processing progress" />
        <p className="mt-2 text-sm text-muted">You can leave this page; processing continues on the server.</p>
        {stale && (
          <div className="mt-3">
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => start(true)}>
              <RefreshCw size={16} aria-hidden /> No progress for a while — restart processing
            </Button>
          </div>
        )}
      </Card>
    );
  }

  if (m.status === "ready") return null;

  return (
    <Card className="space-y-3">
      {m.status === "failed" && <Banner tone="error">Processing failed: {m.progress?.error ?? "unknown error"}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {segments.data.length === 0 ? (
        <p>No audio yet. Record the meeting or upload a file.</p>
      ) : pendingSegs.length ? (
        <p>
          {pendingSegs.length} segment(s) are still uploading. Keep the recording device online; uploads resume automatically. If the recording was
          interrupted, use “Recover and upload” on the device that recorded it.
        </p>
      ) : (
        <p>{segments.data.length} audio segment(s) ready.</p>
      )}
      <div className="flex flex-wrap gap-3">
        {canProcess && (
          <Button disabled={busy} onClick={() => start(m.status === "failed")}>
            <RefreshCw size={18} aria-hidden /> {m.status === "failed" ? "Try again" : "Process recording"}
          </Button>
        )}
        <Link to={`/meetings/${m.id}/record`} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 font-semibold">
          <Mic size={18} aria-hidden /> {segments.data.length ? "Continue recording" : "Record"}
        </Link>
        <Link to={`/meetings/${m.id}/upload`} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 font-semibold">
          <Upload size={18} aria-hidden /> Upload file
        </Link>
      </div>
    </Card>
  );
}

function OverviewTab({ meeting: m, onSeek }: { meeting: Meeting; onSeek: (ms: number) => void }) {
  const uid = useUid();
  const navigate = useNavigate();
  const report = useReport(m.id);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const r = report.data;

  return (
    <div className="space-y-6 pt-5">
      {r && (
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Summary</h2>
          <p className="text-lg leading-relaxed">{r.executiveSummary}</p>
          {r.teluguSummary && (
            <p className="telugu text-lg" lang="te">
              {r.teluguSummary}
            </p>
          )}
          {r.keyPoints.length > 0 && (
            <ul className="list-disc space-y-1 pl-6">
              {r.keyPoints.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          )}
          {r.decisions.length > 0 && (
            <>
              <h3 className="pt-2 text-lg font-bold">Decisions</h3>
              <ol className="list-decimal space-y-1 pl-6">
                {r.decisions.map((d, i) => (
                  <li key={i}>
                    {d.text}
                    {d.sourceStartMs !== undefined && (
                      <button className="ml-2 text-sm font-medium text-brand underline" onClick={() => onSeek(d.sourceStartMs!)}>
                        {formatDuration(d.sourceStartMs)}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
          {r.reviewNotes.length > 0 && (
            <Banner tone="warn">
              <p className="mb-1 font-semibold">Please check before circulating</p>
              <ul className="list-disc pl-5">
                {r.reviewNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </Banner>
          )}
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Meeting details</h2>
          {!editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
        {saved && <Banner tone="ok">Saved. Use “Regenerate” on the Minutes tab to apply changes to the minutes.</Banner>}
        {editing ? (
          <MeetingForm
            initial={{ ...m, venue: m.venue ?? "", platform: m.platform ?? "", chairperson: m.chairperson ?? "", department: m.department ?? "" }}
            submitLabel="Save changes"
            onSubmit={async (value) => {
              await updateMeeting(m.id, clean(value));
              setEditing(false);
              setSaved(true);
            }}
          />
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Detail label="Chairperson" value={m.chairperson} />
            <Detail label="Department" value={m.department} />
            <Detail label="Venue" value={m.venue} />
            <Detail label="Platform" value={m.platform} />
            <Detail label="Spoken language" value={{ en: "English", te: "Telugu", mixed: "Telugu + English" }[m.spokenLanguage]} />
            <Detail label="Report language" value={{ en: "English", te: "Telugu", bilingual: "English + Telugu summary" }[m.reportLanguage]} />
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted">Participants</dt>
              <dd>{m.participants.length ? m.participants.map((p) => [p.name, p.designation].filter(Boolean).join(", ")).join("; ") : "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted">Agenda</dt>
              <dd>
                {m.agenda.length ? (
                  <ol className="list-decimal pl-5">
                    {m.agenda.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ol>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            {m.consent && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted">Recording notice</dt>
                <dd>
                  {m.consent.method} — {new Date(m.consent.announcedAt).toLocaleString("en-IN", { timeZone: m.timezone })}
                  {m.consent.objectionsRaised && ` · Objection noted: ${m.consent.notes ?? ""}`}
                </dd>
              </div>
            )}
          </dl>
        )}
      </Card>

      {m.ownerId === uid && (
        <div className="flex justify-end">
          <Button variant="ghost" className="text-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={18} aria-hidden /> Delete meeting
          </Button>
        </div>
      )}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this meeting?">
        <p className="mb-4">This permanently deletes the recording, transcript, minutes and action items. It cannot be undone.</p>
        {deleteError && <Banner tone="error">{deleteError}</Banner>}
        <div className="mt-4 flex gap-3">
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await api.deleteMeeting(m.id);
                navigate("/");
              } catch (e) {
                setDeleteError((e as Error).message);
              }
            }}
          >
            Delete permanently
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
