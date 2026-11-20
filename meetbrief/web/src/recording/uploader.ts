import { ref, uploadBytes } from "firebase/storage";
import { setDoc } from "firebase/firestore";
import { chunkObjectPath, extensionForMime } from "@meetbrief/shared";
import { storage } from "../lib/firebase";
import { nowIso, segmentDoc } from "../lib/data";
import { chunkKey, localStore, segKey } from "./localStore";

interface Job {
  meetingId: string;
  segmentIndex: number;
  chunkIndex: number;
  blob: Blob;
  mimeType: string;
  attempts: number;
}

export interface UploadStats {
  pending: number;
  uploadedBytes: number;
  online: boolean;
  retrying: boolean;
  lastError?: string;
}

/**
 * Uploads chunks in order with retries and exponential backoff. Each chunk has a deterministic
 * storage path (meeting/segment/chunk index), so a retry after an uncertain failure overwrites
 * the same object instead of creating a duplicate segment or chunk.
 */
class ChunkUploader {
  private queue: Job[] = [];
  private active = 0;
  private listeners = new Set<(s: UploadStats) => void>();
  private stats: UploadStats = { pending: 0, uploadedBytes: 0, online: typeof navigator === "undefined" ? true : navigator.onLine, retrying: false };
  private waiters: Array<{ meetingId: string; segmentIndex: number; resolve: () => void }> = [];
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.set({ online: true });
        this.pump();
      });
      window.addEventListener("offline", () => this.set({ online: false }));
    }
  }

  subscribe(cb: (s: UploadStats) => void) {
    this.listeners.add(cb);
    cb(this.stats);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private set(patch: Partial<UploadStats>) {
    this.stats = { ...this.stats, ...patch, pending: this.queue.length + this.active };
    this.listeners.forEach((l) => l(this.stats));
  }

  enqueue(job: Omit<Job, "attempts">) {
    const dup = this.queue.some((j) => j.meetingId === job.meetingId && j.segmentIndex === job.segmentIndex && j.chunkIndex === job.chunkIndex);
    if (dup) return;
    this.queue.push({ ...job, attempts: 0 });
    this.set({});
    this.pump();
  }

  /** Resolves when no chunk of this segment is queued or in flight. */
  drained(meetingId: string, segmentIndex: number): Promise<void> {
    if (!this.hasWork(meetingId, segmentIndex)) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push({ meetingId, segmentIndex, resolve }));
  }

  private inFlight = new Set<string>();

  private hasWork(meetingId: string, segmentIndex: number) {
    return (
      this.queue.some((j) => j.meetingId === meetingId && j.segmentIndex === segmentIndex) ||
      [...this.inFlight].some((k) => k.startsWith(`${meetingId}/${segmentIndex}/`))
    );
  }

  private pump() {
    if (!this.stats.online) return;
    while (this.active < 2 && this.queue.length) {
      const job = this.queue.shift()!;
      this.active++;
      const key = chunkKey(job.meetingId, job.segmentIndex, job.chunkIndex);
      this.inFlight.add(key);
      this.upload(job)
        .then(async () => {
          await localStore.markChunkUploaded(key).catch(() => {});
          this.set({ uploadedBytes: this.stats.uploadedBytes + job.blob.size, retrying: false, lastError: undefined });
        })
        .catch((err: unknown) => {
          job.attempts++;
          const msg = describeUploadError(err);
          this.set({ retrying: true, lastError: msg });
          const delay = Math.min(60_000, 1000 * 2 ** Math.min(job.attempts, 6));
          clearTimeout(this.timer);
          this.timer = setTimeout(() => this.pump(), delay);
          this.queue.unshift(job); // keep order
        })
        .finally(() => {
          this.active--;
          this.inFlight.delete(key);
          this.set({});
          this.waiters = this.waiters.filter((w) => {
            if (this.hasWork(w.meetingId, w.segmentIndex)) return true;
            w.resolve();
            return false;
          });
          if (!this.stats.retrying) this.pump();
        });
    }
  }

  private async upload(job: Job) {
    const ext = extensionForMime(job.mimeType);
    const path = chunkObjectPath(job.meetingId, job.segmentIndex, job.chunkIndex, ext);
    await uploadBytes(ref(storage, path), job.blob, { contentType: job.mimeType.split(";")[0] });
  }
}

