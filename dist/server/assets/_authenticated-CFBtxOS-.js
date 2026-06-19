import { jsx, jsxs } from "react/jsx-runtime";
import { useRouterState, Outlet } from "@tanstack/react-router";
import { u as useAuth, B as Button } from "./router-oXVcfM5Q.js";
import "@tanstack/react-query";
import "react";
import "firebase/auth";
import "firebase/app";
import "lucide-react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
const ALWAYS_ALLOWED_PATHS = ["/profile", "/pending-approval"];
function AuthLayout() {
  const {
    user,
    profile,
    isAdmin,
    loading
  } = useAuth();
  const pathname = useRouterState({
    select: (s) => s.location.pathname
  });
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-md px-4 py-20 text-center text-muted-foreground", children: "Loading…" });
  }
  if (!user) {
    return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx("h2", { children: "Members only" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Please sign in to view this page." }),
      /* @__PURE__ */ jsx("a", { href: "/auth", children: /* @__PURE__ */ jsx(Button, { className: "mt-6 h-12 px-6 text-base", children: "Sign in" }) })
    ] });
  }
  const isApproved = profile?.approval_status === "approved";
  const onAllowedPath = ALWAYS_ALLOWED_PATHS.some((p) => pathname === p);
  if (!isAdmin && !isApproved && !onAllowedPath) {
    const status = profile?.approval_status ?? "pending";
    const message = status === "rejected" ? "Your membership request was not approved. Please contact admin." : status === "needs_clarification" ? "Admin needs more details from you. Please check your profile." : "Your account is awaiting admin approval.";
    return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx("h2", { children: "Account pending" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: message }),
      /* @__PURE__ */ jsx("a", { href: "/pending-approval", children: /* @__PURE__ */ jsx(Button, { className: "mt-6 h-12 px-6 text-base", children: "View status" }) })
    ] });
  }
  return /* @__PURE__ */ jsx(Outlet, {});
}
export {
  AuthLayout as component
};
