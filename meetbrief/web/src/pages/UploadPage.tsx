import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ref, uploadBytesResumable } from "firebase/storage";
import { setDoc } from "firebase/firestore";
import { FileAudio, Trash2, Upload } from "lucide-react";
import { formatBytes, formatDuration, validateDuration, validateMediaFile } from "@meetbrief/shared";
import { storage } from "../lib/firebase";
import { useUid } from "../lib/auth";
import { nowIso, segmentDoc, updateMeeting, useMeeting, useSegments } from "../lib/data";
import { api } from "../lib/api";
import { Banner, Button, Card, ProgressBar } from "../components/ui";

interface Picked {
  file: File;
  durationMs: number;
  isVideo: boolean;
  error?: string;
  progress: number;
  state: "ready" | "uploading" | "done" | "error";
  /** Segment index, assigned once so a retry reuses the same segment and storage path. */
  index?: number;
}

/** Read duration from the media element; returns NaN when the browser cannot decode it (server will measure). */
function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(file.type.startsWith("video") ? "video" : "audio");
    const url = URL.createObjectURL(file);
    const done = (v: number) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration * 1000 : Number.NaN);
    el.onerror = () => done(Number.NaN);
    setTimeout(() => done(Number.NaN), 8000);
    el.src = url;
  });
}

