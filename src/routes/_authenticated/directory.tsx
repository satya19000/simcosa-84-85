import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MessageCircle, MapPin, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({ meta: [{ title: "Members Directory" }] }),
  component: Directory,
});

function Directory() {
  const { data, isLoading } = useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("approved", true)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1>Members Directory</h1>
      <p className="text-muted-foreground mt-2">Visible only to approved batchmates.</p>

      {isLoading && <p className="mt-8 text-muted-foreground">Loading members…</p>}

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data?.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center font-display text-2xl text-primary shrink-0">
                {m.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg truncate">{m.full_name}</h3>
                {m.profession && <p className="text-sm text-muted-foreground truncate"><Briefcase className="inline h-4 w-4 mr-1" />{m.profession}</p>}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-base">
              {m.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{m.location}</p>}
              {m.email && <a href={`mailto:${m.email}`} className="flex items-center gap-2 hover:underline"><Mail className="h-4 w-4 text-gold" />{m.email}</a>}
              {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-2 hover:underline"><Phone className="h-4 w-4 text-gold" />{m.phone}</a>}
              {m.whatsapp && <a href={`https://wa.me/${m.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline"><MessageCircle className="h-4 w-4 text-gold" />WhatsApp</a>}
            </div>
          </div>
        ))}
      </div>

      {data && data.length === 0 && (
        <p className="mt-8 text-muted-foreground">No members yet. Complete your profile to be the first!</p>
      )}
    </div>
  );
}
