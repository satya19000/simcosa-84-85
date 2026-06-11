import { jsxs, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { c as createSsrRpc } from "./createSsrRpc-B0E5FiUZ.js";
import { a as requireAuth } from "./middleware-CoxskvJW.js";
import { c as createServerFn } from "./server-DZvL4NrQ.js";
import { Search, Briefcase, MapPin, Mail, Phone, MessageCircle, Users } from "lucide-react";
import { useState } from "react";
import { I as Input } from "./input-Bzri1R4A.js";
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
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
import "./router-YwtD5LNI.js";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
const listMembers = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("68129abdcf75ddcdb764d314aeef32f61bae884cfb55d07a85cb0f7f9f56ff6c"));
function Directory() {
  const [search, setSearch] = useState("");
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["directory"],
    queryFn: () => listMembers()
  });
  const filtered = data?.filter((m) => !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || (m.location ?? "").toLowerCase().includes(search.toLowerCase()) || (m.profession ?? "").toLowerCase().includes(search.toLowerCase()));
  const AVATAR_COLORS = ["bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700", "bg-purple-100 text-purple-700", "bg-orange-100 text-orange-700"];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Batch Family" }),
      /* @__PURE__ */ jsx("h1", { children: "Members Directory" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Visible only to approved batchmates — find and connect with your classmates." }),
      /* @__PURE__ */ jsxs("div", { className: "relative mt-6 max-w-md", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }),
        /* @__PURE__ */ jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by name, city, profession…", className: "pl-12 h-12 text-base rounded-xl border-amber-200 focus:border-amber-400" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 py-10", children: [
      isLoading && /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5", children: Array.from({
        length: 6
      }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl p-5 shadow-sm border border-amber-100 animate-pulse h-48" }, i)) }),
      /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5", children: filtered?.map((m, i) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md hover:-translate-y-0.5 transition-all", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
          m.photo_url ? /* @__PURE__ */ jsx("img", { src: m.photo_url, alt: m.full_name, className: "h-16 w-16 rounded-full object-cover ring-2 ring-amber-200" }) : /* @__PURE__ */ jsx("div", { className: `h-16 w-16 rounded-full flex items-center justify-center font-display text-2xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`, children: m.full_name.charAt(0) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 truncate", children: m.full_name }),
            m.profession && /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-600 font-semibold flex items-center gap-1 truncate", children: [
              /* @__PURE__ */ jsx(Briefcase, { className: "h-3.5 w-3.5 shrink-0" }),
              m.profession
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-gray-600 border-t border-amber-50 pt-4", children: [
          m.location && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4 text-amber-500 shrink-0" }),
            m.location
          ] }),
          m.email && /* @__PURE__ */ jsxs("a", { href: `mailto:${m.email}`, className: "flex items-center gap-2 hover:text-amber-600 transition-colors", children: [
            /* @__PURE__ */ jsx(Mail, { className: "h-4 w-4 text-amber-500 shrink-0" }),
            m.email
          ] }),
          m.phone && /* @__PURE__ */ jsxs("a", { href: `tel:${m.phone}`, className: "flex items-center gap-2 hover:text-amber-600 transition-colors", children: [
            /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4 text-amber-500 shrink-0" }),
            m.phone
          ] }),
          m.whatsapp && /* @__PURE__ */ jsxs("a", { href: `https://wa.me/${m.whatsapp.replace(/\D/g, "")}`, target: "_blank", rel: "noreferrer", className: "flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors font-semibold", children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4 shrink-0" }),
            "WhatsApp"
          ] }),
          m.bio && /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-xs italic pt-1 line-clamp-2", children: m.bio })
        ] })
      ] }, m.id)) }),
      filtered?.length === 0 && !isLoading && /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
        /* @__PURE__ */ jsx(Users, { className: "h-16 w-16 text-amber-200 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-gray-500 font-display", children: search ? `No members found for "${search}"` : "No members yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400 mt-2", children: "Complete your profile to appear in the directory!" })
      ] })
    ] })
  ] });
}
export {
  Directory as component
};
