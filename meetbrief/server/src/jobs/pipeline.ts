import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import {
  TRANSCRIPT_PAGE_SIZE,
  segmentId,
  type ActionItem,
  type Meeting,
  type MeetingReport,
  type ProcessingStage,
  type QueueMessage,
  type Segment,
  type Utterance,
} from "@meetbrief/shared";
import { config } from "../config.js";
import { bucket, db, nowIso } from "../firebase.js";
import { dedupKeyFor, getQueue, type StepOutcome } from "../queue/index.js";
import {
  concatFlac,
  cutFlac,
  detectSilences,
  encodePlayback,
  hasAudioStream,
  normaliseToFlac,
  probeDurationSec,
} from "../audio/ffmpeg.js";
import { planWindows, type Window } from "../audio/cuts.js";
import { getSttProvider, PermanentProviderError } from "../providers/stt/index.js";
import { getLlmProvider, parseTimestamp } from "../providers/llm/index.js";

interface JobWindow extends Window {
  path: string;
}

export interface JobDoc {
  meetingId: string;
  ownerId: string;
  status: "running" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  prepared?: boolean;
  windows?: JobWindow[];
  windowsDone?: number;
  attempts?: Record<string, number>;
  error?: string;
  sttProvider?: string;
  sttModel?: string;
}

const jobRef = (jobId: string) => db.collection("jobs").doc(jobId);
const meetingRef = (id: string) => db.collection("meetings").doc(id);

async function setProgress(meetingId: string, stage: ProcessingStage, percent: number, message?: string, extra: Partial<Meeting> = {}) {
  await meetingRef(meetingId).set(
    {
      ...extra,
      status: stage === "done" ? "ready" : stage === "failed" ? "failed" : "processing",
      progress: { stage, percent: Math.round(percent), message: message ?? null, updatedAt: nowIso() },
      updatedAt: nowIso(),
    },
    { merge: true },
  );
}

/** Create a job and enqueue its first step. Returns the job id. */
export async function startProcessing(meeting: Meeting): Promise<string> {
  const jobId = `${meeting.id}-${Date.now().toString(36)}`;
  const job: JobDoc = { meetingId: meeting.id, ownerId: meeting.ownerId, status: "running", createdAt: nowIso(), updatedAt: nowIso() };
  await jobRef(jobId).set(job);
  await meetingRef(meeting.id).set(
    {
      status: "queued",
      currentJobId: jobId,
      progress: { stage: "waiting", percent: 0, message: "Waiting in queue", updatedAt: nowIso() },
      updatedAt: nowIso(),
    },
    { merge: true },
  );
  const msg: QueueMessage = { jobId, step: "prepare" };
  await getQueue().enqueue(msg, dedupKeyFor(msg));
  return jobId;
}

