import { setDoc } from "firebase/firestore";
import type { UserSettings } from "@meetbrief/shared";
import { nowIso, segmentDoc } from "../lib/data";
import type { RecorderAdapter } from "./adapter";
import { chunkKey, localStore, segKey } from "./localStore";
import { finalizeSegment, uploader } from "./uploader";

export type SessionPhase = "idle" | "recording" | "paused" | "stopping" | "stopped" | "error";

export interface SessionState {
  phase: SessionPhase;
  elapsedMs: number; // active recording time across segments
  segmentIndex: number;
  segmentElapsedMs: number;
  levelDb: number;
  chunksRecorded: number;
  segmentsFinalized: number;
  silentMs: number;
  /** Seconds left before an automatic stop, when a silence prompt is showing. */
  autoStopIn?: number;
  warnings: string[];
  error?: string;
  /** True when the local buffer could not store chunks (device storage full). */
  localBufferFailed: boolean;
}

/**
 * Orchestrates one recording: segments of `segmentMinutes`, chunks of `chunkSeconds`, local
 * buffering, uploads, silence suggestions and segment confirmation.
 */
export class RecordingSession {
  private state: SessionState = {
    phase: "idle", elapsedMs: 0, segmentIndex: 0, segmentElapsedMs: 0, levelDb: -100, chunksRecorded: 0,
    segmentsFinalized: 0, silentMs: 0, warnings: [], localBufferFailed: false,
  };
  private listeners = new Set<(s: SessionState) => void>();
  private tickHandle?: ReturnType<typeof setInterval>;
  private lastTick = 0;
  private lastChunkAt = 0;
  private loudMs = 0;
  private segmentStarts = new Map<number, string>();
  private chunkCounts = new Map<number, number>();
  private finalizers: Promise<void>[] = [];
  private stopReason?: string;

  constructor(
    private adapter: RecorderAdapter,
    private meetingId: string,
    private settings: UserSettings,
    private startSegmentIndex = 0,
  ) {
    adapter.onInputLost(() => {
      this.warn("The microphone stopped (device unplugged or permission revoked). Recording was stopped and saved.");
      void this.stop("input-lost");
    });
  }

  subscribe(cb: (s: SessionState) => void) {
    this.listeners.add(cb);
    cb(this.state);
    return () => {
      this.listeners.delete(cb);
    };
  }

  get snapshot() {
    return this.state;
  }

