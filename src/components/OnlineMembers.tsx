import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { pingPresence, getOnlineMembers } from "@/api/presence";

const PING_INTERVAL_MS = 45_000;
const REFRESH_INTERVAL_MS = 45_000;

function useCanTrackPresence() {
  const { user, isAdmin, isApproved } = useAuth();
  return !!user && (isAdmin || isApproved);
}

/** Invisible component: pings presence on mount, on an interval, and when the tab becomes visible again. */
export function PresencePinger() {
  const canTrack = useCanTrackPresence();

  useEffect(() => {
    if (!canTrack) return;
    const ping = () => {
      pingPresence({ data: { currentPage: window.location.pathname } }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, PING_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canTrack]);

  return null;
}

export function useOnlineMembers() {
  const canTrack = useCanTrackPresence();
  return useQuery({
    queryKey: ["presence-online"],
    queryFn: () => getOnlineMembers(),
    enabled: canTrack,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

/** Small "🟢 Online now: X" badge, suitable for the header. */
export function OnlineCountBadge() {
  const canTrack = useCanTrackPresence();
  const { data } = useOnlineMembers();
  if (!canTrack) return null;
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      Online now: {data?.count ?? 0}
    </span>
  );
}

/** Full "Online Members" widget with names, for the Home/Dashboard page. */
export function OnlineMembersWidget() {
  const canTrack = useCanTrackPresence();
  const { data, isLoading } = useOnlineMembers();
  const qc = useQueryClient();

  useEffect(() => {
    if (!canTrack) return;
    const id = setInterval(() => qc.invalidateQueries({ queryKey: ["presence-online"] }), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [canTrack, qc]);

  if (!canTrack) return null;

  const members = data?.members ?? [];
  const visible = members.slice(0, 10);
  const more = members.length - visible.length;

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-amber-500" />
        <h3 className="font-display font-bold text-gray-800">Online Members</h3>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-sm font-semibold text-emerald-700">
          Online now: {isLoading ? "…" : data?.count ?? 0}
        </p>
      </div>
      {!isLoading && members.length === 0 && (
        <p className="text-sm text-gray-400">No batchmates online right now.</p>
      )}
      {members.length > 0 && (
        <ul className="space-y-2">
          {visible.map((m) => (
            <li key={m.user_id} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              {m.photo_url ? (
                <img src={m.photo_url} alt={m.full_name} className="h-6 w-6 rounded-full object-cover shrink-0" />
              ) : (
                <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {m.full_name.charAt(0)}
                </span>
              )}
              <span className="text-gray-700 font-medium truncate">{m.full_name}</span>
            </li>
          ))}
          {more > 0 && <li className="text-xs text-gray-400 pl-8">+{more} more</li>}
        </ul>
      )}
    </div>
  );
}
