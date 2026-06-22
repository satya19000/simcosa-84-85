import { jsxs, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { l as listMemories, p as postMemory, d as deleteMemory, t as toggleLike, a as deleteComment, b as addComment } from "./memories-CWqscgia.js";
import { u as useAuth, B as Button } from "./router-DjWW1pnI.js";
import { I as Input } from "./input-Cdlmpifr.js";
import { L as Label } from "./label-D4rPGW0w.js";
import { T as Textarea } from "./textarea-BntbaorX.js";
import { Send, BookOpen, Trash2, Heart, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { I as ImageLightbox } from "./ImageLightbox-Dt94sEvv.js";
import { u as useUploadQueue, D as DropzoneUpload, c as compressImage, a as uploadToFirebaseStorageResumable, d as deleteFromFirebaseStorage } from "./useUploadQueue-DCRjb3T8.js";
import "./middleware-WZRxhZR2.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "./server-DhPuYpyg.js";
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
import "firebase/storage";
const ALLOWED_MEMORY_IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_MEMORY_UPLOAD_MB = 15;
const AVATAR_COLORS = ["bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700", "bg-purple-100 text-purple-700"];
function Memories() {
  const {
    user,
    isAdmin
  } = useAuth();
  const qc = useQueryClient();
  const [posting, setPosting] = useState(false);
  const [lbIndex, setLbIndex] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const uploadQueue = useUploadQueue();
  const {
    data: memories
  } = useQuery({
    queryKey: ["memories"],
    queryFn: () => listMemories()
  });
  const photoMemories = (memories ?? []).filter((m) => !!m.image_url);
  const lightboxImages = photoMemories.map((m) => ({
    src: m.image_url,
    alt: m.title ?? m.profiles?.full_name ?? "Memory photo",
    caption: m.title ?? (m.profiles?.full_name ? `Shared by ${m.profiles.full_name}` : void 0)
  }));
  const onPost = async (e) => {
    e.preventDefault();
    if (!user) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "");
    const body = String(fd.get("body") || "");
    let file = photoFiles[0];
    if (file) {
      if (!ALLOWED_MEMORY_IMAGE_TYPES.has(file.type)) {
        toast.error("Unsupported image format. Please use JPG, PNG, or WEBP.");
        return;
      }
      if (file.size > MAX_MEMORY_UPLOAD_MB * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Maximum size is ${MAX_MEMORY_UPLOAD_MB}MB.`);
        return;
      }
    }
    setPosting(true);
    const original = file;
    if (original) uploadQueue.init([original]);
    try {
      let uploaded = null;
      if (file) {
        uploadQueue.setStatus(original, "uploading", 0);
        file = await compressImage(file);
        uploaded = await uploadToFirebaseStorageResumable(file, "memories", user.id, (pct) => uploadQueue.setPct(original, pct));
        uploadQueue.setStatus(original, "completed", 100);
      }
      await postMemory({
        data: {
          title: title || void 0,
          body,
          url: uploaded?.url,
          storagePath: uploaded?.path,
          fileName: file?.name,
          mimeType: file?.type,
          fileSize: file?.size
        }
      });
      form.reset();
      setPhotoFiles([]);
      uploadQueue.reset();
      toast.success("Upload completed successfully. Your memory has been shared! 💛");
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      if (original) uploadQueue.setStatus(original, "error");
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
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
  const onDeleteMemory = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await deleteMemory({
        data: {
          id
        }
      });
      toast.success("Memory deleted");
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) => console.error("[memories] failed to delete storage object:", err));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
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
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Photo (optional)" }),
            /* @__PURE__ */ jsx(DropzoneUpload, { files: photoFiles, onFilesChange: setPhotoFiles, accept: "image/*", multiple: false, disabled: posting, className: "mt-1", progress: uploadQueue.progress })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-end gap-4", children: [
          posting && photoFiles.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-amber-700 font-semibold", children: "Uploading… please wait" }),
          /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: posting, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl", children: [
            /* @__PURE__ */ jsx(Send, { className: "h-4 w-4 mr-2" }),
            " ",
            posting ? "Posting…" : "Share Memory"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
        memories?.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "h-16 w-16 text-amber-200 mx-auto mb-4" }),
          /* @__PURE__ */ jsx("h3", { className: "text-gray-500 font-display", children: "No memories yet" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-400 mt-2", children: "Be the first to share a cherished memory — like Dr. Vijaya Gopal or Dr. Srilatha would!" })
        ] }),
        memories?.map((m, i) => {
          const liked = m.memory_likes?.some((l) => l.user_id === user.id);
          const initials = (m.profiles?.full_name ?? "M").charAt(0);
          return /* @__PURE__ */ jsxs("article", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: `h-12 w-12 rounded-full flex items-center justify-center font-display text-xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`, children: initials }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900", children: m.profiles?.full_name ?? "A Batchmate" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: format(new Date(m.created_at), "PPP") })
                ] }),
                (isAdmin || m.user_id === user?.id) && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onDeleteMemory(m.id), "aria-label": "Delete memory", className: "h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
              ] }),
              m.title && /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900 mb-2", children: m.title }),
              /* @__PURE__ */ jsx("p", { className: "text-gray-700 leading-relaxed whitespace-pre-line", children: m.body }),
              m.image_url && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setLbIndex(photoMemories.findIndex((pm) => pm.id === m.id)), className: "mt-4 block w-full overflow-hidden rounded-xl border border-amber-100 cursor-zoom-in", children: /* @__PURE__ */ jsx("img", { src: m.image_url, alt: m.title ?? "Memory photo", loading: "lazy", className: "w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300" }) })
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
    ] }),
    /* @__PURE__ */ jsx(ImageLightbox, { images: lightboxImages, index: lbIndex, onClose: () => setLbIndex(null), onIndexChange: setLbIndex })
  ] });
}
function Comments({
  memoryId,
  comments,
  colorIdx
}) {
  const {
    user,
    isAdmin
  } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const onDeleteComment = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteComment({
        data: {
          id
        }
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };
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
      /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white rounded-xl px-3 py-2 border border-amber-100 flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-gray-800", children: [
            c.profiles?.full_name ?? "Member",
            ": "
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: c.body })
        ] }),
        (isAdmin || c.user_id === user?.id) && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onDeleteComment(c.id), "aria-label": "Delete comment", className: "text-gray-300 hover:text-red-600 transition-colors shrink-0", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
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
