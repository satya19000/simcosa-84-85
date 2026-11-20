import type { QueueMessage } from "@meetbrief/shared";
import { config } from "../config.js";
import { CloudTasksQueue } from "./cloudTasks.js";
import { LocalQueue } from "./local.js";

export interface JobQueue {
  /**
   * Enqueue a step. `dedupKey` makes enqueueing idempotent: enqueueing the same key twice
   * results in one delivery (Cloud Tasks task names; an in-memory set locally).
   */
  enqueue(message: QueueMessage, dedupKey: string, delaySeconds?: number): Promise<void>;
}

/** Result of running a step. `retry` asks the queue to redeliver later. */
export type StepOutcome = { ok: true } | { ok: false; retry: boolean; error: string };

export type StepHandler = (message: QueueMessage) => Promise<StepOutcome>;

let queue: JobQueue | undefined;
let handler: StepHandler | undefined;

export function setStepHandler(h: StepHandler) {
  handler = h;
}

export function getStepHandler(): StepHandler {
  if (!handler) throw new Error("Step handler not registered");
  return handler;
}

export function getQueue(): JobQueue {
  if (!queue) {
    queue = config.QUEUE_DRIVER === "cloud-tasks" ? new CloudTasksQueue() : new LocalQueue(() => getStepHandler());
  }
  return queue;
}

export function dedupKeyFor(m: QueueMessage, attemptTag = "0"): string {
  return [m.jobId, m.step, m.window ?? "x", attemptTag].join("-").replace(/[^A-Za-z0-9_-]/g, "_");
}