/** Entry point for every queue delivery. Each step is idempotent and safe to redeliver. */
export async function runStep(message: QueueMessage): Promise<StepOutcome> {
  const snap = await jobRef(message.jobId).get();
  if (!snap.exists) return { ok: false, retry: false, error: "Job not found" };
  const job = snap.data() as JobDoc;
  if (job.status !== "running") return { ok: true }; // finished or failed: drop late duplicates

  const attemptKey = `${message.step}${message.window ?? ""}`;
  await jobRef(message.jobId).update({ [`attempts.${attemptKey}`]: FieldValue.increment(1), updatedAt: nowIso() });
  const attempts = (job.attempts?.[attemptKey] ?? 0) + 1;

  const workDir = path.join(config.TMP_DIR, message.jobId, `${attemptKey}-${attempts}`);
  await mkdir(workDir, { recursive: true });
  try {
    switch (message.step) {
      case "prepare":
        await prepare(message.jobId, job, workDir);
        break;
      case "transcribe_window":
        await transcribeWindow(message.jobId, message.window ?? 0, workDir);
        break;
      case "merge":
        await merge(message.jobId, job);
        break;
      case "report":
        await report(message.jobId, job);
        break;
    }
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const permanent = err instanceof PermanentProviderError || attempts >= config.MAX_STEP_ATTEMPTS;
    console.error(`[job ${message.jobId}] step ${attemptKey} attempt ${attempts} failed${permanent ? " permanently" : ""}:`, error);
    if (permanent) {
      await jobRef(message.jobId).update({ status: "failed", error, updatedAt: nowIso() });
      await setProgress(job.meetingId, "failed", 0, "Processing failed", {});
      await meetingRef(job.meetingId).set({ progress: { error } }, { merge: true });
      return { ok: false, retry: false, error };
    }
    await meetingRef(job.meetingId).set({ progress: { message: `Retrying after a temporary error (attempt ${attempts})` } }, { merge: true });
    return { ok: false, retry: true, error };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function prepare(jobId: string, job: JobDoc, dir: string) {
  const fresh = (await jobRef(jobId).get()).data() as JobDoc;
  if (!fresh.prepared) {
    await setProgress(job.meetingId, "preparing_audio", 2, "Reconstructing the meeting audio");
    const meeting = (await meetingRef(job.meetingId).get()).data() as Meeting;
    const segSnap = await meetingRef(job.meetingId).collection("segments").orderBy("index").get();
    const segments = segSnap.docs.map((d) => d.data() as Segment);
    if (!segments.length) throw new PermanentProviderError("No audio has been uploaded for this meeting.");
    const notReady = segments.filter((s) => s.status !== "uploaded");
    if (notReady.length) throw new Error(`Segments still uploading: ${notReady.map((s) => s.index).join(", ")}`);

    // 1. Ordered reconstruction: each segment → normalised FLAC, then concatenate in index order.
    const flacs: string[] = [];
    for (const seg of segments) {
      const raw = path.join(dir, `seg-${segmentId(seg.index)}.src`);
      if (seg.kind === "file") {
        if (!seg.objectPath) throw new PermanentProviderError(`Segment ${seg.index} has no file`);
        await bucket.file(seg.objectPath).download({ destination: raw });
      } else {
        await downloadChunks(job.meetingId, seg, raw);
      }
      if (!(await hasAudioStream(raw))) throw new PermanentProviderError(`Segment ${seg.index + 1} contains no audio track.`);
      const flac = path.join(dir, `seg-${segmentId(seg.index)}.flac`);
      await normaliseToFlac(raw, flac);
      await rm(raw, { force: true });
      flacs.push(flac);
    }
    const full = path.join(dir, "timeline.flac");
    if (flacs.length === 1) await writeFile(full, await readFile(flacs[0]));
    else await concatFlac(flacs, path.join(dir, "list.txt"), full, (p, c) => writeFile(p, c));
    const durationSec = await probeDurationSec(full);

    // 2. Single-timeline playback file.
    await setProgress(job.meetingId, "preparing_audio", 6, "Creating the playback file");
    const playback = path.join(dir, "playback.m4a");
    await encodePlayback(full, playback);
    const playbackPath = `meetings/${job.meetingId}/processed/playback.m4a`;
    await bucket.upload(playback, { destination: playbackPath, contentType: "audio/mp4" });
    await meetingRef(job.meetingId).collection("files").doc("playback").set({
      id: "playback", kind: "playback", format: "m4a", path: playbackPath, label: "Full meeting audio (playback copy)", createdAt: nowIso(),
    });

    // 3. Windows cut at pauses.
    await setProgress(job.meetingId, "preparing_audio", 8, "Splitting audio at natural pauses");
    const silences = await detectSilences(full);
    const plan = planWindows(durationSec, silences, config.WINDOW_SECONDS);
    const windows: JobWindow[] = [];
    for (const w of plan) {
      const local = path.join(dir, `w-${w.index}.flac`);
      await cutFlac(full, w.startSec, w.endSec, local);
      const dest = `meetings/${job.meetingId}/processed/${jobId}/w-${String(w.index).padStart(4, "0")}.flac`;
      await bucket.upload(local, { destination: dest, contentType: "audio/flac" });
      await rm(local, { force: true });
      windows.push({ ...w, path: dest });
    }
    const stt = getSttProvider();
    await jobRef(jobId).update({ prepared: true, windows, windowsDone: 0, sttProvider: stt.name, sttModel: stt.model, updatedAt: nowIso() });
    await setProgress(job.meetingId, "transcribing", 10, `Transcribing ${windows.length} part(s)`, {
      durationMs: Math.round(durationSec * 1000),
      segmentCount: segments.length,
      playbackPath,
      reportLanguage: meeting.reportLanguage,
    });
  }
  const prepared = (await jobRef(jobId).get()).data() as JobDoc;
  for (const w of prepared.windows ?? []) {
    const msg: QueueMessage = { jobId, step: "transcribe_window", window: w.index };
    await getQueue().enqueue(msg, dedupKeyFor(msg));
  }
}

async function downloadChunks(meetingId: string, seg: Segment, dest: string) {
  const prefix = `meetings/${meetingId}/segments/${segmentId(seg.index)}/`;
  const [files] = await bucket.getFiles({ prefix });
  const chunks = files.filter((f) => /chunk-\d+\./.test(f.name)).sort((a, b) => a.name.localeCompare(b.name));
  if (chunks.length < seg.chunkCount) {
    throw new Error(`Segment ${seg.index}: ${chunks.length} of ${seg.chunkCount} chunks present`);
  }
  // MediaRecorder chunks of one recording are byte-continuous; concatenation restores the stream.
  const buffers: Buffer[] = [];
  for (const f of chunks.slice(0, seg.chunkCount)) buffers.push((await f.download())[0]);
  await writeFile(dest, Buffer.concat(buffers));
}

async function transcribeWindow(jobId: string, index: number, dir: string) {
  const winRef = jobRef(jobId).collection("windows").doc(String(index));
  const existing = await winRef.get();
  if (!existing.exists || existing.data()?.status !== "done") {
    const job = (await jobRef(jobId).get()).data() as JobDoc;
    const w = job.windows?.find((x) => x.index === index);
    if (!w) throw new PermanentProviderError(`Unknown window ${index}`);
    const meeting = (await meetingRef(job.meetingId).get()).data() as Meeting;
    const local = path.join(dir, `w-${index}.flac`);
    await bucket.file(w.path).download({ destination: local });
    const hints = [
      meeting.chairperson,
      meeting.department,
      ...meeting.participants.flatMap((p) => [p.name, p.designation]),
      ...meeting.agenda,
    ].filter((x): x is string => Boolean(x && x.length < 100));
    const segments = await getSttProvider().transcribe({
      localPath: local,
      gcsUri: `gs://${bucket.name}/${w.path}`,
      durationSec: w.endSec - w.startSec,
      spokenLanguage: meeting.spokenLanguage,
      vocabularyHints: hints,
    });
    const offsetMs = Math.round(w.startSec * 1000);
    const utterances: Utterance[] = segments.map((s, i) => ({
      id: `w${index}-${i}`,
      startMs: offsetMs + Math.round(s.startSec * 1000),
      endMs: offsetMs + Math.round(s.endSec * 1000),
      // Speaker labels come from the provider when it diarizes; users can rename them in the UI.
      speaker: s.speaker ?? "",
      text: s.text,
      lang: s.lang,
      confidence: s.confidence,
    }));
    await winRef.set({ status: "done", utterances, createdAt: nowIso() });
  }

  // Count completion exactly once per window, then trigger merge when all are done.
  const allDone = await db.runTransaction(async (tx) => {
    const jobSnap = await tx.get(jobRef(jobId));
    const win = await tx.get(winRef);
    const job = jobSnap.data() as JobDoc;
    let done = job.windowsDone ?? 0;
    if (!win.data()?.counted) {
      done += 1;
      tx.update(winRef, { counted: true });
      tx.update(jobRef(jobId), { windowsDone: done, updatedAt: nowIso() });
    }
    return { done, total: job.windows?.length ?? 0, meetingId: job.meetingId };
  });
  await setProgress(allDone.meetingId, "transcribing", 10 + (70 * allDone.done) / Math.max(1, allDone.total), `Transcribed ${allDone.done} of ${allDone.total} part(s)`);
  if (allDone.done >= allDone.total) {
    const msg: QueueMessage = { jobId, step: "merge" };
    await getQueue().enqueue(msg, dedupKeyFor(msg));
  }
}

async function merge(jobId: string, job: JobDoc) {
  await setProgress(job.meetingId, "merging", 82, "Assembling the transcript");
  const fresh = (await jobRef(jobId).get()).data() as JobDoc;
  const winSnap = await jobRef(jobId).collection("windows").get();
  const byIndex = new Map(winSnap.docs.map((d) => [Number(d.id), d.data().utterances as Utterance[]]));
  const utterances: Utterance[] = [];
  for (const w of fresh.windows ?? []) utterances.push(...(byIndex.get(w.index) ?? []));
  utterances.sort((a, b) => a.startMs - b.startMs);

  const pagesRef = meetingRef(job.meetingId).collection("transcriptPages");
  const old = await pagesRef.get();
  const batch = db.batch();
  old.docs.forEach((d) => batch.delete(d.ref));
  for (let p = 0; p * TRANSCRIPT_PAGE_SIZE < Math.max(1, utterances.length); p++) {
    batch.set(pagesRef.doc(String(p).padStart(4, "0")), {
      page: p,
      utterances: utterances.slice(p * TRANSCRIPT_PAGE_SIZE, (p + 1) * TRANSCRIPT_PAGE_SIZE),
      provider: fresh.sttProvider ?? "",
      model: fresh.sttModel ?? "",
      createdAt: nowIso(),
    });
  }
  await batch.commit();

  const jsonPath = `meetings/${job.meetingId}/processed/transcript.json`;
  await bucket.file(jsonPath).save(JSON.stringify({ utterances }, null, 1), { contentType: "application/json" });
  await meetingRef(job.meetingId).collection("files").doc("transcript-json").set({
    id: "transcript-json", kind: "transcript", format: "json", path: jsonPath, label: "Raw transcript (JSON)", createdAt: nowIso(),
  });
  const msg: QueueMessage = { jobId, step: "report" };
  await getQueue().enqueue(msg, dedupKeyFor(msg));
}

export async function loadTranscript(meetingId: string): Promise<Utterance[]> {
  const snap = await meetingRef(meetingId).collection("transcriptPages").orderBy("page").get();
  return snap.docs.flatMap((d) => d.data().utterances as Utterance[]);
}

async function report(jobId: string, job: JobDoc) {
  await setProgress(job.meetingId, "writing_minutes", 88, "Writing summary and minutes");
  await generateAndSaveReport(job.meetingId);
  await jobRef(jobId).update({ status: "done", updatedAt: nowIso() });
}

/** Also used by the "Regenerate minutes" action. */
export async function generateAndSaveReport(meetingId: string): Promise<MeetingReport> {
  const meetingSnap = await meetingRef(meetingId).get();
  const meeting = { ...(meetingSnap.data() as Meeting), id: meetingId };
  const utterances = await loadTranscript(meetingId);
  const llm = getLlmProvider();
  if (!utterances.length) throw new PermanentProviderError("No speech was recognised in this recording.");
  const draft = await llm.generateReport({ meeting, utterances });

  const reportDoc: MeetingReport = {
    language: meeting.reportLanguage,
    templateId: meeting.templateId,
    title: draft.title || meeting.title,
    executiveSummary: draft.executiveSummary,
    teluguSummary: draft.teluguSummary || undefined,
    keyPoints: draft.keyPoints,
    minutes: draft.minutes,
    decisions: draft.decisions.map((d) => ({ text: d.text, owner: d.owner || undefined, sourceStartMs: parseTimestamp(d.sourceTime) })),
    actionItems: draft.actionItems.map((a) => ({
      title: a.title,
      assignee: a.assignee || undefined,
      assigneeDesignation: a.assigneeDesignation || undefined,
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(a.dueDate) ? a.dueDate : undefined,
      dueText: a.dueText || undefined,
      priority: a.priority,
      sourceQuote: a.sourceQuote || undefined,
      sourceStartMs: parseTimestamp(a.sourceTime),
    })),
    openQuestions: draft.openQuestions,
    nextMeeting: draft.nextMeeting || undefined,
    reviewNotes: draft.reviewNotes,
    provider: llm.name,
    model: llm.model,
    generatedAt: nowIso(),
  };
  await meetingRef(meetingId).collection("reports").doc("current").set(reportDoc);

  // Replace previously generated tasks that nobody has touched; keep ones users progressed.
  const tasksCol = db.collection("tasks");
  const oldTasks = await tasksCol.where("meetingId", "==", meetingId).where("generated", "==", true).get();
  const batch = db.batch();
  oldTasks.docs.forEach((d) => {
    const t = d.data() as ActionItem & { userEdited?: boolean };
    if (t.status === "open" && !t.userEdited) batch.delete(d.ref);
  });
  for (const a of reportDoc.actionItems) {
    const ref = tasksCol.doc();
    const task: ActionItem & { generated: boolean } = {
      id: ref.id,
      meetingId,
      meetingTitle: meeting.title,
      ownerId: meeting.ownerId,
      memberIds: meeting.memberIds,
      ...a,
      status: "open",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      generated: true,
    };
    batch.set(ref, task);
  }
  await batch.commit();
  const openCount = (await tasksCol.where("meetingId", "==", meetingId).where("status", "!=", "done").get()).size;
  await setProgress(meetingId, "done", 100, "Ready for review", {
    openTaskCount: openCount,
    summarySnippet: reportDoc.executiveSummary.slice(0, 280),
  });
  return reportDoc;
}
