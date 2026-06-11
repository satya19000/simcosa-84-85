import { jsx, jsxs } from "react/jsx-runtime";
import { Outlet } from "@tanstack/react-router";
import { u as useAuth, B as Button } from "./router-D3RrNONf.js";
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
function AuthLayout() {
  const {
    user,
    loading
  } = useAuth();
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
  return /* @__PURE__ */ jsx(Outlet, {});
}
export {
  AuthLayout as component
};
