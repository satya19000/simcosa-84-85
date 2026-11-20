import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { findUnfinished, recoverMeeting } from "../recording/uploader";
import { Banner, Button } from "./ui";

/**
 * Shown when IndexedDB still holds audio from a recording that did not finish cleanly
 * (tab closed, browser crash, power loss). Recovery uploads what was saved.
 */
export function RecoveryBanner() {
  const [meetings, setMeetings] = useState<string[]>([]);
  const [busy, setBusy] = useState<string>();
  const [done, setDone] = useState<string>();
  const location = useLocation();
  const onRecordPage = location.pathname.endsWith("/record");

  useEffect(() => {
    if (onRecordPage) return;
    findUnfinished()
      .then((segs) => setMeetings([...new Set(segs.map((s) => s.meetingId))]))
      .catch(() => {});
  }, [onRecordPage, done]);

  if (onRecordPage || !meetings.length) return null;
  return (
    <div className="mb-6 space-y-2">
      {meetings.map((id) => (
        <Banner key={id} tone="warn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              A recording was interrupted before it finished uploading. The audio saved on this device can be recovered.{" "}
              <Link className="underline" to={`/meetings/${id}`}>
                Open meeting
              </Link>
            </span>
            <Button
              size="sm"
              disabled={busy === id}
              onClick={async () => {
                setBusy(id);
                try {
                  await recoverMeeting(id);
                  setDone(id);
                } finally {
                  setBusy(undefined);
                }
              }}
            >
              {busy === id ? "Recovering…" : "Recover and upload"}
            </Button>
          </div>
        </Banner>
      ))}
    </div>
  );
}
