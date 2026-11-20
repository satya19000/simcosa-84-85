import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, doc, setDoc } from "firebase/firestore";
import { Mic, Upload } from "lucide-react";
import { TEMPLATES, type Meeting } from "@meetbrief/shared";
import { db } from "../lib/firebase";
import { useUid } from "../lib/auth";
import { clean, nowIso, useSettings } from "../lib/data";
import { MeetingForm, nowInZone } from "../components/MeetingForm";
import { Banner, Button } from "../components/ui";

export function NewMeeting() {
  const uid = useUid();
  const settings = useSettings(uid);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (settings.loading) return <p className="text-muted">Loading…</p>;
  const s = settings.data;
  const { date, time } = nowInZone(s.timezone);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Step 1 of 4 · Set up</p>
        <h1 className="text-2xl font-bold md:text-3xl">New meeting</h1>
        <p className="mt-1 text-muted">Only the title is required. Everything stays editable after recording.</p>
      </div>
      {error && <Banner tone="error">{error}</Banner>}
      <MeetingForm
        busy={busy}
        submitLabel="Save"
        initial={{
          title: "",
          date,
          startTime: time,
          timezone: s.timezone,
          participants: [],
          agenda: TEMPLATES[s.defaultTemplateId].defaultAgenda,
          department: s.department ?? "",
          reportLanguage: s.reportLanguage,
          spokenLanguage: s.spokenLanguage,
          templateId: s.defaultTemplateId,
          venue: "",
          platform: "",
          chairperson: "",
        }}
        onSubmit={async (value, action) => {
          setBusy(true);
          setError(undefined);
          try {
            const ref = doc(collection(db, "meetings"));
            const meeting: Meeting = {
              ...value,
              id: ref.id,
              ownerId: uid,
              memberIds: [uid],
              source: null,
              status: "draft",
              createdAt: nowIso(),
              updatedAt: nowIso(),
            };
            // Not awaited for navigation: the write is queued locally even when offline.
            const write = setDoc(ref, clean(meeting));
            await Promise.race([write, new Promise((r) => setTimeout(r, 1500))]);
            navigate(`/meetings/${ref.id}/${action === "upload" ? "upload" : "record"}`);
          } catch (e) {
            setError(`Could not create the meeting: ${(e as Error).message}`);
          } finally {
            setBusy(false);
          }
        }}
        extraActions={(submit) => (
          <>
            <Button type="button" variant="record" size="lg" disabled={busy} onClick={() => submit("record")} autoFocus={params.get("mode") !== "upload"}>
              <Mic aria-hidden /> Continue to recording
            </Button>
            <Button type="button" variant="secondary" size="lg" disabled={busy} onClick={() => submit("upload")}>
              <Upload aria-hidden /> Upload a file instead
            </Button>
          </>
        )}
      />
    </div>
  );
}
