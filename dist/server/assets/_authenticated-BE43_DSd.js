import { jsx, jsxs } from "react/jsx-runtime";
import { Link, Outlet } from "@tanstack/react-router";
import { u as useAuth, B as Button } from "./router-CIkP24eF.js";
import "@tanstack/react-query";
import "react";
import "@supabase/supabase-js";
import "lucide-react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
function AuthLayout() {
  const {
    user,
    profile,
    isAdmin,
    loading
  } = useAuth();
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-md px-4 py-20 text-center text-muted-foreground", children: "Loading…" });
  }
  if (!user) {
    return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx("h2", { children: "Members only" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "Please sign in to view this page." }),
      /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { className: "mt-6 h-12 px-6 text-base", children: "Login or Signup" }) })
    ] });
  }
  if (!profile?.approved && !isAdmin) {
    return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx("h2", { children: "Awaiting approval" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-3 text-muted-foreground", children: [
        "Thank you for signing up, ",
        /* @__PURE__ */ jsx("strong", { children: profile?.full_name }),
        ". An admin will review and approve your account soon. You'll get access to member pages once approved."
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "mt-6 h-12 px-6 text-base", children: "Go to Home" }) })
    ] });
  }
  return /* @__PURE__ */ jsx(Outlet, {});
}
export {
  AuthLayout as component
};
