import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { c as createSsrRpc, u as useAuth } from "./router-TV6HlS94.js";
import { r as requireApproved } from "./middleware-QHgTRr5E.js";
import { c as createServerFn } from "./server-qvj13OZq.js";
import { p as populateMemberSlugs } from "./memberBlogs-Ca4M-RnL.js";
import { Search, RefreshCw, Briefcase, MapPin, Mail, Phone, MessageCircle, BookOpen, AlertTriangle, Users, Check, Copy } from "lucide-react";
import { useState } from "react";
import { I as Input } from "./input-DbZ2VoXQ.js";
import { I as ImageLightbox } from "./ImageLightbox-Dt94sEvv.js";
import { toast } from "sonner";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
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
const listMembers = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("68129abdcf75ddcdb764d314aeef32f61bae884cfb55d07a85cb0f7f9f56ff6c"));
function CopyBlogUrl({
  slug
}) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    const url = `${window.location.origin}/members/${slug}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        toast.success("Blog link copied");
        setTimeout(() => setCopied(false), 2e3);
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  }
  function fallbackCopy(url) {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    setCopied(true);
    toast.success("Blog link copied");
    setTimeout(() => setCopied(false), 2e3);
  }
  return /* @__PURE__ */ jsx("button", { type: "button", onClick: handleCopy, "aria-label": "Copy blog URL", className: "flex items-center gap-1 text-gray-400 hover:text-amber-600 transition-colors", title: "Copy blog URL", children: copied ? /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5 text-emerald-500" }) : /* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5" }) });
}
function Directory() {
  const [search, setSearch] = useState("");
  const [lbIndex, setLbIndex] = useState(null);
  const {
    isAdmin,
    isOwner
  } = useAuth();
  const canAdmin = isAdmin || isOwner;
  const qc = useQueryClient();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["directory"],
    queryFn: () => listMembers()
  });
  const generateSlugsMutation = useMutation({
    mutationFn: () => populateMemberSlugs({
      data: void 0
    }),
    onSuccess: (result) => {
      qc.invalidateQueries({
        queryKey: ["directory"]
      });
      toast.success(`Generated ${result.updated} blog URL${result.updated !== 1 ? "s" : ""}`);
    },
    onError: () => toast.error("Failed to generate blog URLs")
  });
  const filtered = data?.filter((m) => !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || (m.location ?? "").toLowerCase().includes(search.toLowerCase()) || (m.profession ?? "").toLowerCase().includes(search.toLowerCase()));
  const memberPhotos = (filtered ?? []).filter((m) => !!m.photo_url).map((m) => ({
    src: m.photo_url,
    alt: m.full_name,
    caption: [m.full_name, m.profession].filter(Boolean).join(" · ")
  }));
  const AVATAR_COLORS = ["bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700", "bg-purple-100 text-purple-700", "bg-orange-100 text-orange-700"];
  const missingSlugCount = canAdmin ? data?.filter((m) => !m.slug).length ?? 0 : 0;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Batch Family" }),
      /* @__PURE__ */ jsx("h1", { children: "Members Directory" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Visible only to approved batchmates — find and connect with your classmates." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-4 mt-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative max-w-md flex-1 min-w-48", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }),
          /* @__PURE__ */ jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by name, city, profession…", className: "pl-12 h-12 text-base rounded-xl border-amber-200 focus:border-amber-400" })
        ] }),
        canAdmin && missingSlugCount > 0 && /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => generateSlugsMutation.mutate(), disabled: generateSlugsMutation.isPending, className: "flex items-center gap-2 px-4 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-60", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: `h-4 w-4 ${generateSlugsMutation.isPending ? "animate-spin" : ""}` }),
          "Generate Blog URLs (",
          missingSlugCount,
          " missing)"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 py-10", children: [
      isLoading && /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5", children: Array.from({
        length: 6
      }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl p-5 shadow-sm border border-amber-100 animate-pulse h-48" }, i)) }),
      /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5", children: filtered?.map((m, i) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md hover:-translate-y-0.5 transition-all", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
          m.photo_url ? /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setLbIndex(memberPhotos.findIndex((p) => p.src === m.photo_url)), "aria-label": `Enlarge photo of ${m.full_name}`, className: "shrink-0 rounded-full cursor-zoom-in", children: /* @__PURE__ */ jsx("img", { src: m.photo_url, alt: m.full_name, className: "h-16 w-16 rounded-full object-cover ring-2 ring-amber-200" }) }) : /* @__PURE__ */ jsx("div", { className: `h-16 w-16 rounded-full flex items-center justify-center font-display text-2xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`, children: m.full_name.charAt(0) }),
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
          m.bio && /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-xs italic pt-1 line-clamp-2", children: m.bio }),
          m.slug ? /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t border-amber-50", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs(Link, { to: "/members/$slug", params: {
                slug: m.slug
              }, className: "flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors", children: [
                /* @__PURE__ */ jsx(BookOpen, { className: "h-3.5 w-3.5 shrink-0" }),
                "View Blog"
              ] }),
              /* @__PURE__ */ jsx(CopyBlogUrl, { slug: m.slug })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-[10px] text-gray-400 font-mono truncate", children: [
              "/members/",
              m.slug
            ] })
          ] }) : canAdmin ? /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t border-amber-50 flex items-center gap-1.5 text-xs text-amber-500", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3.5 w-3.5 shrink-0" }),
            "Blog URL missing"
          ] }) : null
        ] })
      ] }, m.id)) }),
      filtered?.length === 0 && !isLoading && /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
        /* @__PURE__ */ jsx(Users, { className: "h-16 w-16 text-amber-200 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-gray-500 font-display", children: search ? `No members found for "${search}"` : "No members yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400 mt-2", children: "Complete your profile to appear in the directory!" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(ImageLightbox, { images: memberPhotos, index: lbIndex, onClose: () => setLbIndex(null), onIndexChange: setLbIndex })
  ] });
}
export {
  Directory as component
};