export function UploadPage() {
  const { id = "" } = useParams();
  const uid = useUid();
  const navigate = useNavigate();
  const meeting = useMeeting(id);
  const segments = useSegments(id);
  const [files, setFiles] = useState<Picked[]>([]);
  const [informed, setInformed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const nextIndex = useMemo(() => (segments.data.length ? Math.max(...segments.data.map((s) => s.index)) + 1 : 0), [segments.data]);

  const add = async (list: FileList | null) => {
    if (!list) return;
    const picked: Picked[] = [];
    for (const file of Array.from(list)) {
      const v = validateMediaFile(file);
      const durationMs = v.ok ? await probeDuration(file) : Number.NaN;
      const durErr = v.ok ? validateDuration(durationMs) : undefined;
      picked.push({ file, durationMs, isVideo: v.isVideo, error: v.error ?? durErr, progress: 0, state: v.ok && !durErr ? "ready" : "error" });
    }
    setFiles((f) => [...f, ...picked]);
  };

  const uploadAll = async () => {
    setBusy(true);
    setError(undefined);
    await updateMeeting(id, {
      status: "uploading",
      source: "upload",
      consent: { context: "in_person", method: "Uploaded recording; uploader confirmed participants were informed", announcedAt: nowIso(), confirmedByUid: uid, objectionsRaised: false },
    }).catch(() => {});
    let base = Math.max(nextIndex, ...files.map((f) => (f.index ?? -1) + 1));
    const ready = files.filter((f) => f.state === "ready").map((f) => ({ ...f, index: f.index ?? base++ }));
    setFiles((list) => list.map((x) => ready.find((r) => r.file === x.file) ?? x));
    try {
      for (const f of ready) {
        const index = f.index;
        const safe = f.file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
        const path = `meetings/${id}/original/${String(index).padStart(3, "0")}-${safe}`;
        await setDoc(segmentDoc(id, index), {
          index, kind: "file", status: "uploading", mimeType: f.file.type || "application/octet-stream", chunkCount: 0, objectPath: path, originalFileName: f.file.name,
          bytes: f.file.size, durationMs: Number.isFinite(f.durationMs) ? Math.round(f.durationMs) : 0, startedAt: nowIso(), updatedAt: nowIso(),
        });
        setFiles((list) => list.map((x) => (x.file === f.file ? { ...x, state: "uploading" } : x)));
        // Resumable upload: survives brief network drops and resumes from the last byte.
        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(ref(storage, path), f.file, { contentType: f.file.type || "application/octet-stream" });
          task.on(
            "state_changed",
            (snap) => setFiles((list) => list.map((x) => (x.file === f.file ? { ...x, progress: (snap.bytesTransferred / snap.totalBytes) * 100 } : x))),
            reject,
            () => resolve(),
          );
        });
        await setDoc(segmentDoc(id, index), { status: "uploaded", updatedAt: nowIso() }, { merge: true });
        setFiles((list) => list.map((x) => (x.file === f.file ? { ...x, state: "done", progress: 100 } : x)));
      }
      await api.process(id);
      navigate(`/meetings/${id}`);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      setError(
        code.includes("quota")
          ? "Cloud storage quota exceeded. Free up space or upgrade the storage plan, then retry."
          : code.includes("unauthorized")
            ? "Upload was not permitted. The file may be too large or of an unsupported type."
            : `Upload stopped: ${(e as Error).message}. Press Upload again to retry — finished files are not uploaded twice.`,
      );
      setFiles((list) => list.map((x) => (x.state === "uploading" ? { ...x, state: "ready" } : x)));
    } finally {
      setBusy(false);
    }
  };

  if (meeting.loading) return <p className="text-muted">Loading…</p>;
  if (!meeting.data) return <Banner tone="error">Meeting not found.</Banner>;
  const readyCount = files.filter((f) => f.state === "ready").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Step 2 of 4 · Upload</p>
        <h1 className="text-2xl font-bold md:text-3xl">{meeting.data.title}</h1>
        <p className="mt-1 text-muted">
          Or <Link className="font-medium text-brand underline" to={`/meetings/${id}/record`}>record live</Link>. Several files are joined in the order shown.
        </p>
      </div>
      {error && <Banner tone="error">{error}</Banner>}
      <Card className="space-y-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void add(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center ${drag ? "border-brand bg-brand-soft" : "border-line"}`}
        >
          <FileAudio size={40} className="text-brand" aria-hidden />
          <p className="font-semibold">Drop audio or video files here</p>
          <p className="text-sm text-muted">MP3, M4A, WAV, WebM, OGG, FLAC, AMR, or MP4/MOV/MKV video (audio is extracted). Up to 2 GB and 6 hours each.</p>
          <input ref={input} type="file" multiple accept="audio/*,video/*,.m4a,.amr,.mkv,.mov" className="sr-only" id="file-input" onChange={(e) => void add(e.target.files)} />
          <Button variant="secondary" onClick={() => input.current?.click()}>
            Choose files
          </Button>
        </div>

        {files.length > 0 && (
          <ol className="space-y-3">
            {files.map((f, i) => (
              <li key={i} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i + 1}. {f.file.name}</p>
                    <p className="text-sm text-muted">
                      {formatBytes(f.file.size)} · {Number.isFinite(f.durationMs) ? formatDuration(f.durationMs) : "duration checked on server"}
                      {f.isVideo && " · video (audio will be extracted)"}
                    </p>
                    {f.error && <p className="text-sm font-medium text-danger" role="alert">{f.error}</p>}
                  </div>
                  {f.state !== "uploading" && f.state !== "done" && (
                    <Button variant="ghost" size="sm" aria-label={`Remove ${f.file.name}`} onClick={() => setFiles((l) => l.filter((x) => x !== f))}>
                      <Trash2 size={18} aria-hidden />
                    </Button>
                  )}
                </div>
                {(f.state === "uploading" || f.state === "done") && (
                  <div className="mt-2">
                    <ProgressBar value={f.progress} label={`Uploading ${f.file.name}`} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}

        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--color-brand)]" checked={informed} onChange={(e) => setInformed(e.target.checked)} />
          <span>Participants knew this meeting was being recorded, and I am permitted to process this recording.</span>
        </label>

        <Button size="lg" disabled={busy || !readyCount || !informed} onClick={uploadAll}>
          <Upload aria-hidden /> {busy ? "Uploading…" : `Upload and process${readyCount > 1 ? ` ${readyCount} files` : ""}`}
        </Button>
      </Card>
    </div>
  );
}
