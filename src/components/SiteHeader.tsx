import { Link, useRouter } from "@tanstack/react-router";
import { Menu, X, Users, Camera, Calendar, MessageCircle, BookOpen, Heart, HelpCircle, Trophy, LogIn, LogOut, PenLine } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { OnlineCountBadge } from "@/components/OnlineMembers";

const publicLinks = [
  { to: "/about", label: "About" },
];

const memberLinks = [
  { to: "/home", label: "Home", icon: Users },
  { to: "/directory", label: "Members", icon: Users },
  { to: "/gallery", label: "Gallery", icon: Camera },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/memories", label: "Memories", icon: BookOpen },
  { to: "/blogs", label: "Blogs", icon: PenLine },
  { to: "/announcements", label: "News", icon: MessageCircle },
  { to: "/donations", label: "Donate", icon: Heart },
  { to: "/support", label: "Support", icon: HelpCircle },
];

export function SiteHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isApproved = profile?.approval_status === "approved";

  const links = !user
    ? publicLinks
    : isAdmin || isApproved
      ? [
          ...memberLinks.map(l => ({ to: l.to, label: l.label })),
          ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
        ]
      : [{ to: "/pending-approval", label: "Pending Approval" }];

  const onSignOut = async () => {
    await signOut();
    setOpen(false);
    router.navigate({ to: "/auth" });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-amber-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to={user ? "/home" : "/"} className="flex items-center gap-3 min-w-0 shrink-0">
            <img
              src="/assets/college-logo.png"
              alt="SIMCOSA"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-400 ring-offset-1"
            />
            <div className="hidden sm:block">
              <p className="font-display text-lg font-bold leading-none text-gray-900">SIMCOSA 84–85</p>
              <p className="text-xs text-amber-600 font-semibold leading-none mt-0.5">Govt. Siddhartha Medical College</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                activeProps={{ className: "px-3 py-2 rounded-lg text-sm font-semibold text-amber-700 bg-amber-50" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Auth button */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <OnlineCountBadge />
            {user ? (
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <Link to="/auth">
                <Button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 rounded-xl h-10 shadow-sm">
                  <LogIn className="h-4 w-4" /> Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-amber-50 text-gray-600"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden pb-4 pt-2 flex flex-col gap-1 border-t border-amber-100 mt-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                activeProps={{ className: "px-4 py-3 rounded-lg text-base font-semibold text-amber-700 bg-amber-50" }}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <button onClick={onSignOut} className="mt-2 flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50">
                <LogOut className="h-5 w-5" /> Sign out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)}>
                <Button className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 text-base rounded-xl">
                  <LogIn className="h-5 w-5 mr-2" /> Login / Signup
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { user, profile, isAdmin } = useAuth();
  const isApproved = profile?.approval_status === "approved";
  const showMemberLinks = user && (isAdmin || isApproved);

  return (
    <footer className="bg-gray-900 text-gray-300 mt-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/assets/college-logo.png" alt="SIMCOSA" className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-400" />
              <div>
                <p className="font-display text-lg font-bold text-white leading-none">SIMCOSA 84–85</p>
                <p className="text-xs text-amber-400 mt-0.5">Govt. Siddhartha Medical College</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 italic">
              "Once Siddhartha, Always Siddhartha."
            </p>
            <p className="text-sm text-gray-400 mt-3">Reconnect. Remember. Support.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-base">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/about", label: "About Our Batch" },
                ...(!user ? [{ to: "/auth", label: "Login / Signup" }] : []),
                ...(showMemberLinks
                  ? [
                      { to: "/directory", label: "Members Directory" },
                      { to: "/gallery", label: "Photo Gallery" },
                      { to: "/events", label: "Events & Reunions" },
                      { to: "/memories", label: "Memories Wall" },
                      { to: "/blogs", label: "Blogs" },
                    ]
                  : []),
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 hover:text-amber-400 transition-colors">→ {l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h4 className="text-white font-bold mb-4 text-base">Stay Connected</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>✉ simcosa84@gmail.com</li>
              <li>💬 SIMCOSA 84–85 WhatsApp</li>
              <li>👍 Follow us on Facebook</li>
              <li>📢 Subscribe to Updates</li>
            </ul>
            <div className="mt-4">
              <a
                href="https://chat.whatsapp.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors"
              >
                Join Our Community
              </a>
            </div>
          </div>

          {/* For Admins */}
          {!user && (
            <div>
              <h4 className="text-white font-bold mb-4 text-base">Members & Admins</h4>
              <p className="text-sm text-gray-400 mb-4">Sign in to access the private portal and admin tools.</p>
              <Link to="/auth">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-sm">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">© 2024 SIMCOSA 1984–85 Batch · Govt. Siddhartha Medical College, Vijayawada</p>
          <p className="text-sm text-amber-400 font-semibold">❤ Reconnect. Remember. Support.</p>
        </div>
      </div>
    </footer>
  );
}
