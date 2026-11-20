import { z } from "zod";

/**
 * All configuration comes from environment variables on the backend.
 * Provider credentials live ONLY here (Secret Manager → Cloud Run env), never in the web bundle.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  /** api = public HTTP API, worker = Cloud Tasks target, all = both (local dev). */
  ROLE: z.enum(["api", "worker", "all"]).default("all"),
  NODE_ENV: z.string().default("development"),

  FIREBASE_PROJECT_ID: z.string().default("demo-meetbrief"),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),

  /** Comma separated list of allowed browser origins. */
  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  QUEUE_DRIVER: z.enum(["local", "cloud-tasks"]).default("local"),
  CLOUD_TASKS_LOCATION: z.string().default("asia-south1"),
  CLOUD_TASKS_QUEUE: z.string().default("meetbrief-jobs"),
  /** Public URL of the worker service, e.g. https://meetbrief-worker-xxxx.a.run.app */
  WORKER_URL: z.string().optional(),
  /** Service account Cloud Tasks uses to sign OIDC tokens for the worker. */
  TASKS_SERVICE_ACCOUNT: z.string().optional(),
  /** Max processing attempts per step before the job is marked failed. */
  MAX_STEP_ATTEMPTS: z.coerce.number().default(5),

  STT_PROVIDER: z.enum(["mock", "sarvam", "google"]).default("mock"),
  SARVAM_API_KEY: z.string().optional(),
  SARVAM_MODEL: z.string().default("saaras:v3"),
  SARVAM_BASE_URL: z.string().default("https://api.sarvam.ai"),
  GOOGLE_STT_LOCATION: z.string().default("asia-south1"),
  GOOGLE_STT_MODEL: z.string().default("chirp_3"),

  LLM_PROVIDER: z.enum(["mock", "anthropic"]).default("mock"),
  ANTHROPIC_MODEL: z.string().default("claude-opus-5-5"),
  ANTHROPIC_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("high"),

  /** Length of each transcription window. Keeps each Cloud Task well under its dispatch deadline. */
  WINDOW_SECONDS: z.coerce.number().default(600),
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  TMP_DIR: z.string().default("/tmp/meetbrief"),
});

export type Config = z.infer<typeof envSchema>;

export const config: Config = envSchema.parse(process.env);

export function corsOrigins(): string[] {
  return config.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
}

export const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
