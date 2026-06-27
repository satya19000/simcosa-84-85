import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { listEvents, listMyRsvps, listRsvpCounts, setRsvp as setRsvpFn, type EventRow } from "@/api/events";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Calendar, MapPin, Users, Clock, CheckCircle, HelpCircle, XCircle,
  CalendarPlus, ExternalLink, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isFuture, isPast } from "date-fns";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events & Reunions — SIMCOSA 84–85" }] }),
  component: Events,
});

type Status = "attending" | "maybe" | "not_attending";

// ── Countdown timer ──────────────────────────────────────────────────────────
function Countdown({ date }: { date: string }) {
  const [diff, setDiff] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const ms = new Date(date).getTime() - Date.now();
      if (ms <= 0) return;
      setDiff({
        days: Math.floor(ms / 86400000),
        hours: Math.floor((ms % 86400000) / 3600000),
        minutes: Math.floor((ms % 3600000) / 60000),
        seconds: Math.floor((ms % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [date]);

  return (
    <div className="grid grid-cols-4 gap-2 mt-3">
      {[["Days", diff.days], ["Hrs", diff.hours], ["Min", diff.minutes], ["Sec", diff.seconds]].map(([l, v]) => (
        <div key={l as string} className="bg-amber-50 border border-amber-200 rounded-xl py-2 text-center">
          <p className="font-display text-2xl font-bold text-amber-700">{String(v).padStart(2, "0")}</p>
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{l}</p>
        </div>
      ))}
    </div>
  );
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
function toGoogleCalendarUrl(e: EventRow): string {
  const start = new Date(e.event_date);
  const end = e.end_date ? new Date(e.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ...(e.description ? { details: e.description } : {}),
    ...(e.location ? { location: e.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs(e: EventRow) {
  const start = new Date(e.event_date);
  const end = e.end_date ? new Date(e.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const esc = (s: string) => s.replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SIMCOSA 84-85//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
    ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.title.replace(/\s+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Add to Calendar dropdown ─────────────────────────────────────────────────
function AddToCalendarButton({ event }: { event: EventRow }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        className="h-10 px-4 rounded-xl flex items-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 text-sm font-semibold"
        onClick={() => setOpen(o => !o)}
      >
        <CalendarPlus className="h-4 w-4" /> Add to Calendar <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute z-30 top-12 left-0 bg-white border border-amber-100 rounded-xl shadow-xl py-1 min-w-[200px]">
          <a
            href={toGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 font-medium"
            onClick={() => setOpen(false)}
          >
            <Calendar className="h-4 w-4 text-amber-500" /> Google Calendar
          </a>
          <button
            className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 font-medium"
            onClick={() => { downloadIcs(event); setOpen(false); }}
          >
            <CalendarPlus className="h-4 w-4 text-blue-500" /> Download .ics
            <span className="text-xs text-gray-400 ml-1">(Apple / Outlook)</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Classify events ───────────────────────────────────────────────────────────
function classifyEvent(e: EventRow): "upcoming" | "past" {
  if (e.event_type === "past") return "past";
  if (e.event_type === "upcoming") return "upcoming";
  return isFuture(new Date(e.event_date)) ? "upcoming" : "past";
}

// ── Main page ─────────────────────────────────────────────────────────────────
function Events() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  });

  const { data: rsvps } = useQuery({
    queryKey: ["my-rsvps", user?.id],
    enabled: !!user,
    queryFn: () => listMyRsvps(),
  });

  const { data: rawCounts } = useQuery({
    queryKey: ["rsvp-counts"],
    queryFn: () => listRsvpCounts(),
  });

  const counts: Record<string, { attending: number; maybe: number; not_attending: number }> = {};
  for (const r of rawCounts ?? []) {
    const c = (counts[r.event_id] ??= { attending: 0, maybe: 0, not_attending: 0 });
    if (r.status === "attending" || r.status === "maybe" || r.status === "not_attending") {
      c[r.status]++;
    }
  }

  const doRsvp = async (eventId: string, status: Status) => {
    if (!user) return;
    try {
      await setRsvpFn({ data: { eventId, status } });
      toast.success(status === "attending" ? "Great! You're attending 🎉" : "RSVP updated");
      qc.invalidateQueries({ queryKey: ["my-rsvps"] });
      qc.invalidateQueries({ queryKey: ["rsvp-counts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to RSVP");
    }
  };

  const getMyRsvp = (eid: string) => rsvps?.find((r) => r.event_id === eid)?.status as Status | undefined;

  const allEvents = events ?? [];
  const upcoming = allEvents.filter(e => classifyEvent(e) === "upcoming").sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
  );
  const past = allEvents.filter(e => classifyEvent(e) === "past").sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
  );

  const RSVP_OPTIONS = [
    { value: "attending" as Status, label: "Attending", icon: CheckCircle, active: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500" },
    { value: "maybe" as Status, label: "Maybe", icon: HelpCircle, active: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" },
    { value: "not_attending" as Status, label: "Not Going", icon: XCircle, active: "bg-gray-400 hover:bg-gray-500 text-white border-gray-400" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white flex items-center justify-center">
        <div className="text-gray-400">Loading events…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Batch Calendar</p>
          <h1>Events & Reunions</h1>
          <p className="text-gray-500 mt-2 text-lg">RSVP so we know who's joining — let's make every reunion count!</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-14">

        {/* ── Upcoming Events ── */}
        <section>
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Calendar className="h-6 w-6 text-amber-500" /> Upcoming Events
          </h2>

          {upcoming.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-amber-100 bg-white">
              <Calendar className="h-12 w-12 text-amber-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No upcoming events yet.</p>
              <p className="text-gray-400 text-sm mt-1">Check back soon for reunion announcements!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {upcoming.map((e, idx) => {
                const my = getMyRsvp(e.id);
                const c = counts[e.id] ?? { attending: 0, maybe: 0, not_attending: 0 };
                const isNext = idx === 0;
                const hasTime = new Date(e.event_date).getHours() !== 0 || new Date(e.event_date).getMinutes() !== 0;

                return (
                  <article key={e.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isNext ? "border-amber-400 shadow-amber-100" : "border-amber-100"}`}>
                    {isNext && (
                      <div className="bg-amber-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> Next Upcoming Event
                      </div>
                    )}
                    {e.cover_url && (
                      <div className="w-full h-52 overflow-hidden">
                        <img src={e.cover_url} alt={e.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-xl font-bold text-gray-900">{e.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                              {hasTime ? format(new Date(e.event_date), "PPP 'at' p") : format(new Date(e.event_date), "PPP")}
                              {e.end_date && ` – ${format(new Date(e.end_date), "PPP")}`}
                            </span>
                            {e.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-amber-500 shrink-0" />{e.location}
                              </span>
                            )}
                          </div>
                          {e.description && (
                            <p className="mt-3 text-gray-600 leading-relaxed text-sm">{e.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-sm bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 text-center min-w-[110px]">
                          <p className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
                            <Users className="h-4 w-4" /> {c.attending} Going
                          </p>
                          <p className="text-amber-600 font-semibold mt-1">{c.maybe} Maybe</p>
                          <p className="text-gray-400 mt-0.5">{c.not_attending} Not Going</p>
                        </div>
                      </div>

                      {isNext && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Countdown</p>
                          <Countdown date={e.event_date} />
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2 items-center">
                        {e.rsvp_enabled && RSVP_OPTIONS.map(({ value, label, icon: Icon, active }) => (
                          <Button
                            key={value}
                            onClick={() => doRsvp(e.id, value)}
                            className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${my === value ? active : "bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"}`}
                          >
                            <Icon className="h-4 w-4" /> {label} {my === value && "✓"}
                          </Button>
                        ))}
                        <AddToCalendarButton event={e} />
                        {e.external_link && (
                          <a href={e.external_link} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm">
                              <ExternalLink className="h-4 w-4" /> View Details
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Past Events ── */}
        <section>
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-gray-400" /> Past Events
          </h2>

          {past.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border border-gray-100 bg-white">
              <p className="text-gray-400">No past events added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {past.map((e) => {
                const c = counts[e.id] ?? { attending: 0, maybe: 0, not_attending: 0 };
                return (
                  <article key={e.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex flex-col sm:flex-row">
                      {e.cover_url && (
                        <div className="sm:w-36 h-32 sm:h-auto shrink-0 overflow-hidden">
                          <img src={e.cover_url} alt={e.title} className="w-full h-full object-cover grayscale" loading="lazy" />
                        </div>
                      )}
                      <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-gray-700">{e.title}</h3>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(e.event_date), "PPP")}
                            </span>
                            {e.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />{e.location}
                              </span>
                            )}
                          </div>
                          {e.description && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">{e.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0 text-sm text-gray-400 items-center">
                          <span>{c.attending} attended</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(e.event_date), { addSuffix: true })}</span>
                          {e.external_link && (
                            <a href={e.external_link} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" className="h-8 px-3 text-xs rounded-lg">
                                <ExternalLink className="h-3 w-3 mr-1" /> View
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
