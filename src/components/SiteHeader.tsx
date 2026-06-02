import { Link, useRouter } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
];

const memberLinks = [
  { to: "/directory", label: "Directory" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/announcements", label: "Announcements" },
  { to: "/memories", label: "Memories" },
  { to: "/donations", label: "Donations" },
  { to: "/support", label: "Support" },
];

export function SiteHeader() {
  const { user, isApproved, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    ...publicLinks,
    ...(isApproved ? memberLinks : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const onSignOut = async () => {
    await signOut();
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-display text-lg font-bold text-gold-foreground">
              S
            </span>
            <span className="font-display text-lg sm:text-xl font-semibold truncate">
              SIMCOSA 84–85 Batch
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 rounded-md text-base font-medium text-primary-foreground/85 hover:bg-white/10 hover:text-primary-foreground transition-colors"
                activeProps={{ className: "px-3 py-2 rounded-md text-base font-semibold text-gold bg-white/10" }}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button variant="secondary" className="ml-2" onClick={onSignOut}>Sign out</Button>
            ) : (
              <Link to="/auth"><Button variant="secondary" className="ml-2">Login</Button></Link>
            )}
          </nav>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden pb-3 pt-1 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-md text-base hover:bg-white/10"
                activeProps={{ className: "px-3 py-3 rounded-md text-base font-semibold text-gold bg-white/10" }}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button variant="secondary" onClick={onSignOut}>Sign out</Button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)}><Button variant="secondary" className="w-full">Login / Signup</Button></Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-primary text-primary-foreground/85">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center">
        <p className="font-display text-lg text-gold">SIMCOSA 1984–85 Batch</p>
        <p className="text-sm mt-1">Reconnecting classmates. Sharing memories. Standing together.</p>
      </div>
    </footer>
  );
}
