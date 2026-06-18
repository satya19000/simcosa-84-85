import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useRouter, Link, createRootRouteWithContext, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, GoogleAuthProvider, onIdTokenChanged, signOut, signInWithPopup, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getApps, getApp, initializeApp } from "firebase/app";
import { Users, Camera, Calendar, BookOpen, MessageCircle, Heart, HelpCircle, LogOut, LogIn, X, Menu } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Toaster as Toaster$1 } from "sonner";
const appCss = "/assets/styles-9jBnCQ6z.css";
const firebaseConfig = {
  apiKey: void 0,
  authDomain: void 0,
  projectId: void 0,
  storageBucket: void 0,
  messagingSenderId: void 0,
  appId: void 0
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
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const clearState = () => {
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };
  const load = async () => {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setProfile(data.profile ?? null);
        setIsAdmin(!!data.isAdmin);
      } else {
        clearState();
      }
    } catch {
      clearState();
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
    await load();
  };
  const signInEmail = async (email, password) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  };
  const signUpEmail = async (email, password) => {
    await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  };
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  };
  const signInGoogle = async () => {
    await signInWithPopup(getFirebaseAuth(), googleProvider);
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
        isApproved: !!profile?.approved,
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
const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" }
];
const memberLinks = [
  { to: "/directory", label: "Members", icon: Users },
  { to: "/gallery", label: "Gallery", icon: Camera },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/memories", label: "Memories", icon: BookOpen },
  { to: "/announcements", label: "News", icon: MessageCircle },
  { to: "/donations", label: "Donate", icon: Heart },
  { to: "/support", label: "Support", icon: HelpCircle }
];
function SiteHeader() {
  const { user, isAdmin, signOut: signOut2 } = useAuth();
  const router2 = useRouter();
  const [open, setOpen] = useState(false);
  const links = [
    ...publicLinks,
    ...user ? memberLinks.map((l) => ({ to: l.to, label: l.label })) : [],
    ...isAdmin ? [{ to: "/admin", label: "Admin" }] : []
  ];
  const onSignOut = async () => {
    await signOut2();
    setOpen(false);
    router2.navigate({ to: "/" });
  };
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 bg-white border-b border-amber-100 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex h-16 items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-3 min-w-0 shrink-0", children: [
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
      /* @__PURE__ */ jsx("div", { className: "hidden lg:flex items-center gap-2 shrink-0", children: user ? /* @__PURE__ */ jsxs(
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
      ] }) }) }),
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
          { to: "/auth", label: "Login / Signup" },
          { to: "/directory", label: "Members Directory" },
          { to: "/gallery", label: "Photo Gallery" },
          { to: "/events", label: "Events & Reunions" },
          { to: "/memories", label: "Memories Wall" }
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
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-white font-bold mb-4 text-base", children: "For Admins" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mb-4", children: "Admin login to manage members, content and portal settings." }),
        /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-sm", children: "Admin Login" }) })
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
const Route$d = createRootRouteWithContext()({
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
  const { queryClient } = Route$d.useRouteContext();
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col", children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx(SiteFooter, {})
    ] }),
    /* @__PURE__ */ jsx(Toaster, { richColors: true, position: "top-center" })
  ] }) });
}
const $$splitComponentImporter$c = () => import("./auth-BWD6S6eO.js");
const Route$c = createFileRoute("/auth")({
  head: () => ({
    meta: [{
      title: "Login — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./about-Ct-T75o1.js");
const Route$b = createFileRoute("/about")({
  head: () => ({
    meta: [{
      title: "About Our Batch — SIMCOSA 84–85"
    }, {
      name: "description",
      content: "The story of the SIMCOSA 1984–85 batch of Govt. Siddhartha Medical College, Vijayawada — our college years, journeys, and the bond we still share."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./_authenticated-BTB-yikP.js");
const Route$a = createFileRoute("/_authenticated")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./index-DnMyksWy.js");
const Route$9 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "SIMCOSA 84–85 Batch Portal — Home"
    }, {
      name: "description",
      content: "Welcome to the official online home of the SIMCOSA 1984–85 batch. Reconnect. Celebrate. Support."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./support-Cx6SBVph.js");
const Route$8 = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [{
      title: "Help & Support Corner — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./profile-ByJHQxlx.js");
const Route$7 = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{
      title: "My Profile — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./memories-DoOhg_Db.js");
const Route$6 = createFileRoute("/_authenticated/memories")({
  head: () => ({
    meta: [{
      title: "Memories Wall — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./gallery-D20RNkVO.js");
const Route$5 = createFileRoute("/_authenticated/gallery")({
  head: () => ({
    meta: [{
      title: "Photo & Video Gallery — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./events-BqiwevPc.js");
const Route$4 = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [{
      title: "Events & Reunions — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./donations-D9KdDvjN.js");
const Route$3 = createFileRoute("/_authenticated/donations")({
  head: () => ({
    meta: [{
      title: "Donations & Accounts — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./directory-C4G84Tn1.js");
const Route$2 = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [{
      title: "Members Directory — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./announcements-B8t4kNcE.js");
const Route$1 = createFileRoute("/_authenticated/announcements")({
  head: () => ({
    meta: [{
      title: "Announcements — SIMCOSA 84–85"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./admin-wmBJ-IAU.js");
const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{
      title: "Admin Dashboard"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const AuthRoute = Route$c.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$d
});
const AboutRoute = Route$b.update({
  id: "/about",
  path: "/about",
  getParentRoute: () => Route$d
});
const AuthenticatedRoute = Route$a.update({
  id: "/_authenticated",
  getParentRoute: () => Route$d
});
const IndexRoute = Route$9.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$d
});
const AuthenticatedSupportRoute = Route$8.update({
  id: "/support",
  path: "/support",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedProfileRoute = Route$7.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedMemoriesRoute = Route$6.update({
  id: "/memories",
  path: "/memories",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedGalleryRoute = Route$5.update({
  id: "/gallery",
  path: "/gallery",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedEventsRoute = Route$4.update({
  id: "/events",
  path: "/events",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDonationsRoute = Route$3.update({
  id: "/donations",
  path: "/donations",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDirectoryRoute = Route$2.update({
  id: "/directory",
  path: "/directory",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAnnouncementsRoute = Route$1.update({
  id: "/announcements",
  path: "/announcements",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAdminRoute = Route.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedRouteChildren = {
  AuthenticatedAdminRoute,
  AuthenticatedAnnouncementsRoute,
  AuthenticatedDirectoryRoute,
  AuthenticatedDonationsRoute,
  AuthenticatedEventsRoute,
  AuthenticatedGalleryRoute,
  AuthenticatedMemoriesRoute,
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
const routeTree = Route$d._addFileChildren(rootRouteChildren)._addFileTypes();
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
  cn as c,
  router as r,
  useAuth as u
};
