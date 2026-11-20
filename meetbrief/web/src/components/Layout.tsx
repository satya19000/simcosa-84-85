import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { CheckSquare, Home, LogOut, Mic, Search, Settings, CloudUpload } from "lucide-react";
import { useAuth } from "../lib/auth";
import { uploader, type UploadStats } from "../recording/uploader";
import { RecoveryBanner } from "./RecoveryBanner";

const nav = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/tasks", label: "Action items", icon: CheckSquare },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<UploadStats>();
  useEffect(() => uploader.subscribe(setStats), []);

  return (
    <div className="min-h-dvh pb-24 md:pb-0 md:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Skip to content
      </a>
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-white p-5 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2.5 text-xl font-bold text-brand">
          <img src="/icon.svg" alt="" className="h-9 w-9" /> MeetBrief AI
        </Link>
        <Link to="/meetings/new" className="mb-6 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:bg-accent/90">
          <Mic size={20} aria-hidden /> Start Meeting
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium ${isActive ? "bg-brand-soft text-brand" : "text-muted hover:bg-paper hover:text-ink"}`}
            >
              <Icon size={20} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 text-sm text-muted">
          {stats && stats.pending > 0 && (
            <p className="flex items-center gap-2" role="status">
              <CloudUpload size={16} aria-hidden /> Uploading {stats.pending} chunk(s){stats.online ? "" : " — offline"}
            </p>
          )}
          <p className="truncate" title={user?.email ?? ""}>
            {user?.email ?? user?.displayName}
          </p>
          <button onClick={signOut} className="flex items-center gap-2 font-medium hover:text-ink">
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand">
          <img src="/icon.svg" alt="" className="h-8 w-8" /> MeetBrief
        </Link>
        {stats && stats.pending > 0 && (
          <span className="text-sm text-muted" role="status">
            ↑ {stats.pending}
          </span>
        )}
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <RecoveryBanner />
        <Outlet />
      </main>

      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {[nav[0], nav[1]].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${isActive ? "text-brand" : "text-muted"}`}>
            <Icon size={22} aria-hidden /> {label}
          </NavLink>
        ))}
        <Link to="/meetings/new" className="flex flex-col items-center gap-0.5 py-1.5 text-xs font-semibold text-accent" aria-label="Start meeting">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow">
            <Mic size={22} aria-hidden />
          </span>
        </Link>
        {[nav[2], nav[3]].map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${isActive ? "text-brand" : "text-muted"}`}>
            <Icon size={22} aria-hidden /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
