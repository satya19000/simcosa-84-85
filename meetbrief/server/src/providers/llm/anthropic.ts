import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { config } from "../../config.js";
import { ASK_SYSTEM_PROMPT, REPORT_SYSTEM_PROMPT, meetingContext, reportUserPrompt, transcriptToText } from "../../reports/prompts.js";
import { PermanentProviderError } from "../stt/types.js";
import { reportDraftSchema, type AskInput, type LlmProvider, type ReportDraft, type ReportInput } from "./types.js";

/**
 * Claude via the official Anthropic SDK. The key is read from ANTHROPIC_API_KEY on the backend only.
 *
 * - Streaming + finalMessage(): long transcripts and long reports never hit HTTP timeouts.
 * - Structured output (JSON schema from Zod) for the report so the pipeline gets typed data.
 * - Server-side refusal fallback ("default") is enabled so a classifier decline is retried on a
 *   fallback model instead of failing the job.
 * - The system prompt is a stable cached prefix.
 */
export class AnthropicLlmProvider implements LlmProvider {
  readonly name = "anthropic";
  readonly model = config.ANTHROPIC_MODEL;
  private client = new Anthropic();

  async generateReport(input: ReportInput): Promise<ReportDraft> {
    const stream = this.client.beta.messages.stream({
      model: this.model,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: config.ANTHROPIC_EFFORT, format: zodOutputFormat(reportDraftSchema) },
      system: [{ type: "text", text: REPORT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: reportUserPrompt(input.meeting, input.utterances) }],
    });
    const message = await this.finish(stream);
    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = reportDraftSchema.safeParse(JSON.parse(text));
    if (!parsed.success) throw new Error(`Report did not match schema: ${parsed.error.message.slice(0, 500)}`);
    return parsed.data;
  }

  async ask(input: AskInput): Promise<string> {
    const stream = this.client.beta.messages.stream({
      model: this.model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: [
        { type: "text", text: ASK_SYSTEM_PROMPT },
        {
          // The meeting material is the cached prefix, so follow-up questions are cheap and fast.
          type: "text",
          text: `<meeting_details>\n${meetingContext(input.meeting)}\n</meeting_details>\n<minutes>\n${input.minutesText}\n</minutes>\n<transcript>\n${transcriptToText(input.meeting, input.utterances)}\n</transcript>`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: input.question }],
    });
    const message = await this.finish(stream);
    return message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  }

  private async finish(stream: { finalMessage(): Promise<Anthropic.Beta.Messages.BetaMessage> }): Promise<Anthropic.Beta.Messages.BetaMessage> {
    try {
      const message = await stream.finalMessage();
      if (message.stop_reason === "refusal") {
        throw new PermanentProviderError("The AI model declined to process this meeting.");
      }
      if (message.stop_reason === "max_tokens") throw new Error("The AI response was cut off (max_tokens).");
      return message;
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        throw new PermanentProviderError("Anthropic credentials are missing or invalid.");
      }
      if (err instanceof Anthropic.BadRequestError) throw new PermanentProviderError(`AI request rejected: ${err.message}`);
      throw err; // rate limits, 5xx and network errors are retried by the queue
    }
  }
}
