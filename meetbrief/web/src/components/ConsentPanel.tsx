import { useState } from "react";
import { CONSENT_SCRIPTS, type ConsentContext, type ConsentRecord } from "@meetbrief/shared";
import { Field, Select, Textarea } from "./ui";

const METHODS: Record<ConsentContext, string[]> = {
  in_person: ["Announced aloud at the start", "Written notice on the agenda", "Individual verbal consent"],
  online: ["Announced aloud and in the meeting chat", "Platform recording notice shown", "Invitation stated the meeting is recorded"],
  phone: ["Announced aloud to everyone on the call"],
  personal_note: ["Only my own voice is recorded"],
};

/**
 * Participant notification & consent. Recording cannot start until the user confirms that
 * participants were informed (or that it is a personal note). The record is stored with the meeting.
 */
export function ConsentPanel({ uid, onChange }: { uid: string; onChange: (c: ConsentRecord | null) => void }) {
  const [context, setContext] = useState<ConsentContext>("in_person");
  const [method, setMethod] = useState(METHODS.in_person[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [objections, setObjections] = useState(false);
  const [notes, setNotes] = useState("");
  const [lang, setLang] = useState<"en" | "te">("en");

  const emit = (patch: Partial<{ context: ConsentContext; method: string; confirmed: boolean; objections: boolean; notes: string }>) => {
    const next = { context, method, confirmed, objections, notes, ...patch };
    onChange(
      next.confirmed
        ? { context: next.context, method: next.method, announcedAt: new Date().toISOString(), confirmedByUid: uid, notes: next.notes || undefined, objectionsRaised: next.objections }
        : null,
    );
  };

  return (
    <section aria-labelledby="consent-h" className="space-y-4">
      <h2 id="consent-h" className="text-lg font-bold">
        Tell participants before you record
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Meeting setting">
          {(id) => (
            <Select
              id={id}
              value={context}
              onChange={(e) => {
                const c = e.target.value as ConsentContext;
                setContext(c);
                setMethod(METHODS[c][0]);
                emit({ context: c, method: METHODS[c][0] });
              }}
            >
              <option value="in_person">In-person meeting</option>
              <option value="online">Online / hybrid meeting</option>
              <option value="phone">Phone call</option>
              <option value="personal_note">Personal voice note</option>
            </Select>
          )}
        </Field>
        <Field label="How were participants informed?">
          {(id) => (
            <Select
              id={id}
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                emit({ method: e.target.value });
              }}
            >
              {METHODS[context].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      {context !== "personal_note" && (
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">Suggested announcement</p>
            <div role="group" aria-label="Announcement language" className="flex gap-1 text-sm">
              {(["en", "te"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`rounded-lg px-2.5 py-1 font-medium ${lang === l ? "bg-brand text-white" : "bg-white"}`}>
                  {l === "en" ? "English" : "తెలుగు"}
                </button>
              ))}
            </div>
          </div>
          <p className={lang === "te" ? "telugu" : ""} lang={lang}>
            “{CONSENT_SCRIPTS[lang]}”
          </p>
        </div>
      )}

      <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 accent-[var(--color-brand)]"
          checked={confirmed}
          onChange={(e) => {
            setConfirmed(e.target.checked);
            emit({ confirmed: e.target.checked });
          }}
        />
        <span>
          {context === "personal_note"
            ? "This is a personal note; only my voice will be recorded."
            : "I have informed everyone present that this meeting is being recorded, and I am permitted to record it under my organisation's rules."}
        </span>
      </label>
      {context !== "personal_note" && (
        <>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 accent-[var(--color-brand)]"
              checked={objections}
              onChange={(e) => {
                setObjections(e.target.checked);
                emit({ objections: e.target.checked });
              }}
            />
            <span>Someone raised an objection or asked for part of the meeting not to be recorded</span>
          </label>
          {objections && (
            <Field label="Notes" hint="Record what was agreed, e.g. pause recording during item 4.">
              {(id) => (
                <Textarea
                  id={id}
                  rows={2}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    emit({ notes: e.target.value });
                  }}
                />
              )}
            </Field>
          )}
        </>
      )}
    </section>
  );
}
