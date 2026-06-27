import { useQuery, useQueryClient, QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useRouter, Link, createRootRouteWithContext, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, GoogleAuthProvider, onIdTokenChanged, signOut, signInWithPopup, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { getApps, getApp, initializeApp } from "firebase/app";
import { Users, Camera, Calendar, BookOpen, PenLine, MessageCircle, Heart, HelpCircle, LogOut, LogIn, X, Menu } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "./server-B57haCpF.js";
import { r as requireApproved } from "./middleware-q9eKmX0S.js";
import { Toaster as Toaster$1 } from "sonner";
const appCss = "/assets/styles-BeiK0GD2.css";
const firebaseConfig = {
  apiKey: "preview-placeholder-key",
  authDomain: "simcosa-preview.firebaseapp.com",
  projectId: "simcosa-preview",
  storageBucket: "simcosa-preview.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};
let app = null;
function getFirebaseApp() {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}
function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
const googleProvider = new GoogleAuthProvider();
const Ctx = createContext(void 0);
function welcomeNameFor(fbUser) {
  if (fbUser.displayName?.trim()) return fbUser.displayName.trim();
  if (fbUser.email) return fbUser.email.split("@")[0];
  return "Batchmate";
}
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const clearState = () => {
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsOwner(false);
  };
  const load = async () => {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setProfile(data.profile ?? null);
        setIsAdmin(!!data.isAdmin);
        setIsOwner(!!data.isOwner);
      } else {
        clearState();
      }
      return data;
    } catch {
      clearState();
      return null;
    }
  };
  const exchangeSession = async (fbUser) => {
    const idToken = await fbUser.getIdToken();
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[auth] session exchange failed:", res.status, detail);
      throw new Error(`Session exchange failed (${res.status})`);
    }
  };
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onIdTokenChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const idToken = await fbUser.getIdToken();
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idToken })
          });
          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            console.error("[auth] session exchange failed:", res.status, detail);
            throw new Error(`Session exchange failed (${res.status})`);
          }
          await load();
        } else {
          await fetch("/api/logout", { method: "POST", credentials: "include" });
          clearState();
        }
      } catch {
        clearState();
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);
  const refresh = async () => {
    return load();
  };
  const signInEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    await exchangeSession(cred.user);
    const data = await load();
    return { name: welcomeNameFor(cred.user), profile: data?.profile ?? null };
  };
  const signUpEmail = async (email, password, fullName, extra, photoFile) => {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    const trimmedName = fullName?.trim();
    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName });
    }
    await exchangeSession(cred.user);
    if (extra) {
      try {
        const { updateMyProfile } = await import("./profile-15XovYsz.js");
        await updateMyProfile({
          data: { full_name: trimmedName || welcomeNameFor(cred.user), ...extra }
        });
      } catch (err) {
        console.error("[auth] failed to save signup details:", err);
      }
    }
    if (photoFile) {
      try {
        const { uploadProfilePhoto } = await import("./profile-15XovYsz.js");
        const fd = new FormData();
        fd.set("file", photoFile);
        await uploadProfilePhoto({ data: fd });
      } catch (err) {
        console.error("[auth] failed to upload profile photo:", err);
      }
    }
    const data = await load();
    return { name: trimmedName || welcomeNameFor(cred.user), profile: data?.profile ?? null };
  };
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  };
  const signInGoogle = async () => {
    const cred = await signInWithPopup(getFirebaseAuth(), googleProvider);
    await exchangeSession(cred.user);
    const data = await load();
    return { name: welcomeNameFor(cred.user), profile: data?.profile ?? null };
  };
  const signOut$1 = async () => {
    await signOut(getFirebaseAuth());
  };
  return /* @__PURE__ */ jsx(
    Ctx.Provider,
    {
      value: {
        user,
        profile,
        isAdmin,
        isOwner,
        isApproved: profile?.approval_status === "approved",
        loading,
        refresh,
        signInEmail,
        signUpEmail,
        resetPassword,
        signInGoogle,
        signOut: signOut$1
      },
      children
    }
  );
}
function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const pingPresence = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("4a0ead3cec6486285774583b44af2b5d60120c63a2438195e889a1096fb0629d"));
const getOnlineMembers = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("0d72731796e601cec9d0b35bf727e684c82f24b16263545df54b5d58b2055470"));
const PING_INTERVAL_MS = 45e3;
const REFRESH_INTERVAL_MS = 45e3;
function useCanTrackPresence() {
  const { user, isAdmin, isApproved } = useAuth();
  return !!user && (isAdmin || isApproved);
}
function PresencePinger() {
  const canTrack = useCanTrackPresence();
  useEffect(() => {
    if (!canTrack) return;
    const ping = () => {
      pingPresence({ data: { currentPage: window.location.pathname } }).catch(() => {
      });
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
function useOnlineMembers() {
  const canTrack = useCanTrackPresence();
  return useQuery({
    queryKey: ["presence-online"],
    queryFn: () => getOnlineMembers(),
    enabled: canTrack,
    refetchInterval: REFRESH_INTERVAL_MS
  });
}
function OnlineCountBadge() {
  const canTrack = useCanTrackPresence();
  const { data } = useOnlineMembers();
  if (!canTrack) return null;
  return /* @__PURE__ */ jsxs("span", { className: "hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold", children: [
    /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-500 animate-pulse" }),
    "Online now: ",
    data?.count ?? 0
  ] });
}
function OnlineMembersWidget() {
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
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx(Users, { className: "h-5 w-5 text-amber-500" }),
      /* @__PURE__ */ jsx("h3", { className: "font-display font-bold text-gray-800", children: "Online Members" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-emerald-700", children: [
        "Online now: ",
        isLoading ? "…" : data?.count ?? 0
      ] })
    ] }),
    !isLoading && members.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: "No batchmates online right now." }),
    members.length > 0 && /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
      visible.map((m) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-500 shrink-0" }),
        m.photo_url ? /* @__PURE__ */ jsx("img", { src: m.photo_url, alt: m.full_name, className: "h-6 w-6 rounded-full object-cover shrink-0" }) : /* @__PURE__ */ jsx("span", { className: "h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0", children: m.full_name.charAt(0) }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-700 font-medium truncate", children: m.full_name })
      ] }, m.user_id)),
      more > 0 && /* @__PURE__ */ jsxs("li", { className: "text-xs text-gray-400 pl-8", children: [
        "+",
        more,
        " more"
      ] })
    ] })
  ] });
}
const publicLinks = [
  { to: "/about", label: "About" }
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
  { to: "/support", label: "Support", icon: HelpCircle }
];
function SiteHeader() {
  const { user, profile, isAdmin, signOut: signOut2 } = useAuth();
  const router2 = useRouter();
  const [open, setOpen] = useState(false);
  const isApproved = profile?.approval_status === "approved";
  const links = !user ? publicLinks : isAdmin || isApproved ? [
    ...memberLinks.map((l) => ({ to: l.to, label: l.label })),
    ...isAdmin ? [{ to: "/admin", label: "Admin" }] : []
  ] : [{ to: "/pending-approval", label: "Pending Approval" }];
  const onSignOut = async () => {
    await signOut2();
    setOpen(false);
    router2.navigate({ to: "/auth" });
  };
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 bg-white border-b border-amber-100 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex h-16 items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: user ? "/home" : "/", className: "flex items-center gap-3 min-w-0 shrink-0", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/assets/college-logo.png",
            alt: "SIMCOSA",
            className: "h-10 w-10 rounded-full object-cover ring-2 ring-amber-400 ring-offset-1"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "hidden sm:block", children: [
          /* @__PURE__ */ jsx("p", { className: "font-display text-lg font-bold leading-none text-gray-900", children: "SIMCOSA 84–85" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 font-semibold leading-none mt-0.5", children: "Govt. Siddhartha Medical College" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "hidden lg:flex items-center gap-0.5", children: links.map((l) => /* @__PURE__ */ jsx(
        Link,
        {
          to: l.to,
          className: "px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-amber-700 hover:bg-amber-50 transition-colors",
          activeProps: { className: "px-3 py-2 rounded-lg text-sm font-semibold text-amber-700 bg-amber-50" },
          children: l.label
        },
        l.to
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(OnlineCountBadge, {}),
        user ? /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onSignOut,
            className: "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors",
            children: [
              /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }),
              " Sign out"
            ]
          }
        ) : /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsxs(Button, { className: "flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 rounded-xl h-10 shadow-sm", children: [
          /* @__PURE__ */ jsx(LogIn, { className: "h-4 w-4" }),
          " Login"
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "lg:hidden p-2 rounded-lg hover:bg-amber-50 text-gray-600",
          onClick: () => setOpen((v) => !v),
          "aria-label": "Menu",
          children: open ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(Menu, { className: "h-6 w-6" })
        }
      )
    ] }),
    open && /* @__PURE__ */ jsxs("div", { className: "lg:hidden pb-4 pt-2 flex flex-col gap-1 border-t border-amber-100 mt-1", children: [
      links.map((l) => /* @__PURE__ */ jsx(
        Link,
        {
          to: l.to,
          onClick: () => setOpen(false),
          className: "px-4 py-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors",
          activeProps: { className: "px-4 py-3 rounded-lg text-base font-semibold text-amber-700 bg-amber-50" },
          children: l.label
        },
        l.to
      )),
      user ? /* @__PURE__ */ jsxs("button", { onClick: onSignOut, className: "mt-2 flex items-center gap-2 px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "h-5 w-5" }),
        " Sign out"
      ] }) : /* @__PURE__ */ jsx(Link, { to: "/auth", onClick: () => setOpen(false), children: /* @__PURE__ */ jsxs(Button, { className: "mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 text-base rounded-xl", children: [
        /* @__PURE__ */ jsx(LogIn, { className: "h-5 w-5 mr-2" }),
        " Login / Signup"
      ] }) })
    ] })
  ] }) });
}
function SiteFooter() {
  const { user, profile, isAdmin } = useAuth();
  const isApproved = profile?.approval_status === "approved";
  const showMemberLinks = user && (isAdmin || isApproved);
  return /* @__PURE__ */ jsx("footer", { className: "bg-gray-900 text-gray-300 mt-0", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("img", { src: "/assets/college-logo.png", alt: "SIMCOSA", className: "h-12 w-12 rounded-full object-cover ring-2 ring-amber-400" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-display text-lg font-bold text-white leading-none", children: "SIMCOSA 84–85" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-400 mt-0.5", children: "Govt. Siddhartha Medical College" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-gray-400 italic", children: '"Once Siddhartha, Always Siddhartha."' }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mt-3", children: "Reconnect. Remember. Support." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-white font-bold mb-4 text-base", children: "Quick Links" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-2 text-sm", children: [
          { to: "/about", label: "About Our Batch" },
          ...!user ? [{ to: "/auth", label: "Login / Signup" }] : [],
          ...showMemberLinks ? [
            { to: "/directory", label: "Members Directory" },
            { to: "/gallery", label: "Photo Gallery" },
            { to: "/events", label: "Events & Reunions" },
            { to: "/memories", label: "Memories Wall" },
            { to: "/blogs", label: "Blogs" }
          ] : []
        ].map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, { to: l.to, className: "text-gray-400 hover:text-amber-400 transition-colors", children: [
          "→ ",
          l.label
        ] }) }, l.to)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-white font-bold mb-4 text-base", children: "Stay Connected" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-gray-400", children: [
          /* @__PURE__ */ jsx("li", { children: "✉ simcosa84@gmail.com" }),
          /* @__PURE__ */ jsx("li", { children: "💬 SIMCOSA 84–85 WhatsApp" }),
          /* @__PURE__ */ jsx("li", { children: "👍 Follow us on Facebook" }),
          /* @__PURE__ */ jsx("li", { children: "📢 Subscribe to Updates" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://chat.whatsapp.com/",
            target: "_blank",
            rel: "noreferrer",
            className: "inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors",
            children: "Join Our Community"
          }
        ) })
      ] }),
      !user && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-white font-bold mb-4 text-base", children: "Members & Admins" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mb-4", children: "Sign in to access the private portal and admin tools." }),
        /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-sm", children: "Sign In" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "© 2024 SIMCOSA 1984–85 Batch · Govt. Siddhartha Medical College, Vijayawada" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-400 font-semibold", children: "❤ Reconnect. Remember. Support." })
    ] })
  ] }) });
}
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const STORAGE_KEY = "simcosa_welcome_name";
const VISIBLE_MS = 4e3;
const FADE_MS = 400;
function queueWelcomeToast(name, status = "approved") {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ name, status }));
  } catch {
  }
}
function messageFor(payload) {
  switch (payload.status) {
    case "pending":
      return "Your account is awaiting admin approval.";
    case "rejected":
      return "Your membership request was not approved. Please contact admin.";
    case "needs_clarification":
      return "Admin needs more details from you. Please check your profile.";
    default:
      return "";
  }
}
function WelcomeToast() {
  const [payload, setPayload] = useState(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let stored = null;
    try {
      stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) sessionStorage.removeItem(STORAGE_KEY);
    } catch {
    }
    if (!stored) return;
    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch {
      parsed = { name: stored, status: "approved" };
    }
    setPayload(parsed);
    const showTimer = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    const removeTimer = setTimeout(() => setPayload(null), VISIBLE_MS + FADE_MS);
    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);
  if (!payload) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "status",
      "aria-live": "polite",
      className: `fixed inset-x-0 top-4 sm:top-6 z-[100] flex justify-center px-4 pointer-events-none transition-all ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`,
      style: { transitionDuration: `${FADE_MS}ms` },
      children: /* @__PURE__ */ jsxs("div", { className: "pointer-events-auto flex items-center gap-3 sm:gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-5 py-4 sm:px-6 sm:py-5 shadow-xl ring-1 ring-amber-100 max-w-md", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/assets/college-logo.png",
            alt: "SIMCOSA",
            className: "h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-amber-400 ring-offset-1 shrink-0"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-base sm:text-lg font-semibold leading-snug text-gray-800", children: payload.status === "approved" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          "Welcome to ",
          /* @__PURE__ */ jsx("span", { className: "text-amber-600 font-bold", children: "SIMCOSA" }),
          ",",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-gray-900", children: payload.name }),
          "!"
        ] }) : messageFor(payload) })
      ] })
    }
  );
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-primary", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "This page doesn't exist." }),
    /* @__PURE__ */ jsx(Link, { to: "/", className: "mt-6 inline-flex items-center rounded-md bg-primary px-5 py-3 text-primary-foreground", children: "Go home" })
  ] }) });
}
function ErrorComponent({ error }) {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h2", { children: "Something went wrong" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: error.message }),
    /* @__PURE__ */ jsx("a", { href: "/", className: "mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-primary-foreground", children: "Go home" })
  ] }) });
}
const Route$h = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SIMCOSA 84–85 Batch Portal" },
      { name: "description", content: "Private alumni portal for the SIMCOSA 1984–85 batch — reunions, memories, and member support." },
      { property: "og:title", content: "SIMCOSA 84–85 Batch Portal" },
      { name: "twitter:title", content: "SIMCOSA 84–85 Batch Portal" },
      { property: "og:description", content: "Private alumni portal for the SIMCOSA 1984–85 batch — reunions, memories, and member support." },
      { name: "twitter:description", content: "Private alumni portal for the SIMCOSA 1984–85 batch — reunions, memories, and member support." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$h.useRouteContext();
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx(SiteFooter, {})
    ] }),
    /* @__PURE__ */ jsx(Toaster, { richColors: true, position: "top-center" }),
    /* @__PURE__ */ jsx(WelcomeToast, {}),
    /* @__PURE__ */ jsx(PresencePinger, {})
  ] }) });
}
const $$splitComponentImporter$g = () => import("./auth-Bgo2BEAJ.js");
const Route$g = createFileRoute("/auth")({
  head: () => ({
    meta: [{
      title: "Login — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./about-BaX52WID.js");
const Route$f = createFileRoute("/about")({
  head: () => ({
    meta: [{
      title: "About Our Batch — SIMCOSA 84–85"
    }, {
      name: "description",
      content: "The story of the SIMCOSA 1984–85 batch of Govt. Siddhartha Medical College, Vijayawada — our college years, journeys, and the bond we still share."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./_authenticated-ClQgTi9k.js");
const Route$e = createFileRoute("/_authenticated")({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./index-COxXM_4I.js");
const Route$d = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "SIMCOSA 84–85 Batch Portal"
    }, {
      name: "description",
      content: "A private members-only portal for the SIMCOSA 1984–85 batch. Sign in to access."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./support-DVWv65Lz.js");
const Route$c = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [{
      title: "Help & Support Corner — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./profile-PvPiR_cn.js");
const Route$b = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{
      title: "My Profile — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./pending-approval-Bk8pyJxw.js");
const Route$a = createFileRoute("/_authenticated/pending-approval")({
  head: () => ({
    meta: [{
      title: "Approval Pending — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./memories-BuVHpZ5P.js");
const Route$9 = createFileRoute("/_authenticated/memories")({
  head: () => ({
    meta: [{
      title: "Memories Wall — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./home-ZMGmsjxB.js");
const Route$8 = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [{
      title: "SIMCOSA 84–85 Batch Portal — Home"
    }, {
      name: "description",
      content: "Welcome to the official online home of the SIMCOSA 1984–85 batch. Reconnect. Celebrate. Support."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./gallery-fc-rlmq8.js");
const Route$7 = createFileRoute("/_authenticated/gallery")({
  head: () => ({
    meta: [{
      title: "Photo & Video Gallery — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./events-B7BR92Gz.js");
const Route$6 = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [{
      title: "Events & Reunions — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./donations-a59_S-Vu.js");
const Route$5 = createFileRoute("/_authenticated/donations")({
  head: () => ({
    meta: [{
      title: "Donations & Accounts — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./directory-9zaFHkPv.js");
const Route$4 = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [{
      title: "Members Directory — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./blogs-1OQqtExi.js");
const Route$3 = createFileRoute("/_authenticated/blogs")({
  head: () => ({
    meta: [{
      title: "SIMCOSA Blogs — SIMCOSA 84–85"
    }, {
      name: "description",
      content: "Share opinions, poems, articles and thoughts from our batchmates."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const CATEGORIES = [{
  value: "opinions",
  label: "Opinions"
}, {
  value: "poems",
  label: "Poems"
}, {
  value: "health_tips",
  label: "Health Tips"
}, {
  value: "memories",
  label: "Memories"
}, {
  value: "events",
  label: "Events"
}, {
  value: "general",
  label: "General"
}];
const SAMPLE_BLOGS = [{
  id: "sample-1",
  title: "Our Golden Days at Siddhartha Medical College",
  category: "memories",
  author: "A Batchmate",
  created_at: "2025-01-15T00:00:00.000Z",
  excerpt: "From late-night study sessions to canteen chai breaks — looking back at the years that made us who we are.",
  content: "From late-night study sessions to canteen chai breaks, our years at Govt. Siddhartha Medical College shaped not just our careers but our friendships for life. We walked into those gates as nervous teenagers and walked out as doctors and lifelong friends. Every corridor, every exam hall, every hostel room holds a memory worth cherishing. As we look back today, we realise just how golden those days truly were."
}, {
  id: "sample-2",
  title: "Friendship Beyond Time",
  category: "opinions",
  author: "A Batchmate",
  created_at: "2025-02-20T00:00:00.000Z",
  excerpt: "Forty years on, the bonds we built in medical college remain as strong as ever — distance and time couldn't change that.",
  content: "Forty years on, the bonds we built in medical college remain as strong as ever. We have scattered across cities and continents, taken up different specialities, and built different lives — yet whenever we meet, it feels like no time has passed at all. That, to me, is the true magic of the SIMCOSA 84-85 family — a friendship that distance and time could never change."
}, {
  id: "sample-3",
  title: "A Small Poem for SIMCOSA 84–85",
  category: "poems",
  author: "A Batchmate",
  created_at: "2025-03-10T00:00:00.000Z",
  excerpt: "A short verse dedicated to the friends who became family, written for our batch.",
  content: "Friends we were, friends we remain,\nThrough joy and loss, through sun and rain.\nSiddhartha's halls still echo our laughter,\nA bond that time runs gently after.\nHere's to the batch of '84 and '85,\nMay our friendship forever stay alive."
}, {
  id: "sample-4",
  title: "Health Tips for Our Age Group",
  category: "health_tips",
  author: "A Batchmate",
  created_at: "2025-04-05T00:00:00.000Z",
  excerpt: "A few simple, doctor-approved reminders for staying healthy as we cross our 60s together.",
  content: "As doctors ourselves, we know the advice — but here's a gentle reminder for all of us: stay active with a daily walk, keep your blood pressure and sugar checked regularly, eat mindfully, stay hydrated, prioritise sleep, and don't skip your annual health screenings. Just as important — stay socially connected. Batch reunions, calls with old friends, and shared laughter are good for the heart in more ways than one!"
}];
const $$splitComponentImporter$2 = () => import("./announcements-ZwO4EyLd.js");
const Route$2 = createFileRoute("/_authenticated/announcements")({
  head: () => ({
    meta: [{
      title: "Announcements — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./admin-DRFJA5hn.js");
const Route$1 = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{
      title: "Admin Dashboard"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./blogs._id-Mjf3joX1.js");
const Route = createFileRoute("/_authenticated/blogs/$id")({
  head: () => ({
    meta: [{
      title: "Blog — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const AuthRoute = Route$g.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$h
});
const AboutRoute = Route$f.update({
  id: "/about",
  path: "/about",
  getParentRoute: () => Route$h
});
const AuthenticatedRoute = Route$e.update({
  id: "/_authenticated",
  getParentRoute: () => Route$h
});
const IndexRoute = Route$d.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$h
});
const AuthenticatedSupportRoute = Route$c.update({
  id: "/support",
  path: "/support",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedProfileRoute = Route$b.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedPendingApprovalRoute = Route$a.update({
  id: "/pending-approval",
  path: "/pending-approval",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedMemoriesRoute = Route$9.update({
  id: "/memories",
  path: "/memories",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedHomeRoute = Route$8.update({
  id: "/home",
  path: "/home",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedGalleryRoute = Route$7.update({
  id: "/gallery",
  path: "/gallery",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedEventsRoute = Route$6.update({
  id: "/events",
  path: "/events",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDonationsRoute = Route$5.update({
  id: "/donations",
  path: "/donations",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDirectoryRoute = Route$4.update({
  id: "/directory",
  path: "/directory",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedBlogsRoute = Route$3.update({
  id: "/blogs",
  path: "/blogs",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAnnouncementsRoute = Route$2.update({
  id: "/announcements",
  path: "/announcements",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAdminRoute = Route$1.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedBlogsIdRoute = Route.update({
  id: "/$id",
  path: "/$id",
  getParentRoute: () => AuthenticatedBlogsRoute
});
const AuthenticatedBlogsRouteChildren = {
  AuthenticatedBlogsIdRoute
};
const AuthenticatedBlogsRouteWithChildren = AuthenticatedBlogsRoute._addFileChildren(AuthenticatedBlogsRouteChildren);
const AuthenticatedRouteChildren = {
  AuthenticatedAdminRoute,
  AuthenticatedAnnouncementsRoute,
  AuthenticatedBlogsRoute: AuthenticatedBlogsRouteWithChildren,
  AuthenticatedDirectoryRoute,
  AuthenticatedDonationsRoute,
  AuthenticatedEventsRoute,
  AuthenticatedGalleryRoute,
  AuthenticatedHomeRoute,
  AuthenticatedMemoriesRoute,
  AuthenticatedPendingApprovalRoute,
  AuthenticatedProfileRoute,
  AuthenticatedSupportRoute
};
const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  AboutRoute,
  AuthRoute
};
const routeTree = Route$h._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Button as B,
  CATEGORIES as C,
  OnlineMembersWidget as O,
  Route as R,
  SAMPLE_BLOGS as S,
  cn as a,
  createSsrRpc as c,
  getFirebaseApp as g,
  queueWelcomeToast as q,
  router as r,
  useAuth as u
};
