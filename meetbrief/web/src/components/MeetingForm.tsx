import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TEMPLATE_LIST, TEMPLATES, meetingSetupSchema, type MeetingSetupInput, type Participant, type TemplateId } from "@meetbrief/shared";
import { Button, Field, Input, Select, Textarea } from "./ui";

export function nowInZone(tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles", "UTC"];

export function MeetingForm({
  initial,
  submitLabel,
  extraActions,
  onSubmit,
  busy,
}: {
  initial: MeetingSetupInput;
  submitLabel: string;
  extraActions?: (submit: (action: string) => void) => React.ReactNode;
  onSubmit: (value: MeetingSetupInput, action: string) => void | Promise<void>;
  busy?: boolean;
}) {
  const [v, setV] = useState<MeetingSetupInput>(initial);
  const [agendaText, setAgendaText] = useState(initial.agenda.join("\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof MeetingSetupInput>(k: K, value: MeetingSetupInput[K]) => setV((s) => ({ ...s, [k]: value }));

  const changeTemplate = (id: TemplateId) => {
    const t = TEMPLATES[id];
    setV((s) => ({ ...s, templateId: id }));
    // Pre-fill the agenda only when the user hasn't typed one.
    if (!agendaText.trim() && t.defaultAgenda.length) setAgendaText(t.defaultAgenda.join("\n"));
  };

  const submit = (action: string) => {
    const candidate = {
      ...v,
      agenda: agendaText.split("\n").map((s) => s.trim()).filter(Boolean),
      participants: v.participants.filter((p) => p.name.trim()),
    };
    const parsed = meetingSetupSchema.safeParse(candidate);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const issue of parsed.error.issues) e[String(issue.path[0])] ??= issue.message;
      setErrors(e);
      return;
    }
    setErrors({});
    void onSubmit(parsed.data, action);
  };

  const updateParticipant = (i: number, patch: Partial<Participant>) =>
    set("participants", v.participants.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        submit("save");
      }}
      noValidate
    >
      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-bold">Meeting type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATE_LIST.map((t) => (
            <label key={t.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${v.templateId === t.id ? "border-brand bg-brand-soft" : "border-line bg-white"}`}>
              <input type="radio" name="template" className="mt-1 h-5 w-5 accent-[var(--color-brand)]" checked={v.templateId === t.id} onChange={() => changeTemplate(t.id)} />
              <span>
                <span className="block font-semibold">{t.name}</span>
                <span className="telugu block text-sm text-muted" lang="te">
                  {t.nameTe}
                </span>
                <span className="mt-1 block text-sm text-muted">{t.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 text-lg font-bold">Details</legend>
        <div className="md:col-span-2">
          <Field label="Meeting title" error={errors.title}>
            {(id) => <Input id={id} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Monthly district health review" required />}
          </Field>
        </div>
        <Field label="Date" error={errors.date}>
          {(id) => <Input id={id} type="date" value={v.date} onChange={(e) => set("date", e.target.value)} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start time" error={errors.startTime}>
            {(id) => <Input id={id} type="time" value={v.startTime} onChange={(e) => set("startTime", e.target.value)} />}
          </Field>
          <Field label="Timezone">
            {(id) => (
              <Select id={id} value={v.timezone} onChange={(e) => set("timezone", e.target.value)}>
                {[...new Set([v.timezone, ...TIMEZONES])].map((tz) => (
                  <option key={tz}>{tz}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Venue">{(id) => <Input id={id} value={v.venue ?? ""} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Collectorate Conference Hall" />}</Field>
        <Field label="Online platform (if any)">{(id) => <Input id={id} value={v.platform ?? ""} onChange={(e) => set("platform", e.target.value)} placeholder="e.g. Google Meet, Zoom, Webex" />}</Field>
        <Field label="Chairperson">{(id) => <Input id={id} value={v.chairperson ?? ""} onChange={(e) => set("chairperson", e.target.value)} placeholder="Name and designation" />}</Field>
        <Field label="Department / organisation">{(id) => <Input id={id} value={v.department ?? ""} onChange={(e) => set("department", e.target.value)} />}</Field>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-lg font-bold">Participants</legend>
        <p className="text-sm text-muted">Names and designations help the transcript and minutes get them right.</p>
        {v.participants.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input aria-label={`Participant ${i + 1} name`} placeholder="Name" value={p.name} onChange={(e) => updateParticipant(i, { name: e.target.value })} />
            <Input aria-label={`Participant ${i + 1} designation`} placeholder="Designation" value={p.designation ?? ""} onChange={(e) => updateParticipant(i, { designation: e.target.value })} />
            <Button type="button" variant="ghost" aria-label={`Remove participant ${i + 1}`} onClick={() => set("participants", v.participants.filter((_, j) => j !== i))}>
              <Trash2 size={18} aria-hidden />
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => set("participants", [...v.participants, { name: "" }])}>
          <Plus size={18} aria-hidden /> Add participant
        </Button>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-bold">Agenda and language</legend>
        <Field label="Agenda" hint="One item per line.">
          {(id) => <Textarea id={id} rows={5} value={agendaText} onChange={(e) => setAgendaText(e.target.value)} />}
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Language spoken in the meeting" hint="Mixed handles Telugu–English code-switching.">
            {(id) => (
              <Select id={id} value={v.spokenLanguage} onChange={(e) => set("spokenLanguage", e.target.value as MeetingSetupInput["spokenLanguage"])}>
                <option value="mixed">Telugu and English (mixed)</option>
                <option value="te">Telugu</option>
                <option value="en">English</option>
              </Select>
            )}
          </Field>
          <Field label="Report language">
            {(id) => (
              <Select id={id} value={v.reportLanguage} onChange={(e) => set("reportLanguage", e.target.value as MeetingSetupInput["reportLanguage"])}>
                <option value="en">English</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="bilingual">English with Telugu summary</option>
              </Select>
            )}
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        {extraActions ? (
          extraActions(submit)
        ) : (
          <Button type="submit" size="lg" disabled={busy}>
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
