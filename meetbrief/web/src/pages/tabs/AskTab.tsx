import { useState } from "react";
import { Send } from "lucide-react";
import type { Meeting } from "@meetbrief/shared";
import { api } from "../../lib/api";
import { useQa } from "../../lib/data";
import { Banner, Button, Textarea } from "../../components/ui";

const SUGGESTIONS = [
  "What did the chair direct about pending HMIS entries?",
  "Who is responsible for each action, and by when?",
  "ఈ సమావేశంలో తీసుకున్న ముఖ్య నిర్ణయాలు ఏమిటి?",
  "Which figures were mentioned for immunisation coverage?",
];

export function AskTab({ meeting: m }: { meeting: Meeting }) {
  const qa = useQa(m.id);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const ready = m.status === "ready";

  const ask = async (question: string) => {
    setBusy(true);
    setError(undefined);
    try {
      await api.ask(m.id, question);
      setQ("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 pt-5">
      {!ready && <Banner tone="info">Ask AI is available once the transcript is ready.</Banner>}
      <ul className="space-y-4" aria-live="polite">
        {qa.data.map((e) => (
          <li key={e.id} className="space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-white">{e.question}</p>
            <p className="w-fit max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-3 leading-relaxed">{e.answer}</p>
          </li>
        ))}
        {busy && <li className="text-muted">Thinking…</li>}
      </ul>
      {error && <Banner tone="error">{error}</Banner>}
      {qa.data.length === 0 && ready && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-brand" onClick={() => void ask(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 2) void ask(q.trim());
        }}
      >
        <Textarea rows={2} aria-label="Ask a question about this meeting" placeholder="Ask about this meeting in English or Telugu…" value={q} onChange={(e) => setQ(e.target.value)} disabled={!ready || busy}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (q.trim().length >= 2) void ask(q.trim()); } }} />
        <Button type="submit" disabled={!ready || busy || q.trim().length < 2} aria-label="Ask"><Send size={18} aria-hidden /></Button>
      </form>
      <p className="text-sm text-muted">Answers come only from this meeting's transcript and minutes, with timestamps you can check.</p>
    </div>
  );
}
