import { jsxs, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { u as useAuth, s as supabase, B as Button } from "./router-CIkP24eF.js";
import { I as Input } from "./input-YO8m5oZO.js";
import { L as Label } from "./label-CMrJaZtA.js";
import { T as Textarea } from "./textarea-DFuG4s5I.js";
import { Send, BookOpen, Heart, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
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
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("memories").select("*, profiles(full_name), memory_likes(user_id), memory_comments(id, body, user_id, created_at, profiles(full_name))").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const onPost = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPosting(true);
    const {
      error
    } = await supabase.from("memories").insert({
      user_id: user.id,
      title: String(fd.get("title") || ""),
      body: String(fd.get("body"))
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    form.reset();
    toast.success("Your memory has been shared! 💛");
    qc.invalidateQueries({
      queryKey: ["memories"]
    });
  };
  const toggleLike = async (mid, liked) => {
    if (liked) {
      await supabase.from("memory_likes").delete().eq("memory_id", mid).eq("user_id", user.id);
    } else {
      await supabase.from("memory_likes").insert({
        memory_id: mid,
        user_id: user.id
      });
    }
    qc.invalidateQueries({
      queryKey: ["memories"]
    });
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
              /* @__PURE__ */ jsxs("button", { onClick: () => toggleLike(m.id, !!liked), className: `flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`, children: [
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
    const {
      error
    } = await supabase.from("memory_comments").insert({
      memory_id: memoryId,
      user_id: user.id,
      body: text
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
    qc.invalidateQueries({
      queryKey: ["memories"]
    });
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
