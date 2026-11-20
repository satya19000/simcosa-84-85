import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import type { Meeting, MeetingReport, QueueMessage, Segment } from "@meetbrief/shared";
import { config, corsOrigins } from "./config.js";
import { bucket, db, nowIso } from "./firebase.js";
import { HttpError, loadMeetingForUser, requireUser, type AuthedRequest } from "./auth.js";
import { getStepHandler } from "./queue/index.js";
import { loadTranscript, startProcessing } from "./jobs/pipeline.js";
import { getQueue, dedupKeyFor } from "./queue/index.js";
import { getLlmProvider } from "./providers/llm/index.js";
import { renderMinutesDocx, renderMinutesMarkdown, renderTranscriptText } from "./reports/render.js";

type Handler = (req: AuthedRequest, res: Response) => Promise<void>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req as AuthedRequest, res).catch(next);

/** Small per-user limiter for the AI endpoints (in-memory; per instance). */
const hits = new Map<string, number[]>();
function rateLimit(uid: string, perMinute: number) {
  const now = Date.now();
  const list = (hits.get(uid) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= perMinute) throw new HttpError(429, "Too many requests. Please wait a minute.");
  list.push(now);
  hits.set(uid, list);
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true, role: config.ROLE, stt: config.STT_PROVIDER, llm: config.LLM_PROVIDER, queue: config.QUEUE_DRIVER });
  });

  if (config.ROLE !== "worker") mountApi(app);
  if (config.ROLE !== "api") mountWorker(app);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues.map((i) => i.message).join("; ") });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  });
  return app;
}

