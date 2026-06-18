import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { listEvents, listMyRsvps, listRsvpCounts, setRsvp as setRsvpFn } from "@/api/events";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isFuture } from "date-fns";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events & Reunions — SIMCOSA 84–85" }] }),
  component: Events,
});

type Status = "attending" | "maybe" | "not_attending";

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
      {[["days", diff.days], ["hrs", diff.hours], ["min", diff.minutes], ["sec", diff.seconds]].map(([l, v]) => (
        <div key={l as string} className="bg-amber-50 border border-amber-200 rounded-xl py-2 text-center">
          <p className="font-display text-2xl font-bold text-amber-700">{String(v).padStart(2, "0")}</p>
          <p className="text-xs text-gray-500 uppercase font-semibold">{l}</p>
        </div>
      ))}
    </div>
  );
}

function Events() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: events } = useQuery({
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

  const setRsvp = async (eventId: string, status: Status) => {
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

  const getMy = (eid: string) => rsvps?.find((r) => r.event_id === eid)?.status as Status | undefined;

  const upcoming = events?.filter(e => isFuture(new Date(e.event_date))) ?? [];
  const past = events?.filter(e => !isFuture(new Date(e.event_date))) ?? [];

  const RSVP_OPTIONS = [
    { value: "attending" as Status, label: "Attending", icon: CheckCircle, cls: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500" },
    { value: "maybe" as Status, label: "Maybe", icon: HelpCircle, cls: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" },
    { value: "not_attending" as Status, label: "Not Going", icon: XCircle, cls: "bg-gray-400 hover:bg-gray-500 text-white border-gray-400" },
  ];

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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Calendar className="h-6 w-6 text-amber-500" /> Upcoming Events
            </h2>
            <div className="space-y-5">
              {upcoming.map((e) => {
                const my = getMy(e.id);
                const c = counts?.[e.id] ?? { attending: 0, maybe: 0, not_attending: 0 };
                const isNext = upcoming[0]?.id === e.id;
                return (
                  <div key={e.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isNext ? 'border-amber-400 shadow-amber-100' : 'border-amber-100'}`}>
                    {isNext && (
                      <div className="bg-amber-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> Next Upcoming Event
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-display text-xl font-bold text-gray-900">{e.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-4 text-gray-500 text-sm">
                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-500" />{format(new Date(e.event_date), "PPP 'at' p")}</span>
                            {e.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-500" />{e.location}</span>}
                          </div>
                          {e.description && <p className="mt-3 text-gray-600 leading-relaxed">{e.description}</p>}
                        </div>
                        <div className="shrink-0 text-sm text-gray-500 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 text-center min-w-[120px]">
                          <p className="flex items-center justify-center gap-1 text-emerald-600 font-bold"><Users className="h-4 w-4" /> {c.attending} Going</p>
                          <p className="text-amber-600 font-semibold mt-1">{c.maybe} Maybe</p>
                          <p className="text-gray-400 mt-0.5">{c.not_attending} Not Going</p>
                        </div>
                      </div>

                      {isNext && isFuture(new Date(e.event_date)) && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Countdown</p>
                          <Countdown date={e.event_date} />
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {RSVP_OPTIONS.map(({ value, label, icon: Icon, cls }) => (
                          <Button
                            key={value}
                            onClick={() => setRsvp(e.id, value)}
                            className={`h-11 px-5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${my === value ? cls : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700'}`}
                          >
                            <Icon className="h-4 w-4" /> {label} {my === value && "✓"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-6">Past Events</h2>
            <div className="space-y-4">
              {past.reverse().map((e) => {
                const c = counts?.[e.id] ?? { attending: 0, maybe: 0, not_attending: 0 };
                return (
                  <div key={e.id} className="bg-white rounded-2xl border border-amber-100 p-5 opacity-75">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-gray-700">{e.title}</h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(e.event_date), "PPP")}</span>
                          {e.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{e.location}</span>}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {c.attending} attended · {formatDistanceToNow(new Date(e.event_date), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {events?.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 text-amber-200 mx-auto mb-4" />
            <h3 className="text-gray-500 font-display">No events yet</h3>
            <p className="text-gray-400 mt-2">Check back soon for upcoming reunion announcements!</p>
          </div>
        )}
      </div>
    </div>
  );
}
