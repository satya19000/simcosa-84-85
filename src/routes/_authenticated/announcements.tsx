import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Cake, Award, Heart, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements" }] }),
  component: Announcements,
});

const icons = { birthday: Cake, achievement: Award, condolence: Heart, notice: Megaphone };

function Announcements() {
  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1>Announcements</h1>
      <p className="text-muted-foreground mt-2">Birthdays, achievements, condolences and notices.</p>
      <div className="mt-8 space-y-4">
        {data?.length === 0 && <p className="text-muted-foreground">No announcements yet.</p>}
        {data?.map((a) => {
          const Icon = icons[a.kind as keyof typeof icons] ?? Megaphone;
          return (
            <div key={a.id} className="rounded-xl border border-border bg-card p-5 flex gap-4">
              <Icon className="h-7 w-7 text-gold shrink-0" />
              <div className="min-w-0">
                <h3>{a.title}</h3>
                {a.body && <p className="mt-1 text-muted-foreground">{a.body}</p>}
                <p className="mt-2 text-sm text-muted-foreground">{format(new Date(a.created_at), "PPP")}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
