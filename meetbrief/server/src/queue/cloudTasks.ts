import { CloudTasksClient } from "@google-cloud/tasks";
import type { QueueMessage } from "@meetbrief/shared";
import { config } from "../config.js";
import type { JobQueue } from "./index.js";

/**
 * Durable queue backed by Google Cloud Tasks. Each step becomes an HTTP task that targets the
 * worker Cloud Run service at POST {WORKER_URL}/tasks/run, signed with an OIDC token.
 *
 * - Durability and retries with exponential backoff are handled by Cloud Tasks (configure the
 *   queue's retry policy; see docs/DEPLOYMENT.md).
 * - Task names are derived from the dedup key, so enqueueing the same step twice is rejected with
 *   ALREADY_EXISTS instead of producing a duplicate.
 * - The HTTP dispatch deadline is capped at 30 minutes by Cloud Tasks, which is why long audio is
 *   split into windows that are each transcribed by their own task.
 */
export class CloudTasksQueue implements JobQueue {
  private client = new CloudTasksClient();

  async enqueue(message: QueueMessage, dedupKey: string, delaySeconds = 0): Promise<void> {
    if (!config.WORKER_URL || !config.TASKS_SERVICE_ACCOUNT) {
      throw new Error("WORKER_URL and TASKS_SERVICE_ACCOUNT must be set when QUEUE_DRIVER=cloud-tasks");
    }
    const parent = this.client.queuePath(config.FIREBASE_PROJECT_ID, config.CLOUD_TASKS_LOCATION, config.CLOUD_TASKS_QUEUE);
    const url = `${config.WORKER_URL.replace(/\/$/, "")}/tasks/run`;
    try {
      await this.client.createTask({
        parent,
        task: {
          name: `${parent}/tasks/${dedupKey}`,
          scheduleTime: delaySeconds ? { seconds: Math.floor(Date.now() / 1000) + delaySeconds } : undefined,
          dispatchDeadline: { seconds: 1800 },
          httpRequest: {
            httpMethod: "POST",
            url,
            headers: { "Content-Type": "application/json" },
            body: Buffer.from(JSON.stringify(message)).toString("base64"),
            oidcToken: { serviceAccountEmail: config.TASKS_SERVICE_ACCOUNT, audience: config.WORKER_URL },
          },
        },
      });
    } catch (err: unknown) {
      // 6 = ALREADY_EXISTS: the step was already enqueued; that is the idempotent outcome we want.
      if ((err as { code?: number }).code === 6) return;
      throw err;
    }
  }
}
