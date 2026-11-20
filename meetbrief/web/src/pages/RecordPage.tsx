import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mic, Pause, Play, Square, WifiOff, HardDrive } from "lucide-react";
import { formatBytes, formatDuration, type ConsentRecord } from "@meetbrief/shared";
import { useUid } from "../lib/auth";
import { updateMeeting, useMeeting, useSegments, useSettings } from "../lib/data";
import { api } from "../lib/api";
import { WebRecorderAdapter } from "../recording/adapter";
import { RecordingSession, type SessionState } from "../recording/session";
import { checkStorage, type StorageHealth } from "../recording/localStore";
import { uploader, type UploadStats } from "../recording/uploader";
import { ConsentPanel } from "../components/ConsentPanel";
import { Banner, Button, Card, Modal } from "../components/ui";

export function RecordPage() {
  const { id = "" } = useParams();
  const uid = useUid();
  const navigate = useNavigate();
  const meeting = useMeeting(id);
  const segments = useSegments(id);
  const settings = useSettings(uid);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [session, setSession] = useState<RecordingSession>();
  const [state, setState] = useState<SessionState>();
  const [stats, setStats] = useState<UploadStats>();
  const [storageHealth, setStorageHealth] = useState<StorageHealth>();
  const [error, setError] = useState<string>();
  const [confirmStop, setConfirmStop] = useState(false);
  const [finishing, setFinishing] = useState<"uploading" | "processing" | "offline">();
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const supported = WebRecorderAdapter.isSupported();

  useEffect(() => uploader.subscribe(setStats), []);
  useEffect(() => {
    void checkStorage().then(setStorageHealth);
  }, []);
  useEffect(() => session?.subscribe(setState), [session]);

  const phase = state?.phase ?? "idle";
  const live = phase === "recording" || phase === "paused";

  // Visible indicator in the tab title, warning before leaving, and screen wake lock.
  useEffect(() => {
    if (!live) return;
    const title = document.title;
    document.title = `${phase === "recording" ? "● REC" : "❚❚ Paused"} — ${meeting.data?.title ?? "MeetBrief"}`;
    const beforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      document.title = title;
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [live, phase, meeting.data?.title]);

  useEffect(() => {
    if (!live || !settings.data.keepScreenAwake || !("wakeLock" in navigator)) return;
    const acquire = () => navigator.wakeLock.request("screen").then((l) => (wakeLock.current = l)).catch(() => {});
    void acquire();
    const onVis = () => document.visibilityState === "visible" && void acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void wakeLock.current?.release();
    };
  }, [live, settings.data.keepScreenAwake]);

  const nextSegmentIndex = useMemo(() => (segments.data.length ? Math.max(...segments.data.map((s) => s.index)) + 1 : 0), [segments.data]);

  const start = async () => {
    if (!consent) return;
    setError(undefined);
    const adapter = new WebRecorderAdapter();
    try {
      await adapter.open(); // the browser shows its permission prompt here, after the user's click
    } catch (e) {
      const name = (e as DOMException).name;
      setError(
        name === "NotAllowedError"
          ? "Microphone access was blocked. Allow the microphone for this site in your browser's address bar or settings, then try again."
          : name === "NotFoundError"
            ? "No microphone was found. Connect one and try again."
            : `Could not open the microphone (${name || "unknown error"}).`,
      );
      return;
    }
    const s = new RecordingSession(adapter, id, settings.data, nextSegmentIndex);
    // Not blocking: with offline persistence the write is queued and syncs later.
    updateMeeting(id, { consent, status: "recording", source: "recording" }).catch((e: Error) => setError(`Could not save the consent record: ${e.message}`));
    await s.start();
    setSession(s);
  };

  const stop = async () => {
    if (!session) return;
    setConfirmStop(false);
    await session.stop();
  };

  // After stopping: wait for uploads, then queue processing.
  useEffect(() => {
    if (phase !== "stopped" || !session || finishing) return;
    setFinishing(navigator.onLine ? "uploading" : "offline");
    void updateMeeting(id, { status: "uploading" }).catch(() => {});
    void (async () => {
      await session.uploadsComplete();
      setFinishing("processing");
      try {
        await api.process(id);
      } catch (e) {
        setError(`Audio is saved, but processing could not start: ${(e as Error).message} You can start it from the meeting page.`);
      }
      navigate(`/meetings/${id}`);
    })();
  }, [phase, session, finishing, id, navigate]);

  if (meeting.loading) return <p className="text-muted">Loading…</p>;
  if (!meeting.data) return <Banner tone="error">Meeting not found.</Banner>;

  const segMs = settings.data.segmentMinutes * 60_000;
  const levelPct = Math.max(0, Math.min(100, ((state?.levelDb ?? -100) + 70) * (100 / 70)));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Step 2 of 4 · Record</p>
        <h1 className="text-2xl font-bold md:text-3xl">{meeting.data.title}</h1>
        <p className="mt-1 text-muted">
          Prefer a file? <Link className="font-medium text-brand underline" to={`/meetings/${id}/upload`}>Upload a recording instead</Link>
        </p>
      </div>

      {!supported && <Banner tone="error">This browser cannot record audio. Use a current version of Chrome, Edge, Firefox or Safari, or upload a recording instead.</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {storageHealth?.low && (
        <Banner tone="warn">
          <span className="inline-flex items-center gap-2"><HardDrive size={18} aria-hidden /> This device is low on storage ({formatBytes(storageHealth.availableBytes ?? 0)} free). Long recordings need room for the local backup.</span>
        </Banner>
      )}

      {phase === "idle" && (
        <Card className="space-y-6">
          <ConsentPanel uid={uid} onChange={setConsent} />
          <div className="space-y-2 rounded-xl bg-paper p-4 text-sm text-muted">
            <p><strong className="text-ink">Keep this tab open and the device awake.</strong> Browsers cannot reliably record when the screen locks, the app is in the background on a phone, or the browser is closed. Audio is saved on this device every {settings.data.chunkSeconds} seconds and uploaded as you go.</p>
            {nextSegmentIndex > 0 && <p>This meeting already has {nextSegmentIndex} recorded segment(s); a new recording continues the same timeline.</p>}
          </div>
          <Button variant="record" size="lg" className="w-full sm:w-auto" disabled={!consent || !supported} onClick={start}>
            <Mic aria-hidden /> Start recording
          </Button>
          {!consent && <p className="text-sm text-muted">Confirm that participants were informed to enable recording.</p>}
        </Card>
      )}

      {state && phase !== "idle" && (
        <Card className="space-y-6">
          <div className="flex flex-col items-center gap-3 py-4 text-center" aria-live="polite">
            <div className="flex items-center gap-2 text-lg font-bold">
              {phase === "recording" && <span className="rec-dot inline-block h-3.5 w-3.5 rounded-full bg-accent" aria-hidden />}
              <span className={phase === "recording" ? "text-accent" : "text-muted"}>
                {phase === "recording" ? "Recording" : phase === "paused" ? "Paused" : phase === "stopping" ? "Saving…" : "Stopped"}
              </span>
            </div>
            <p className="font-mono text-6xl font-bold tabular-nums md:text-7xl" aria-label={`Elapsed ${formatDuration(state.elapsedMs)}`}>
              {formatDuration(state.elapsedMs)}
            </p>
            <div className="w-full max-w-md">
              <div className="h-3 overflow-hidden rounded-full bg-brand-soft" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(levelPct)}>
                <div className={`h-full transition-[width] duration-100 ${levelPct > 85 ? "bg-accent" : "bg-ok"}`} style={{ width: `${levelPct}%` }} />
              </div>
              <p className="mt-1 text-sm text-muted">{levelPct < 8 && phase === "recording" ? "Very quiet — move the device closer to the speakers" : "Input level"}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label="Segment" value={`${state.segmentIndex + 1}`} sub={`${formatDuration(state.segmentElapsedMs)} / ${formatDuration(segMs)}`} />
            <Stat label="Saved chunks" value={String(state.chunksRecorded)} sub={state.localBufferFailed ? "no local backup" : "on this device"} />
            <Stat label="Waiting to upload" value={String(stats?.pending ?? 0)} sub={stats?.online ? "online" : "offline"} />
            <Stat label="Uploaded" value={formatBytes(stats?.uploadedBytes ?? 0)} sub={`${state.segmentsFinalized} segment(s) confirmed`} />
          </dl>

          {!stats?.online && (
            <Banner tone="warn">
              <span className="inline-flex items-center gap-2"><WifiOff size={18} aria-hidden /> Offline. Recording continues and is saved on this device; uploads resume automatically.</span>
            </Banner>
          )}
          {stats?.lastError && stats.online && <Banner tone="warn">{stats.lastError}</Banner>}
          {state.warnings.map((w) => (
            <Banner key={w} tone="warn">{w}</Banner>
          ))}

          {live && (
            <div className="flex flex-wrap justify-center gap-3">
              {phase === "recording" ? (
                <Button variant="secondary" size="lg" onClick={() => session?.pause()}>
                  <Pause aria-hidden /> Pause
                </Button>
              ) : (
                <Button size="lg" onClick={() => session?.resume()}>
                  <Play aria-hidden /> Resume
                </Button>
              )}
              <Button variant="danger" size="lg" onClick={() => setConfirmStop(true)}>
                <Square aria-hidden /> Stop
              </Button>
            </div>
          )}

          {finishing && (
            <Banner tone={finishing === "offline" ? "warn" : "info"}>
              {finishing === "uploading" && "Finishing uploads… please keep this tab open."}
              {finishing === "offline" && "Recording saved on this device. It will upload when you are back online — keep this tab open, or reopen MeetBrief later to recover it."}
              {finishing === "processing" && "Upload complete. Starting transcription…"}
            </Banner>
          )}
        </Card>
      )}

      <Modal open={confirmStop} onClose={() => setConfirmStop(false)} title="Stop recording?">
        <p className="mb-6 text-muted">The recording will be uploaded and processed. You can add more later with “Continue recording”.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" onClick={stop}>Stop and process</Button>
          <Button variant="secondary" onClick={() => setConfirmStop(false)}>Keep recording</Button>
        </div>
      </Modal>

      <Modal open={state?.autoStopIn !== undefined} onClose={() => session?.cancelAutoStop()} title="Has the meeting ended?">
        <p className="mb-2">
          It has been quiet for about {settings.data.silenceDetection.silenceMinutes} minutes. Recording will stop automatically in{" "}
          <strong className="tabular-nums">{Math.ceil(state?.autoStopIn ?? 0)} s</strong>.
        </p>
        <p className="mb-6 text-sm text-muted">Silence is only a hint — a break or a quiet room can look the same.</p>
        <div className="flex flex-wrap gap-3">
          <Button autoFocus onClick={() => session?.cancelAutoStop()}>Keep recording</Button>
          <Button variant="danger" onClick={stop}>Stop now</Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-paper p-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-xl font-bold tabular-nums">{value}</dd>
      <dd className="text-xs text-muted">{sub}</dd>
    </div>
  );
}