function describeUploadError(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  if (code.includes("quota-exceeded")) return "Cloud storage quota exceeded. Free space or upgrade the storage plan; recording is kept on this device.";
  if (code.includes("unauthorized") || code.includes("unauthenticated")) return "Upload not permitted. Please sign in again; recording is kept on this device.";
  if (code.includes("retry-limit") || code.includes("network") || !navigator.onLine) return "Network unavailable. Recording continues and will upload when the connection returns.";
  return `Upload failed (${code || "unknown error"}). Retrying automatically.`;
}

export const uploader = new ChunkUploader();

/**
 * Confirm a segment on the server once all its chunks are uploaded. Safe to call repeatedly.
 * Returns true when the segment is complete.
 */
export async function finalizeSegment(meetingId: string, segmentIndex: number): Promise<boolean> {
  const meta = await localStore.getSegment(segKey(meetingId, segmentIndex));
  if (!meta || meta.done) return Boolean(meta?.done);
  if (meta.finalChunkCount === undefined) return false;
  const chunks = await localStore.segmentChunks(meetingId, segmentIndex);
  if (chunks.length < meta.finalChunkCount || chunks.some((c) => !c.uploaded)) {
    console.warn(`[meetbrief] segment ${segmentIndex} not complete: ${chunks.filter((c) => c.uploaded).length}/${meta.finalChunkCount} chunks uploaded (${chunks.length} on device)`);
    return false;
  }
  await setDoc(
    segmentDoc(meetingId, segmentIndex),
    {
      index: segmentIndex,
      kind: "chunks",
      status: "uploaded",
      mimeType: meta.mimeType,
      chunkCount: meta.finalChunkCount,
      bytes: chunks.reduce((n, c) => n + c.blob.size, 0),
      durationMs: meta.durationMs,
      startedAt: meta.startedAt,
      endedAt: meta.endedAt ?? nowIso(),
      updatedAt: nowIso(),
    },
    { merge: true },
  );
  await localStore.putSegment({ ...meta, done: true });
  await localStore.clearSegmentChunks(meetingId, segmentIndex);
  return true;
}

/** Find recordings left unfinished by a crash or closed tab. */
export async function findUnfinished() {
  return (await localStore.allSegments()).filter((s) => !s.done);
}

/**
 * Resume unfinished segments: chunks already on this device are complete media prefixes, so the
 * segment is closed at the last saved chunk and uploaded.
 */
export async function recoverMeeting(meetingId: string): Promise<number> {
  const segs = (await findUnfinished()).filter((s) => s.meetingId === meetingId);
  for (const s of segs) {
    const chunks = await localStore.segmentChunks(meetingId, s.segmentIndex);
    if (s.finalChunkCount === undefined) {
      await localStore.putSegment({ ...s, finalChunkCount: chunks.length, endedAt: s.endedAt ?? nowIso() });
    }
    await setDoc(segmentDoc(meetingId, s.segmentIndex), { index: s.segmentIndex, kind: "chunks", status: "uploading", mimeType: s.mimeType, chunkCount: chunks.length, bytes: 0, durationMs: s.durationMs, startedAt: s.startedAt, updatedAt: nowIso() }, { merge: true });
    for (const c of chunks.filter((c) => !c.uploaded)) {
      uploader.enqueue({ meetingId, segmentIndex: s.segmentIndex, chunkIndex: c.chunkIndex, blob: c.blob, mimeType: s.mimeType });
    }
    await uploader.drained(meetingId, s.segmentIndex);
    await finalizeSegment(meetingId, s.segmentIndex);
  }
  return segs.length;
}
