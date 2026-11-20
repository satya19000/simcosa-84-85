import type { QueueMessage } from "@meetbrief/shared";
import type { JobQueue, StepHandler } from "./index.js";

/**
 * In-process queue for local development and tests. Not durable: if the process dies,
 * the job documents in Firestore still record progress and `POST /api/meetings/:id/process`
 * can be called again to resume (every step is idempotent).
 */
export class LocalQueue implements JobQueue {
  private seen = new Set<string>();
  private running = 0;
  private pending: Array<() => Promise<void>> = [];

  constructor(private getHandler: () => StepHandler, private concurrency = 3) {}

  async enqueue(message: QueueMessage, dedupKey: string, delaySeconds = 0): Promise<void> {
    if (this.seen.has(dedupKey)) return;
    this.seen.add(dedupKey);
    const run = async () => {
      let attempt = 0;
      for (;;) {
        attempt++;
        const outcome = await this.getHandler()(message).catch((e: unknown) => ({
          ok: false as const,
          retry: true,
          error: String(e),
        }));
        if (outcome.ok || !outcome.retry || attempt >= 5) return;
        await new Promise((r) => setTimeout(r, Math.min(30_000, 500 * 2 ** attempt)));
      }
    };
    setTimeout(() => this.schedule(run), delaySeconds * 1000);
  }

  private schedule(task: () => Promise<void>) {
    this.pending.push(task);
    this.drain();
  }

  private drain() {
    while (this.running < this.concurrency && this.pending.length) {
      const task = this.pending.shift()!;
      this.running++;
      task().finally(() => {
        this.running--;
        this.drain();
      });
    }
  }
}
