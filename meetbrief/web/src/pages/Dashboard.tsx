import { Link } from "react-router-dom";
import { Mic, Upload, CalendarDays, Clock } from "lucide-react";
import { formatDuration, TEMPLATES } from "@meetbrief/shared";
import { useUid } from "../lib/auth";
import { useAllTasks, useMeetings } from "../lib/data";
import { Banner, Card, EmptyState, ProgressBar, StatusBadge } from "../components/ui";

export function Dashboard() {
  const uid = useUid();
  const meetings = useMeetings(uid, 30);
  const tasks = useAllTasks(uid);
  const inProgress = meetings.data.filter((m) => ["queued", "processing", "uploading"].includes(m.status));
  const openTasks = tasks.data.filter((t) => t.status !== "done");

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl bg-brand p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Ready for your next meeting?</h1>
          <p className="mt-1 text-white/80">Record or upload, then review the minutes and action items.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/meetings/new" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-4 text-lg font-semibold hover:bg-accent/90">
            <Mic aria-hidden /> Start Meeting
          </Link>
          <Link to="/meetings/new?mode=upload" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-4 font-semibold hover:bg-white/20">
            <Upload aria-hidden /> Upload recording
          </Link>
        </div>
      </section>

      {meetings.error && <Banner tone="error">Could not load meetings: {meetings.error}</Banner>}

      {inProgress.length > 0 && (
        <section aria-labelledby="processing-h">
          <h2 id="processing-h" className="mb-3 text-lg font-bold">
            Processing
          </h2>
          <div className="grid gap-3">
            {inProgress.map((m) => (
              <Link key={m.id} to={`/meetings/${m.id}`}>
                <Card className="hover:border-brand">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-semibold">{m.title}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <ProgressBar value={m.progress?.percent ?? 0} label={`Processing ${m.title}`} />
                  <p className="mt-2 text-sm text-muted">{m.progress?.message ?? "Waiting"}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="recent-h">
          <h2 id="recent-h" className="mb-3 text-lg font-bold">
            Recent meetings
          </h2>
          {meetings.loading ? (
            <p className="text-muted">Loading…</p>
          ) : meetings.data.length === 0 ? (
            <EmptyState title="No meetings yet">Press “Start Meeting” to record your first one.</EmptyState>
          ) : (
            <ul className="grid gap-3">
              {meetings.data.map((m) => (
                <li key={m.id}>
                  <Link to={`/meetings/${m.id}`} className="block">
                    <Card className="hover:border-brand">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-semibold">{m.title}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={15} aria-hidden /> {m.date} · {m.startTime}
                            </span>
                            {m.durationMs ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock size={15} aria-hidden /> {formatDuration(m.durationMs)}
                              </span>
                            ) : null}
                            <span>{TEMPLATES[m.templateId]?.name}</span>
                          </p>
                        </div>
                        <StatusBadge status={m.status} />
                      </div>
                      {m.summarySnippet && <p className="mt-3 line-clamp-2 text-muted">{m.summarySnippet}</p>}
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="tasks-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="tasks-h" className="text-lg font-bold">
              Unfinished tasks
            </h2>
            <Link to="/tasks" className="text-sm font-medium text-brand">
              View all
            </Link>
          </div>
          {openTasks.length === 0 ? (
            <EmptyState title="Nothing pending" />
          ) : (
            <ul className="space-y-2">
              {openTasks.slice(0, 8).map((t) => (
                <li key={t.id}>
                  <Link to={`/meetings/${t.meetingId}?tab=actions`} className="block rounded-xl border border-line bg-white p-3 hover:border-brand">
                    <p className="font-medium">{t.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {[t.assignee, t.dueDate || t.dueText].filter(Boolean).join(" · ") || t.meetingTitle}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
