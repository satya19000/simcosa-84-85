import { jsx, jsxs } from "react/jsx-runtime";
import { u as useAuth, B as Button } from "./router-DMLO9Khz.js";
import { Clock, XCircle, HelpCircle } from "lucide-react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "react";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "./server-UEbKG0hA.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "./middleware-BmGJ8s8p.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "sonner";
function PendingApprovalPage() {
  const {
    profile,
    isAdmin
  } = useAuth();
  const status = profile?.approval_status ?? "pending";
  const content = (() => {
    if (isAdmin || status === "approved") {
      return {
        icon: /* @__PURE__ */ jsx(Clock, { className: "h-10 w-10 text-amber-500" }),
        title: "You're all set!",
        message: "Your account is approved. You can now access the members area."
      };
    }
    if (status === "rejected") {
      return {
        icon: /* @__PURE__ */ jsx(XCircle, { className: "h-10 w-10 text-red-500" }),
        title: "Membership not approved",
        message: "Your membership request was not approved. Please contact admin."
      };
    }
    if (status === "needs_clarification") {
      return {
        icon: /* @__PURE__ */ jsx(HelpCircle, { className: "h-10 w-10 text-amber-500" }),
        title: "More details needed",
        message: "Admin needs more details from you before approving your membership. Please update your profile or contact admin."
      };
    }
    return {
      icon: /* @__PURE__ */ jsx(Clock, { className: "h-10 w-10 text-amber-500" }),
      title: "Awaiting admin approval",
      message: "Your account has been created. Please wait for admin approval. You'll be able to access members-only pages once an admin approves your account."
    };
  })();
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white flex items-center justify-center px-4 py-16", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-8 max-w-md w-full text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4", children: content.icon }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: content.title }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-3 text-base", children: content.message }),
    profile && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl bg-amber-50/60 border border-amber-100 p-4 text-left text-sm text-gray-600 space-y-1", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-700", children: "Name:" }),
        " ",
        profile.full_name
      ] }),
      profile.email && /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-700", children: "Email:" }),
        " ",
        profile.email
      ] }),
      profile.phone && /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-700", children: "Phone:" }),
        " ",
        profile.phone
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx("a", { href: "/profile", children: /* @__PURE__ */ jsx(Button, { className: "w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl", children: "Edit my profile" }) }),
      /* @__PURE__ */ jsx("a", { href: "/", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full h-12 rounded-xl", children: "Back to Home" }) })
    ] })
  ] }) });
}
export {
  PendingApprovalPage as component
};
