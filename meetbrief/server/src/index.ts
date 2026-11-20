import { mkdir } from "node:fs/promises";
import { config } from "./config.js";
import { createApp } from "./app.js";
import { setStepHandler } from "./queue/index.js";
import { runStep } from "./jobs/pipeline.js";

setStepHandler(runStep);
await mkdir(config.TMP_DIR, { recursive: true });

createApp().listen(config.PORT, () => {
  console.log(
    `MeetBrief ${config.ROLE} listening on :${config.PORT} (queue=${config.QUEUE_DRIVER}, stt=${config.STT_PROVIDER}, llm=${config.LLM_PROVIDER})`,
  );
});
