/**
 * Recording adapter boundary.
 *
 * The meeting workflow (segments, chunk buffering, uploads, processing) talks only to this
 * interface. The web build uses MediaRecorder; future native clients (Windows desktop,
 * Android foreground service) implement the same contract and reuse the backend unchanged:
 * they produce ordered chunks per segment and upload them to the same storage paths.
 */
export interface ChunkInfo {
  segmentIndex: number;
  chunkIndex: number;
  /** Wall-clock time the chunk was delivered. */
  at: number;
}

export interface RecorderAdapter {
  readonly kind: "web" | "windows" | "android";
  readonly mimeType: string;
  /** Ask for microphone access. Must only be called after an explicit user action. */
  open(): Promise<void>;
  startSegment(segmentIndex: number, chunkSeconds: number, onChunk: (blob: Blob, info: ChunkInfo) => void): void;
  /** Resolves after the final chunk of the segment has been delivered. */
  stopSegment(): Promise<void>;
  pause(): void;
  resume(): void;
  /** Current input level in dBFS (−100 … 0). */
  levelDb(): number;
  /** Called if the input device disappears or permission is revoked. */
  onInputLost(cb: () => void): void;
  close(): void;
}

export function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export class WebRecorderAdapter implements RecorderAdapter {
  readonly kind = "web" as const;
  mimeType = pickMimeType();
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private buf?: Float32Array<ArrayBuffer>;
  private lostCb?: () => void;

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
  }

  async open() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.stream.getAudioTracks().forEach((t) => (t.onended = () => this.lostCb?.()));
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.buf = new Float32Array(this.analyser.fftSize);
    src.connect(this.analyser);
  }

  startSegment(segmentIndex: number, chunkSeconds: number, onChunk: (blob: Blob, info: ChunkInfo) => void) {
    if (!this.stream) throw new Error("Microphone not open");
    let chunkIndex = 0;
    const rec = new MediaRecorder(this.stream, { mimeType: this.mimeType || undefined, audioBitsPerSecond: 32_000 });
    this.mimeType = rec.mimeType || this.mimeType;
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) onChunk(e.data, { segmentIndex, chunkIndex: chunkIndex++, at: Date.now() });
    };
    rec.start(chunkSeconds * 1000);
    this.recorder = rec;
  }

  stopSegment(): Promise<void> {
    const rec = this.recorder;
    this.recorder = undefined;
    if (!rec || rec.state === "inactive") return Promise.resolve();
    return new Promise((resolve) => {
      // `stop` fires after the final dataavailable.
      rec.addEventListener("stop", () => resolve(), { once: true });
      rec.stop();
    });
  }

  pause() {
    if (this.recorder?.state === "recording") this.recorder.pause();
  }

  resume() {
    if (this.recorder?.state === "paused") this.recorder.resume();
    void this.ctx?.resume();
  }

  levelDb(): number {
    if (!this.analyser || !this.buf) return -100;
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (const v of this.buf) sum += v * v;
    const rms = Math.sqrt(sum / this.buf.length);
    return rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
  }

  onInputLost(cb: () => void) {
    this.lostCb = cb;
  }

  close() {
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.stream = undefined;
  }
}
