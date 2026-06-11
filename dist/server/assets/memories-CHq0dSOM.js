import { jsxs, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { c as createSsrRpc } from "./createSsrRpc-tq8Rv9xU.js";
import { r as requireAuth } from "./middleware-ffmSf9mS.js";
import { c as createServerFn } from "./server-w9OFQbuQ.js";
import { u as useAuth, B as Button } from "./router-Baew4hpN.js";
import { I as Input } from "./input-CyyQyze-.js";
import { L as Label } from "./label-DVW9noe7.js";
import { T as Textarea } from "./textarea-CWQP-F1s.js";
import { Send, BookOpen, Heart, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
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
const listMemories = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("b0d6200ea808e73a221faf82c362ec58b2a03ca94d33e58347f805d9087f54ea"));
const postMemory = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createSsrRpc("2065dd745dedbf088f44f3f3b299404d1ba89b3168af234c4c886a35fc6fb65c"));
const toggleLike = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createSsrRpc("e184df1fbbb69e55cfb60a3d022bf393270215e9e1cd47bd7c7f3a37184b86f3"));
const addComment = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createSsrRpc("c8064c21e72cfcfa435af44c92e16331acf572539341a658c887017ee837bd30"));
const AVATAR_COLORS = ["bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700", "bg-purple-100 text-purple-700"];
function Memories() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const [posting, setPosting] = useState(false);
  const {
    data: memories
  } = useQuery({
    queryKey: ["memories"],
    queryFn: () => listMemories()
  });
  const onPost = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPosting(true);
    try {
      await postMemory({
        data: {
          title: String(fd.get("title") || ""),
          body: String(fd.get("body"))
        }
      });
      form.reset();
      toast.success("Your memory has been shared! 💛");
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  };
  const toggleLike$1 = async (mid, liked) => {
    try {
      await toggleLike({
        data: {
          memoryId: mid,
          liked
        }
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Memories Wall" }),
      /* @__PURE__ */ jsx("h1", { children: "Stories That Warm Our Hearts" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Share an old memory — a story, a moment, a person we cherish." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsxs("form", { onSubmit: onPost, className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center font-display font-bold text-amber-700", children: user?.email?.charAt(0).toUpperCase() ?? "M" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-700", children: "Share a memory with your batchmates" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "t", className: "font-semibold text-gray-700", children: "Title (optional)" }),
            /* @__PURE__ */ jsx(Input, { id: "t", name: "title", placeholder: "Give your memory a title…", className: "h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "b", className: "font-semibold text-gray-700", children: "Your memory *" }),
            /* @__PURE__ */ jsx(Textarea, { id: "b", name: "body", required: true, rows: 4, placeholder: "Share a story, a moment, a person you miss from our batch days…", className: "text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl resize-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: posting, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl", children: [
          /* @__PURE__ */ jsx(Send, { className: "h-4 w-4 mr-2" }),
          " ",
          posting ? "Posting…" : "Share Memory"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
        memories?.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "h-16 w-16 text-amber-200 mx-auto mb-4" }),
          /* @__PURE__ */ jsx("h3", { className: "text-gray-500 font-display", children: "No memories yet" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-400 mt-2", children: "Be the first to share a cherished memory!" })
        ] }),
        memories?.map((m, i) => {
          const liked = m.memory_likes?.some((l) => l.user_id === user.id);
          const initials = (m.profiles?.full_name ?? "M").charAt(0);
          return /* @__PURE__ */ jsxs("article", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: `h-12 w-12 rounded-full flex items-center justify-center font-display text-xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`, children: initials }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900", children: m.profiles?.full_name ?? "A Batchmate" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: format(new Date(m.created_at), "PPP") })
                ] })
              ] }),
              m.title && /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900 mb-2", children: m.title }),
              /* @__PURE__ */ jsx("p", { className: "text-gray-700 leading-relaxed whitespace-pre-line", children: m.body })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "px-6 py-3 border-t border-amber-50 flex items-center gap-6", children: [
              /* @__PURE__ */ jsxs("button", { onClick: () => toggleLike$1(m.id, !!liked), className: `flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`, children: [
                /* @__PURE__ */ jsx(Heart, { className: `h-5 w-5 ${liked ? "fill-rose-500" : ""}` }),
                m.memory_likes?.length ?? 0,
                " ",
                liked ? "Liked" : "Like"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-sm text-gray-400", children: [
                /* @__PURE__ */ jsx(MessageCircle, { className: "h-5 w-5" }),
                m.memory_comments?.length ?? 0,
                " Comments"
              ] })
            ] }),
            /* @__PURE__ */ jsx(Comments, { memoryId: m.id, comments: m.memory_comments ?? [], colorIdx: i })
          ] }, m.id);
        })
      ] })
    ] })
  ] });
}
function Comments({
  memoryId,
  comments,
  colorIdx
}) {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const COLORS = ["bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700"];
  const add = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addComment({
        data: {
          memoryId,
          body: text
        }
      });
      setText("");
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "px-6 pb-5 space-y-3", children: [
    comments.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2 bg-amber-50/60 rounded-xl p-3", children: comments.map((c, ci) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: `h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${COLORS[(colorIdx + ci + 1) % COLORS.length]}`, children: (c.profiles?.full_name ?? "M").charAt(0) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white rounded-xl px-3 py-2 border border-amber-100", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-gray-800", children: [
          c.profiles?.full_name ?? "Member",
          ": "
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: c.body })
      ] })
    ] }, c.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-1", children: [
      /* @__PURE__ */ jsx(Input, { value: text, onChange: (e) => setText(e.target.value), onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && add(), placeholder: "Write a comment…", className: "h-11 text-sm rounded-xl border-amber-200" }),
      /* @__PURE__ */ jsx(Button, { onClick: add, disabled: sending || !text.trim(), className: "h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-4", children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }) })
    ] })
  ] });
}
export {
  Memories as component
};