function mountApi(app: express.Express) {
  const api = express.Router();
  api.use(cors({ origin: corsOrigins(), credentials: false }));
  api.use(requireUser);

  api.post(
    "/meetings/:id/process",
    wrap(async (req, res) => {
      const meeting = await loadMeetingForUser(String(req.params.id), req.uid);
      if (meeting.status === "processing" || meeting.status === "queued") {
        const force = z.object({ force: z.boolean().optional() }).parse(req.body ?? {}).force;
        if (!force) throw new HttpError(409, "This meeting is already being processed.");
      }
      const segs = await db.collection("meetings").doc(meeting.id).collection("segments").get();
      if (segs.empty) throw new HttpError(400, "Record or upload audio first.");
      const pending = segs.docs.map((d) => d.data() as Segment).filter((s) => s.status !== "uploaded");
      if (pending.length) throw new HttpError(409, `Still uploading ${pending.length} segment(s). Processing will be possible once uploads finish.`);
      const jobId = await startProcessing(meeting);
      res.status(202).json({ jobId });
    }),
  );

  api.post(
    "/meetings/:id/regenerate",
    wrap(async (req, res) => {
      const meeting = await loadMeetingForUser(String(req.params.id), req.uid);
      rateLimit(req.uid, 5);
      const pages = await db.collection("meetings").doc(meeting.id).collection("transcriptPages").limit(1).get();
      if (pages.empty) throw new HttpError(400, "There is no transcript yet.");
      // A report-only job: same queue, same retry semantics as full processing.
      const jobId = `${meeting.id}-r${Date.now().toString(36)}`;
      await db.collection("jobs").doc(jobId).set({ meetingId: meeting.id, ownerId: meeting.ownerId, status: "running", prepared: true, createdAt: nowIso(), updatedAt: nowIso() });
      await db.collection("meetings").doc(meeting.id).set(
        { status: "processing", progress: { stage: "writing_minutes", percent: 88, message: "Rewriting minutes", updatedAt: nowIso() } },
        { merge: true },
      );
      const msg: QueueMessage = { jobId, step: "report" };
      await getQueue().enqueue(msg, dedupKeyFor(msg));
      res.status(202).json({ jobId });
    }),
  );

  api.post(
    "/meetings/:id/ask",
    wrap(async (req, res) => {
      const { question } = z.object({ question: z.string().trim().min(2).max(2000) }).parse(req.body);
      const meeting = await loadMeetingForUser(String(req.params.id), req.uid);
      rateLimit(req.uid, 20);
      const utterances = await loadTranscript(meeting.id);
      if (!utterances.length) throw new HttpError(400, "There is no transcript yet.");
      const reportSnap = await db.collection("meetings").doc(meeting.id).collection("reports").doc("current").get();
      const minutesText = reportSnap.exists ? renderMinutesMarkdown(meeting, reportSnap.data() as MeetingReport) : "";
      const answer = await getLlmProvider().ask({ meeting, utterances, minutesText, question });
      const ref = db.collection("meetings").doc(meeting.id).collection("qa").doc();
      const entry = { id: ref.id, question, answer, askedBy: req.uid, createdAt: nowIso() };
      await ref.set(entry);
      res.json(entry);
    }),
  );

  api.get(
    "/meetings/:id/export",
    wrap(async (req, res) => {
      const format = z.enum(["docx", "md", "txt", "transcript"]).parse(req.query.format);
      const meeting = await loadMeetingForUser(String(req.params.id), req.uid);
      const safeTitle = meeting.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 80) || "meeting";
      let body: Buffer;
      let type: string;
      let ext: string;
      if (format === "transcript") {
        body = Buffer.from(renderTranscriptText(meeting, await loadTranscript(meeting.id)), "utf8");
        type = "text/plain; charset=utf-8";
        ext = "transcript.txt";
      } else {
        const snap = await db.collection("meetings").doc(meeting.id).collection("reports").doc("current").get();
        if (!snap.exists) throw new HttpError(400, "Minutes are not ready yet.");
        const report = snap.data() as MeetingReport;
        if (format === "docx") {
          body = await renderMinutesDocx(meeting, report);
          type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          ext = "minutes.docx";
        } else {
          body = Buffer.from(renderMinutesMarkdown(meeting, report), "utf8");
          type = format === "md" ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8";
          ext = format === "md" ? "minutes.md" : "minutes.txt";
        }
      }
      // Keep a copy in the meeting's Files tab.
      const path = `meetings/${meeting.id}/exports/${ext}`;
      await bucket.file(path).save(body, { contentType: type });
      await db.collection("meetings").doc(meeting.id).collection("files").doc(`export-${ext.replace(/\./g, "-")}`).set({
        id: `export-${ext.replace(/\./g, "-")}`,
        kind: format === "transcript" ? "transcript" : "minutes",
        format: ext.split(".").pop(),
        path,
        label: format === "transcript" ? "Transcript (text)" : `Minutes (${ext.split(".").pop()?.toUpperCase()})`,
        bytes: body.length,
        createdAt: nowIso(),
      });
      res.setHeader("Content-Type", type);
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(`${safeTitle} - ${ext}`)}`);
      res.send(body);
    }),
  );

  api.get(
    "/search",
    wrap(async (req, res) => {
      const q = z.string().trim().min(2).max(100).parse(req.query.q).toLowerCase();
      const meetings = await db.collection("meetings").where("memberIds", "array-contains", req.uid).orderBy("createdAt", "desc").limit(100).get();
      const results: Array<{ meetingId: string; title: string; date: string; field: string; snippet: string; startMs?: number }> = [];
      for (const doc of meetings.docs) {
        const m = { ...(doc.data() as Meeting), id: doc.id };
        const add = (field: string, text: string, startMs?: number) => {
          const i = text.toLowerCase().indexOf(q);
          if (i < 0) return false;
          results.push({ meetingId: m.id, title: m.title, date: m.date, field, snippet: snippet(text, i, q.length), startMs });
          return true;
        };
        add("title", m.title);
        add("agenda", m.agenda.join(" · "));
        if (m.summarySnippet) add("summary", m.summarySnippet);
        if (m.status === "ready") {
          const pages = await doc.ref.collection("transcriptPages").orderBy("page").get();
          let count = 0;
          for (const p of pages.docs) {
            for (const u of p.data().utterances as Array<{ text: string; startMs: number }>) {
              if (count < 5 && add("transcript", u.text, u.startMs)) count++;
            }
          }
        }
        if (results.length > 200) break;
      }
      res.json({ results });
    }),
  );

  api.delete(
    "/meetings/:id",
    wrap(async (req, res) => {
      const meeting = await loadMeetingForUser(String(req.params.id), req.uid);
      if (meeting.ownerId !== req.uid) throw new HttpError(403, "Only the owner can delete this meeting.");
      await bucket.deleteFiles({ prefix: `meetings/${meeting.id}/` });
      const ref = db.collection("meetings").doc(meeting.id);
      await db.recursiveDelete(ref);
      const tasks = await db.collection("tasks").where("meetingId", "==", meeting.id).get();
      const batch = db.batch();
      tasks.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      res.json({ ok: true });
    }),
  );

  app.use("/api", api);
}

function snippet(text: string, index: number, len: number) {
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + len + 60);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

const oidc = new OAuth2Client();

function mountWorker(app: express.Express) {
  app.post("/tasks/run", async (req, res) => {
    if (config.QUEUE_DRIVER === "cloud-tasks") {
      // Only Cloud Tasks (signing as our service account) may trigger work.
      try {
        const token = (req.header("authorization") ?? "").replace(/^Bearer /, "");
        const ticket = await oidc.verifyIdToken({ idToken: token, audience: config.WORKER_URL });
        if (ticket.getPayload()?.email !== config.TASKS_SERVICE_ACCOUNT) throw new Error("wrong caller");
      } catch {
        res.status(403).json({ error: "forbidden" });
        return;
      }
    } else if (config.ROLE !== "all") {
      res.status(403).json({ error: "worker endpoint disabled" });
      return;
    }
    const message = req.body as QueueMessage;
    const outcome = await getStepHandler()(message);
    // Non-2xx makes Cloud Tasks retry with backoff; permanent failures return 200 to stop retries.
    if (!outcome.ok && outcome.retry) res.status(500).json(outcome);
    else res.json(outcome);
  });
}
