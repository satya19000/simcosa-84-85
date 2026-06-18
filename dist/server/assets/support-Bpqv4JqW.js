import { jsxs, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { c as createSsrRpc } from "./createSsrRpc-Cq7LnVBW.js";
import { r as requireAuth } from "./middleware-DAM3GHc6.js";
import { c as createServerFn } from "./server-B7mGRNKu.js";
import { u as useAuth, B as Button } from "./router-UmgH0Wlj.js";
import { I as Input } from "./input-B6JdUZ_J.js";
import { L as Label } from "./label-pO75YNTv.js";
import { T as Textarea } from "./textarea-BtQhR_Hw.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DXUFC8nu.js";
import { toast } from "sonner";
import { useState } from "react";
import { Shield, Heart, Clock, Send, HelpCircle } from "lucide-react";
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
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
const listMySupport = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("d9503064a034dc314a876b59e418cce3dd8fc81b5204142f1f4a165035863843"));
const createSupport = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createSsrRpc("f582a9077139cf9b573c808336f3561055edd028b40b857ec56af837b4771d0d"));
const categories = [{
  v: "medical",
  l: "Medical Advice / Consultation",
  emoji: "🏥"
}, {
  v: "financial",
  l: "Financial Support",
  emoji: "💰"
}, {
  v: "emotional",
  l: "Emotional / Mental Health Support",
  emoji: "💙"
}, {
  v: "family",
  l: "Family / Personal Issue",
  emoji: "👨‍👩‍👧"
}, {
  v: "other",
  l: "Other / General",
  emoji: "💬"
}];
const statusColors = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-sky-100 text-sky-700",
  resolved: "bg-emerald-100 text-emerald-700"
};
function Support() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState("medical");
  const [sending, setSending] = useState(false);
  const {
    data: mine
  } = useQuery({
    queryKey: ["my-support", user?.id],
    enabled: !!user,
    queryFn: () => listMySupport()
  });
  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSending(true);
    try {
      await createSupport({
        data: {
          category,
          subject: String(fd.get("subject")),
          message: String(fd.get("message"))
        }
      });
      toast.success("Sent! Admins will reach out to you privately. 💛");
      form.reset();
      qc.invalidateQueries({
        queryKey: ["my-support"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Batch Support" }),
      /* @__PURE__ */ jsx("h1", { children: "Help & Support Corner" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Reach out in confidence — only batch admins see your messages. We're here for each other." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3 mb-8", children: [{
        icon: Shield,
        label: "100% Private",
        desc: "Only admins can see",
        color: "text-emerald-600"
      }, {
        icon: Heart,
        label: "Compassionate",
        desc: "We're here for you",
        color: "text-rose-500"
      }, {
        icon: Clock,
        label: "Timely Response",
        desc: "Within 24 hours",
        color: "text-amber-600"
      }].map(({
        icon: Icon,
        label,
        desc,
        color
      }) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl p-4 border border-amber-100 text-center shadow-sm", children: [
        /* @__PURE__ */ jsx(Icon, { className: `h-6 w-6 ${color} mx-auto mb-1` }),
        /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-800 text-sm", children: label }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-xs", children: desc })
      ] }, label)) }),
      /* @__PURE__ */ jsxs("form", { onSubmit, className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "What kind of support do you need?" }),
          /* @__PURE__ */ jsxs(Select, { value: category, onValueChange: setCategory, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-12 text-base mt-1 border-amber-200 rounded-xl", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: categories.map((c) => /* @__PURE__ */ jsxs(SelectItem, { value: c.v, children: [
              c.emoji,
              " ",
              c.l
            ] }, c.v)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "sub", className: "font-semibold text-gray-700", children: "Subject" }),
          /* @__PURE__ */ jsx(Input, { id: "sub", name: "subject", required: true, placeholder: "Brief subject…", className: "h-12 text-base mt-1 border-amber-200 rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "msg", className: "font-semibold text-gray-700", children: "Your message" }),
          /* @__PURE__ */ jsx(Textarea, { id: "msg", name: "message", required: true, rows: 5, placeholder: "Share as much or as little as you're comfortable with…", className: "text-base mt-1 border-amber-200 rounded-xl resize-none" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: sending, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
          " ",
          sending ? "Sending…" : "Send Privately"
        ] }) })
      ] }),
      mine && mine.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-10", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-display text-xl font-bold text-gray-800 mb-5 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(HelpCircle, { className: "h-5 w-5 text-amber-500" }),
          " Your Past Requests"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: mine.map((r) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-amber-100 p-4 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-900", children: r.subject }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 capitalize mt-0.5", children: [
                categories.find((c) => c.v === r.category)?.emoji,
                " ",
                r.category
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: `text-xs font-bold uppercase px-3 py-1 rounded-full shrink-0 ${statusColors[r.status] ?? "bg-gray-100 text-gray-500"}`, children: r.status })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600 text-sm leading-relaxed", children: r.message })
        ] }, r.id)) })
      ] })
    ] })
  ] });
}
export {
  Support as component
};