  private set(patch: Partial<SessionState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  private warn(msg: string) {
    if (!this.state.warnings.includes(msg)) this.set({ warnings: [...this.state.warnings, msg].slice(-5) });
  }

  async start() {
    await this.beginSegment(this.startSegmentIndex);
    this.lastTick = performance.now();
    this.tickHandle = setInterval(() => this.tick(), 250);
    this.set({ phase: "recording", segmentIndex: this.startSegmentIndex });
  }

  private async beginSegment(index: number) {
    const startedAt = nowIso();
    this.segmentStarts.set(index, startedAt);
    this.chunkCounts.set(index, 0);
    await localStore.putSegment({ key: segKey(this.meetingId, index), meetingId: this.meetingId, segmentIndex: index, mimeType: this.adapter.mimeType, startedAt, durationMs: 0, done: false });
    // Not awaited: with Firestore offline persistence this is queued if the network is down.
    void setDoc(segmentDoc(this.meetingId, index), {
      index, kind: "chunks", status: "recording", mimeType: this.adapter.mimeType, chunkCount: 0, bytes: 0, durationMs: 0, startedAt, updatedAt: startedAt,
    }).catch(() => this.warn("Could not reach the server; segment details will sync later."));
    this.lastChunkAt = Date.now();
    this.adapter.startSegment(index, this.settings.chunkSeconds, (blob, info) => void this.onChunk(blob, info.segmentIndex, info.chunkIndex));
    this.set({ segmentIndex: index, segmentElapsedMs: 0 });
  }

  private async onChunk(blob: Blob, segmentIndex: number, chunkIndex: number) {
    const now = Date.now();
    if (this.state.phase === "recording" && now - this.lastChunkAt > this.settings.chunkSeconds * 1000 * 3) {
      this.warn(`Audio may be missing for about ${Math.round((now - this.lastChunkAt) / 1000)} s (the browser may have paused the app). Keep this tab open and in the foreground.`);
    }
    this.lastChunkAt = now;
    this.chunkCounts.set(segmentIndex, Math.max(this.chunkCounts.get(segmentIndex) ?? 0, chunkIndex + 1));
    try {
      await localStore.putChunk({ key: chunkKey(this.meetingId, segmentIndex, chunkIndex), meetingId: this.meetingId, segmentIndex, chunkIndex, blob, uploaded: false });
    } catch {
      if (!this.state.localBufferFailed) {
        this.set({ localBufferFailed: true });
        this.warn("Device storage is full: new audio is uploaded directly without a local backup. Free up space to restore crash protection.");
      }
    }
    uploader.enqueue({ meetingId: this.meetingId, segmentIndex, chunkIndex, blob, mimeType: this.adapter.mimeType });
    this.set({ chunksRecorded: this.state.chunksRecorded + 1 });
  }

  private tick() {
    const t = performance.now();
    const dt = t - this.lastTick;
    this.lastTick = t;
    const level = this.adapter.levelDb();
    if (this.state.phase !== "recording") {
      this.set({ levelDb: level });
      return;
    }
    const segElapsed = this.state.segmentElapsedMs + dt;
    const sd = this.settings.silenceDetection;
    let silentMs = this.state.silentMs;
    let autoStopIn = this.state.autoStopIn;
    if (level < sd.thresholdDb) {
      silentMs += dt;
      this.loudMs = 0;
    } else {
      this.loudMs += dt;
      if (this.loudMs > 1500) {
        silentMs = 0;
        autoStopIn = undefined; // speech resumed: withdraw the suggestion
      }
    }
    if (sd.enabled && autoStopIn === undefined && silentMs >= sd.silenceMinutes * 60_000) {
      autoStopIn = sd.countdownSeconds;
    } else if (autoStopIn !== undefined) {
      autoStopIn = Math.max(0, autoStopIn - dt / 1000);
    }
    this.set({ elapsedMs: this.state.elapsedMs + dt, segmentElapsedMs: segElapsed, levelDb: level, silentMs, autoStopIn });
    if (autoStopIn !== undefined && autoStopIn <= 0) {
      this.warn("Recording stopped automatically after a long silence.");
      void this.stop("silence");
      return;
    }
    if (segElapsed >= this.settings.segmentMinutes * 60_000) void this.rollover();
  }

  /** Keep recording, but dismiss the silence suggestion and restart the silence timer. */
  cancelAutoStop() {
    this.set({ autoStopIn: undefined, silentMs: 0 });
  }

  private rolling = false;
  private async rollover() {
    if (this.rolling) return;
    this.rolling = true;
    const index = this.state.segmentIndex;
    await this.adapter.stopSegment();
    this.closeSegment(index);
    await this.beginSegment(index + 1);
    this.rolling = false;
  }

  private closeSegment(index: number) {
    const finalChunkCount = this.chunkCounts.get(index) ?? 0;
    const key = segKey(this.meetingId, index);
    const durationMs = Math.round(this.state.segmentElapsedMs);
    const work = (async () => {
      const meta = await localStore.getSegment(key);
      const endedAt = nowIso();
      if (meta) await localStore.putSegment({ ...meta, finalChunkCount, durationMs, endedAt });
      await setDoc(segmentDoc(this.meetingId, index), { status: "uploading", chunkCount: finalChunkCount, durationMs, endedAt, updatedAt: endedAt }, { merge: true }).catch(() => {});
      if (finalChunkCount === 0) {
        if (meta) await localStore.putSegment({ ...meta, finalChunkCount: 0, done: true });
        return;
      }
      await uploader.drained(this.meetingId, index);
      if (this.state.localBufferFailed) {
        // Without the local buffer we cannot verify per-chunk state; trust the uploader.
        await setDoc(segmentDoc(this.meetingId, index), { status: "uploaded", updatedAt: nowIso() }, { merge: true });
        if (meta) await localStore.putSegment({ ...meta, finalChunkCount, durationMs, endedAt, done: true });
      } else {
        await finalizeSegment(this.meetingId, index);
      }
      this.set({ segmentsFinalized: this.state.segmentsFinalized + 1 });
    })();
    this.finalizers.push(work);
  }

  pause() {
    if (this.state.phase !== "recording") return;
    this.adapter.pause();
    this.set({ phase: "paused", autoStopIn: undefined, silentMs: 0 });
  }

  resume() {
    if (this.state.phase !== "paused") return;
    this.adapter.resume();
    this.lastChunkAt = Date.now();
    this.set({ phase: "recording" });
  }

  async stop(reason = "manual") {
    if (this.state.phase === "stopping" || this.state.phase === "stopped") return;
    this.stopReason = reason;
    clearInterval(this.tickHandle);
    this.set({ phase: "stopping", autoStopIn: undefined });
    // MediaRecorder.stop() also flushes from the paused state.
    await this.adapter.stopSegment();
    this.closeSegment(this.state.segmentIndex);
    this.adapter.close();
    this.set({ phase: "stopped" });
  }

  get reason() {
    return this.stopReason;
  }

  /** Resolves once every segment is confirmed on the server. */
  async uploadsComplete(): Promise<void> {
    await Promise.all(this.finalizers);
  }

  /** Number of segments produced so far (for display). */
  get segmentCount() {
    return this.state.segmentIndex + 1;
  }
}
