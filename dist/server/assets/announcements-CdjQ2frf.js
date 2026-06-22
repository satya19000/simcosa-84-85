import { jsxs, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { c as createSsrRpc } from "./router-CC6hf82-.js";
import { r as requireApproved } from "./middleware-3n1ym3ek.js";
import { c as createServerFn } from "./server-D1b4KObJ.js";
import { format } from "date-fns";
import { Bell, Megaphone, Heart, Award, Cake } from "lucide-react";
import "@tanstack/react-router";
import "react";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const listAnnouncements = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("736de8b782851ebdb4801dcbe9836d3e6815003548e57853cf9218f934ed9589"));
const icons = {
  birthday: Cake,
  achievement: Award,
  condolence: Heart,
  notice: Megaphone
};
const kindColors = {
  birthday: "bg-rose-50 border-rose-200 text-rose-600",
  achievement: "bg-amber-50 border-amber-200 text-amber-600",
  condolence: "bg-gray-50 border-gray-200 text-gray-500",
  notice: "bg-sky-50 border-sky-200 text-sky-600"
};
function Announcements() {
  const {
    data
  } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => listAnnouncements()
  });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Batch Updates" }),
      /* @__PURE__ */ jsx("h1", { children: "Announcements" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Birthdays, achievements, condolences, and important notices from our batch." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-10", children: [
      data?.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
        /* @__PURE__ */ jsx(Bell, { className: "h-16 w-16 text-amber-200 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-gray-500 font-display", children: "No announcements yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400 mt-2", children: "Check back soon for batch updates." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: data?.map((a) => {
        const Icon = icons[a.kind] ?? Megaphone;
        const colorClass = kindColors[a.kind] ?? "bg-amber-50 border-amber-200 text-amber-600";
        return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow", children: [
          /* @__PURE__ */ jsx("div", { className: `flex-shrink-0 p-3 rounded-xl border ${colorClass}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-900 text-lg", children: a.title }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 shrink-0", children: format(new Date(a.created_at), "PPP") })
            ] }),
            a.body && /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600 leading-relaxed", children: a.body }),
            /* @__PURE__ */ jsx("span", { className: `inline-block mt-2 text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${colorClass}`, children: a.kind })
          ] })
        ] }, a.id);
      }) })
    ] })
  ] });
}
export {
  Announcements as component
};
