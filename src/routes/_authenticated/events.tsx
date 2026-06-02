import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events & Reunions" }] }),
  component: Events,
});

type Status = "attending" | "maybe" | "not_attending";

function Events() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: rsvps } = useQuery({
    queryKey: ["my-rsvps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["rsvp-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("event_id,status");
      if (error) throw error;
      const c: Record<string, Record<Status, number>> = {};
      for (const r of data) {
        c[r.event_id] ??= { attending: 0, maybe: 0, not_attending: 0 };
        c[r.event_id][r.status as Status]++;
      }
      return c;
    },
  });

  const setRsvp = async (eventId: string, status: Status) => {
    if (!user) return;
    const { error } = await supabase.from("event_rsvps").upsert(
      { event_id: eventId, user_id: user.id, status },
      { onConflict: "event_id,user_id" }
    );
    if (error) return toast.error(error.message);
    toast.success("RSVP updated");
    qc.invalidateQueries({ queryKey: ["my-rsvps"] });
    qc.invalidateQueries({ queryKey: ["rsvp-counts"] });
  };

  const getMy = (eid: string) => rsvps?.find((r) => r.event_id === eid)?.status as Status | undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1>Events & Reunions</h1>
      <p className="text-muted-foreground mt-2">RSVP so we know who's joining.</p>

      <div className="mt-8 space-y-5">
        {events?.length === 0 && <p className="text-muted-foreground">No events yet. Check back soon.</p>}
        {events?.map((e) => {
          const my = getMy(e.id);
          const c = counts?.[e.id] ?? { attending: 0, maybe: 0, not_attending: 0 };
          return (
            <div key={e.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3>{e.title}</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-muted-foreground">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" />{format(new Date(e.event_date), "PPP p")}</span>
                {e.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{e.location}</span>}
              </div>
              {e.description && <p className="mt-3">{e.description}</p>}
              <p className="mt-3 text-sm text-muted-foreground">
                Going: <strong>{c.attending}</strong> · Maybe: <strong>{c.maybe}</strong> · Not going: <strong>{c.not_attending}</strong>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["attending", "maybe", "not_attending"] as Status[]).map((s) => (
                  <Button
                    key={s}
                    variant={my === s ? "default" : "outline"}
                    onClick={() => setRsvp(e.id, s)}
                    className="h-11"
                  >
                    {s === "attending" ? "Attending" : s === "maybe" ? "Maybe" : "Not Attending"}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
