import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAnnouncements } from "@/api/announcements";
import { format } from "date-fns";
import { Cake, Award, Heart, Megaphone, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — SIMCOSA 84–85" }] }),
  component: Announcements,
});

const icons = { birthday: Cake, achievement: Award, condolence: Heart, notice: Megaphone };
const kindColors = {
  birthday: "bg-rose-50 border-rose-200 text-rose-600",
  achievement: "bg-amber-50 border-amber-200 text-amber-600",
  condolence: "bg-gray-50 border-gray-200 text-gray-500",
  notice: "bg-sky-50 border-sky-200 text-sky-600",
};

function Announcements() {
  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => listAnnouncements(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Batch Updates</p>
          <h1>Announcements</h1>
          <p className="text-gray-500 mt-2 text-lg">Birthdays, achievements, condolences, and important notices from our batch.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        {data?.length === 0 && (
          <div className="text-center py-20">
            <Bell className="h-16 w-16 text-amber-200 mx-auto mb-4" />
            <h3 className="text-gray-500 font-display">No announcements yet</h3>
            <p className="text-gray-400 mt-2">Check back soon for batch updates.</p>
          </div>
        )}

        <div className="space-y-4">
          {data?.map((a) => {
            const Icon = icons[a.kind as keyof typeof icons] ?? Megaphone;
            const colorClass = kindColors[a.kind as keyof typeof kindColors] ?? "bg-amber-50 border-amber-200 text-amber-600";
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow">
                <div className={`flex-shrink-0 p-3 rounded-xl border ${colorClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-gray-900 text-lg">{a.title}</h3>
                    <p className="text-xs text-gray-400 shrink-0">{format(new Date(a.created_at), "PPP")}</p>
                  </div>
                  {a.body && <p className="mt-2 text-gray-600 leading-relaxed">{a.body}</p>}
                  <span className={`inline-block mt-2 text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${colorClass}`}>
                    {a.kind}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
