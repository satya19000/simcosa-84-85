import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MessageCircle, MapPin, Briefcase, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({ meta: [{ title: "Members Directory — SIMCOSA 84–85" }] }),
  component: Directory,
});

function Directory() {
  const [search, setSearch] = useState("");

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

  const filtered = data?.filter(m =>
    !search || m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.location ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.profession ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const AVATAR_COLORS = [
    "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700",
    "bg-purple-100 text-purple-700", "bg-orange-100 text-orange-700",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Batch Family</p>
          <h1>Members Directory</h1>
          <p className="text-gray-500 mt-2 text-lg">Visible only to approved batchmates — find and connect with your classmates.</p>
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, city, profession…"
              className="pl-12 h-12 text-base rounded-xl border-amber-200 focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 animate-pulse h-48" />
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered?.map((m, i) => (
            <div key={m.id} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-4 mb-4">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.full_name} className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-200" />
                ) : (
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center font-display text-2xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                    {m.full_name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{m.full_name}</h3>
                  {m.profession && (
                    <p className="text-sm text-amber-600 font-semibold flex items-center gap-1 truncate">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />{m.profession}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 border-t border-amber-50 pt-4">
                {m.location && (
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-500 shrink-0" />{m.location}</p>
                )}
                {m.email && (
                  <a href={`mailto:${m.email}`} className="flex items-center gap-2 hover:text-amber-600 transition-colors">
                    <Mail className="h-4 w-4 text-amber-500 shrink-0" />{m.email}
                  </a>
                )}
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="flex items-center gap-2 hover:text-amber-600 transition-colors">
                    <Phone className="h-4 w-4 text-amber-500 shrink-0" />{m.phone}
                  </a>
                )}
                {m.whatsapp && (
                  <a
                    href={`https://wa.me/${m.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors font-semibold"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />WhatsApp
                  </a>
                )}
                {m.bio && <p className="text-gray-400 text-xs italic pt-1 line-clamp-2">{m.bio}</p>}
              </div>
            </div>
          ))}
        </div>

        {filtered?.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <Users className="h-16 w-16 text-amber-200 mx-auto mb-4" />
            <h3 className="text-gray-500 font-display">{search ? `No members found for "${search}"` : "No members yet"}</h3>
            <p className="text-gray-400 mt-2">Complete your profile to appear in the directory!</p>
          </div>
        )}
      </div>
    </div>
  );
}
