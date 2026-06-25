import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { l as listMemories, p as postMemory, a as addMemoryImages, d as deleteMemory, b as deleteMemoryImage, r as reorderMemoryImages, t as toggleLike, e as editMemory, c as deleteComment, f as addComment } from "./memories-BlY9kBRF.js";
import { u as useAuth, B as Button, a as cn } from "./router-CiaoHDRh.js";
import { I as Input } from "./input-CdD2gpc1.js";
import { L as Label } from "./label-w7FimGkJ.js";
import { T as Textarea } from "./textarea-DC4uV14G.js";
import { Send, BookOpen, Pencil, Trash2, Paperclip, ArrowUpDown, Heart, MessageCircle, X, ArrowLeft, ArrowRight, ExternalLink, Download, File, FileText, Presentation, FileSpreadsheet, Archive } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { I as ImageLightbox } from "./ImageLightbox-Dt94sEvv.js";
import { u as useUploadQueue, D as DropzoneUpload, d as deleteFromFirebaseStorage, c as compressImage, a as uploadToFirebaseStorageResumable } from "./useUploadQueue-Cl0jajkL.js";
import "./middleware-DaCWU6Sb.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "./server-DJH2wxxJ.js";
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
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;
const MAX_DOC_MB = 25;
const MEMORY_ACCEPT = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv", "application/zip", "application/x-zip-compressed"].join(",");
function maxMBForType(mimeType) {
  if (mimeType.startsWith("image/")) return MAX_IMAGE_MB;
  if (mimeType.startsWith("video/")) return MAX_VIDEO_MB;
  return MAX_DOC_MB;
}
function isImageType(mimeType) {
  return !!(mimeType && mimeType.startsWith("image/"));
}
function isVideoType(mimeType) {
  return !!(mimeType && mimeType.startsWith("video/"));
}
const AVATAR_COLORS = ["bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700", "bg-purple-100 text-purple-700"];
function validateFiles(files) {
  const allowed = new Set(MEMORY_ACCEPT.split(","));
  for (const f of files) {
    if (!allowed.has(f.type)) {
      return `"${f.name}" is an unsupported format. Allowed: images, videos, PDF, Office docs, ZIP.`;
    }
    const limitMB = maxMBForType(f.type);
    if (f.size > limitMB * 1024 * 1024) {
      return `"${f.name}" exceeds the ${limitMB} MB limit for this file type.`;
    }
  }
  return null;
}
async function uploadMemoryAttachments(files, userId, uploadQueue) {
  uploadQueue.init(files);
  const uploaded = [];
  for (const original of files) {
    try {
      uploadQueue.setStatus(original, "uploading", 0);
      const toUpload = isImageType(original.type) ? await compressImage(original) : original;
      const res = await uploadToFirebaseStorageResumable(toUpload, "memories", userId, (pct) => uploadQueue.setPct(original, pct));
      uploaded.push({
        url: res.url,
        storagePath: res.path,
        fileName: toUpload.name,
        mimeType: toUpload.type,
        fileSize: toUpload.size
      });
      uploadQueue.setStatus(original, "completed", 100);
    } catch (err) {
      uploadQueue.setStatus(original, "error");
      throw err;
    }
  }
  return uploaded;
}
function attachmentIcon(mimeType) {
  if (!mimeType) return /* @__PURE__ */ jsx(File, { className: "h-8 w-8" });
  if (mimeType === "application/pdf") return /* @__PURE__ */ jsx(FileText, { className: "h-8 w-8 text-red-500" });
  if (mimeType.includes("wordprocessingml") || mimeType === "application/msword") return /* @__PURE__ */ jsx(FileText, { className: "h-8 w-8 text-blue-600" });
  if (mimeType.includes("presentationml") || mimeType === "application/vnd.ms-powerpoint") return /* @__PURE__ */ jsx(Presentation, { className: "h-8 w-8 text-orange-500" });
  if (mimeType.includes("spreadsheetml") || mimeType === "application/vnd.ms-excel" || mimeType === "text/csv") return /* @__PURE__ */ jsx(FileSpreadsheet, { className: "h-8 w-8 text-green-600" });
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed") return /* @__PURE__ */ jsx(Archive, { className: "h-8 w-8 text-purple-500" });
  return /* @__PURE__ */ jsx(File, { className: "h-8 w-8 text-gray-400" });
}
function attachmentLabel(mimeType) {
  if (!mimeType) return "File";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("wordprocessingml") || mimeType === "application/msword") return "Word document";
  if (mimeType.includes("presentationml") || mimeType === "application/vnd.ms-powerpoint") return "Presentation";
  if (mimeType.includes("spreadsheetml") || mimeType === "application/vnd.ms-excel") return "Spreadsheet";
  if (mimeType === "text/csv") return "CSV file";
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed") return "ZIP archive";
  if (mimeType === "text/plain") return "Text file";
  return "File";
}
function FileAttachmentCard({
  img,
  onRemove,
  isLegacy
}) {
  const label = attachmentLabel(img.mime_type);
  const name = img.file_name ?? label;
  return /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3", children: [
    attachmentIcon(img.mime_type),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800 truncate", children: name }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400", children: [
        label,
        img.file_size ? ` · ${(img.file_size / 1024).toFixed(0)} KB` : ""
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
      /* @__PURE__ */ jsx("a", { href: img.image_url, target: "_blank", rel: "noreferrer", "aria-label": "Open file", className: "h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-100 transition-colors", children: /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("a", { href: img.image_url, download: img.file_name ?? void 0, "aria-label": "Download file", className: "h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-100 transition-colors", children: /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }) }),
      onRemove && !isLegacy && /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Remove file", onClick: () => onRemove(img.id), className: "h-8 w-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
    ] })
  ] });
}
function MemoryAttachmentGrid({
  images,
  onOpen,
  reordering,
  onMove,
  memoryId,
  onRemove
}) {
  if (images.length === 0) return null;
  const isLegacy = (img) => !!(memoryId && img.id === memoryId);
  const visualItems = images.filter((img) => isImageType(img.mime_type) || isVideoType(img.mime_type));
  const docItems = images.filter((img) => !isImageType(img.mime_type) && !isVideoType(img.mime_type));
  const getOriginalIdx = (img) => images.indexOf(img);
  return /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2", children: [
    visualItems.length > 0 && /* @__PURE__ */ jsx("div", { className: cn("grid gap-1.5", visualItems.length === 1 ? "" : visualItems.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"), children: visualItems.map((img) => {
      const origIdx = getOriginalIdx(img);
      const i = visualItems.indexOf(img);
      const canDelete = onRemove && !isLegacy(img);
      const isVideo = isVideoType(img.mime_type);
      if (visualItems.length === 1 && !reordering) {
        return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-xl border border-amber-100", children: [
          isVideo ? /* @__PURE__ */ jsx("video", { src: img.image_url, controls: true, className: "w-full max-h-96 object-contain" }) : /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onOpen(origIdx), className: "block w-full cursor-zoom-in", children: /* @__PURE__ */ jsx("img", { src: img.image_url, alt: "Memory photo", loading: "lazy", className: "w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300" }) }),
          canDelete && /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Remove", onClick: () => onRemove(img.id), className: "absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" }) })
        ] }, img.id);
      }
      return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-lg border border-amber-100 aspect-square", children: [
        isVideo ? /* @__PURE__ */ jsx("video", { src: img.image_url, className: "h-full w-full object-cover", muted: true }) : /* @__PURE__ */ jsx("button", { type: "button", onClick: () => !reordering && onOpen(origIdx), disabled: reordering, className: cn("h-full w-full block", !reordering && "cursor-zoom-in"), children: /* @__PURE__ */ jsx("img", { src: img.image_url, alt: "Memory photo", loading: "lazy", className: "h-full w-full object-cover hover:scale-[1.05] transition-transform duration-300" }) }),
        reordering ? /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Move earlier", disabled: i === 0, onClick: () => onMove?.(origIdx, -1), className: "h-8 w-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-white", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Move later", disabled: i === visualItems.length - 1, onClick: () => onMove?.(origIdx, 1), className: "h-8 w-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-white", children: /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" }) })
        ] }) : canDelete && /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Remove", onClick: () => onRemove(img.id), className: "absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" }) })
      ] }, img.id);
    }) }),
    !reordering && docItems.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: docItems.map((img) => /* @__PURE__ */ jsx(FileAttachmentCard, { img, onRemove, isLegacy: isLegacy(img) }, img.id)) }),
    reordering && docItems.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: docItems.map((img) => {
      const origIdx = getOriginalIdx(img);
      return /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3", children: [
        attachmentIcon(img.mime_type),
        /* @__PURE__ */ jsx("p", { className: "flex-1 text-sm font-semibold text-gray-800 truncate", children: img.file_name ?? attachmentLabel(img.mime_type) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("button", { type: "button", disabled: origIdx === 0, onClick: () => onMove?.(origIdx, -1), className: "h-7 w-7 rounded-full bg-white border border-amber-200 text-gray-600 flex items-center justify-center disabled:opacity-30 hover:bg-amber-50", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsx("button", { type: "button", disabled: origIdx === images.length - 1, onClick: () => onMove?.(origIdx, 1), className: "h-7 w-7 rounded-full bg-white border border-amber-200 text-gray-600 flex items-center justify-center disabled:opacity-30 hover:bg-amber-50", children: /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" }) })
        ] })
      ] }, img.id);
    }) })
  ] });
}
function Memories() {
  const {
    user,
    isAdmin
  } = useAuth();
  const qc = useQueryClient();
  const [posting, setPosting] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingFilesId, setAddingFilesId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);
  const uploadQueue = useUploadQueue();
  const {
    data: memories
  } = useQuery({
    queryKey: ["memories"],
    queryFn: () => listMemories()
  });
  const onPost = async (e) => {
    e.preventDefault();
    if (!user) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "");
    const body = String(fd.get("body") || "");
    const authorName = isAdmin ? String(fd.get("authorName") || "") : "";
    const err = validateFiles(attachmentFiles);
    if (err) {
      toast.error(err);
      return;
    }
    setPosting(true);
    try {
      const {
        id: memoryId
      } = await postMemory({
        data: {
          title: title || void 0,
          body,
          authorName: authorName || void 0
        }
      });
      if (attachmentFiles.length > 0) {
        const uploaded = await uploadMemoryAttachments(attachmentFiles, user.id, uploadQueue);
        await addMemoryImages({
          data: {
            memoryId,
            images: uploaded
          }
        });
      }
      form.reset();
      setAttachmentFiles([]);
      uploadQueue.reset();
      toast.success("Your memory has been shared!");
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
    } catch (err2) {
      toast.error(err2 instanceof Error ? err2.message : "Upload failed. Please try again.");
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
      for (const path of res.fbStoragePaths) {
        deleteFromFirebaseStorage(path).catch((err) => console.error("[memories] failed to delete storage object:", err));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };
  const handleRemoveAttachment = async (imageId) => {
    if (!confirm("Remove this attachment from this memory?")) return;
    try {
      const res = await deleteMemoryImage({
        data: {
          id: imageId
        }
      });
      toast.success("Attachment removed");
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) => console.error("[memories] failed to delete storage object:", err));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to remove attachment");
    }
  };
  const handleMoveAttachment = async (memoryId, images, idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= images.length) return;
    const reordered = [...images];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const orderedImageIds = reordered.map((img) => img.id);
    try {
      await reorderMemoryImages({
        data: {
          memoryId,
          orderedImageIds
        }
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
      toast.success("Order updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update order");
    }
  };
  const lightboxMemory = memories?.find((m) => m.id === lightbox?.memoryId);
  const lightboxImages = (lightboxMemory?.images ?? []).filter((img) => isImageType(img.mime_type)).map((img) => ({
    src: img.image_url,
    alt: lightboxMemory?.title ?? "Memory photo"
  }));
  const toLightboxIndex = (memory, origIdx) => {
    if (!memory) return 0;
    const imageItems = memory.images.filter((img) => isImageType(img.mime_type));
    const clickedImg = memory.images[origIdx];
    const lbIdx = imageItems.indexOf(clickedImg);
    return lbIdx >= 0 ? lbIdx : 0;
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
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-700", children: "Add Memory" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "t", className: "font-semibold text-gray-700", children: "Title (optional)" }),
            /* @__PURE__ */ jsx(Input, { id: "t", name: "title", placeholder: "Give your memory a title…", className: "h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "b", className: "font-semibold text-gray-700", children: "Memory / Story *" }),
            /* @__PURE__ */ jsx(Textarea, { id: "b", name: "body", required: true, rows: 4, placeholder: "Share a story, a moment, a person you miss from our batch days…", className: "text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl resize-none" })
          ] }),
          isAdmin && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "an", className: "font-semibold text-gray-700", children: "Posted on behalf of / Batchmate name (optional)" }),
            /* @__PURE__ */ jsx(Input, { id: "an", name: "authorName", placeholder: "e.g. Dr. Srilatha", className: "h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Add photos, videos or files (optional)" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400 mt-0.5 mb-1", children: [
              "Supported: images (up to ",
              MAX_IMAGE_MB,
              " MB), videos (up to ",
              MAX_VIDEO_MB,
              " MB), PDFs/Office docs/ZIP (up to ",
              MAX_DOC_MB,
              " MB)."
            ] }),
            /* @__PURE__ */ jsx(DropzoneUpload, { files: attachmentFiles, onFilesChange: setAttachmentFiles, accept: MEMORY_ACCEPT, multiple: true, disabled: posting, className: "mt-1", progress: uploadQueue.progress })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-end gap-4", children: [
          posting && attachmentFiles.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-amber-700 font-semibold", children: "Uploading… please wait" }),
          /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: posting, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl", children: [
            /* @__PURE__ */ jsx(Send, { className: "h-4 w-4 mr-2" }),
            " ",
            posting ? "Posting…" : "Post Memory"
          ] })
        ] })
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
          const canManage = isAdmin || m.user_id === user?.id;
          return /* @__PURE__ */ jsxs("article", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: `h-12 w-12 rounded-full flex items-center justify-center font-display text-xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`, children: initials }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900", children: m.display_name || "A Batchmate" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: format(new Date(m.created_at), "PPP") })
                ] }),
                canManage && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEditingId(editingId === m.id ? null : m.id), "aria-label": "Edit memory", className: "h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onDeleteMemory(m.id), "aria-label": "Delete memory", className: "h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
                ] })
              ] }),
              editingId === m.id ? /* @__PURE__ */ jsx(EditMemoryPanel, { memory: m, onDone: () => setEditingId(null) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                m.title && /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900 mb-2", children: m.title }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-700 leading-relaxed whitespace-pre-line", children: m.body }),
                /* @__PURE__ */ jsx(MemoryAttachmentGrid, { images: m.images, onOpen: (origIdx) => {
                  const lbIdx = toLightboxIndex(m, origIdx);
                  setLightbox({
                    memoryId: m.id,
                    index: lbIdx
                  });
                }, reordering: reorderingId === m.id, onMove: (idx, dir) => handleMoveAttachment(m.id, m.images, idx, dir), memoryId: m.id, onRemove: canManage ? handleRemoveAttachment : void 0 }),
                canManage && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-4", children: [
                  addingFilesId !== m.id && /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setAddingFilesId(m.id), className: "flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700", children: [
                    /* @__PURE__ */ jsx(Paperclip, { className: "h-4 w-4" }),
                    " Add more files"
                  ] }),
                  m.images.length > 1 && /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setReorderingId(reorderingId === m.id ? null : m.id), className: "flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700", children: [
                    /* @__PURE__ */ jsx(ArrowUpDown, { className: "h-4 w-4" }),
                    " ",
                    reorderingId === m.id ? "Done reordering" : "Reorder attachments"
                  ] })
                ] }),
                canManage && addingFilesId === m.id && /* @__PURE__ */ jsx(AddAttachmentsPanel, { memoryId: m.id, existingImages: m.images, onDone: () => setAddingFilesId(null) })
              ] })
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
    /* @__PURE__ */ jsx(ImageLightbox, { images: lightboxImages, index: lightbox?.index ?? null, onClose: () => setLightbox(null), onIndexChange: (idx) => setLightbox((lb) => lb ? {
      ...lb,
      index: idx
    } : lb) })
  ] });
}
function AddAttachmentsPanel({
  memoryId,
  existingImages,
  onDone
}) {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const uploadQueue = useUploadQueue();
  const save = async () => {
    if (!user || files.length === 0) return;
    const err = validateFiles(files);
    if (err) {
      toast.error(err);
      return;
    }
    const existingKeys = new Set(existingImages.filter((img) => img.file_name != null && img.file_size != null).map((img) => `${img.file_name}:${img.file_size}`));
    const unique = [];
    let dupCount = 0;
    for (const f of files) {
      if (existingKeys.has(`${f.name}:${f.size}`)) {
        dupCount++;
      } else {
        unique.push(f);
      }
    }
    if (dupCount > 0) {
      toast.error(dupCount === 1 ? "This file already exists in this memory" : `${dupCount} duplicate files skipped`);
    }
    if (unique.length === 0) {
      onDone();
      return;
    }
    setSaving(true);
    try {
      const uploaded = await uploadMemoryAttachments(unique, user.id, uploadQueue);
      await addMemoryImages({
        data: {
          memoryId,
          images: uploaded
        }
      });
      setFiles([]);
      uploadQueue.reset();
      toast.success("Files added");
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
      onDone();
    } catch (err2) {
      toast.error(err2 instanceof Error ? err2.message : "Upload failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2 bg-amber-50/50 rounded-xl p-3", children: [
    /* @__PURE__ */ jsx(DropzoneUpload, { files, onFilesChange: setFiles, accept: MEMORY_ACCEPT, multiple: true, disabled: saving, progress: uploadQueue.progress }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onDone, disabled: saving, className: "h-9 rounded-xl", children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { type: "button", onClick: save, disabled: saving || files.length === 0, className: "h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl", children: saving ? "Uploading…" : "Upload" })
    ] })
  ] });
}
function EditMemoryPanel({
  memory,
  onDone
}) {
  const {
    user,
    isAdmin
  } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState(memory.title ?? "");
  const [body, setBody] = useState(memory.body);
  const [authorName, setAuthorName] = useState(memory.author_name ?? "");
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const uploadQueue = useUploadQueue();
  const canManageImages = isAdmin || memory.user_id === user?.id;
  const save = async () => {
    if (!body.trim() || !user) {
      toast.error("Your memory text cannot be empty.");
      return;
    }
    const err = validateFiles(newFiles);
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      await editMemory({
        data: {
          id: memory.id,
          title: title || void 0,
          body,
          authorName: authorName || void 0
        }
      });
      if (newFiles.length > 0) {
        const uploaded = await uploadMemoryAttachments(newFiles, user.id, uploadQueue);
        await addMemoryImages({
          data: {
            memoryId: memory.id,
            images: uploaded
          }
        });
      }
      setNewFiles([]);
      uploadQueue.reset();
      toast.success("Memory updated");
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
      onDone();
    } catch (err2) {
      toast.error(err2 instanceof Error ? err2.message : "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const removeAttachment = async (imageId) => {
    if (!confirm("Remove this attachment?")) return;
    try {
      const res = await deleteMemoryImage({
        data: {
          id: imageId
        }
      });
      qc.invalidateQueries({
        queryKey: ["memories"]
      });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) => console.error("[memories] failed to delete storage object:", err));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove attachment");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3 bg-amber-50/50 rounded-xl p-4", children: [
    /* @__PURE__ */ jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Title (optional)", className: "h-11 border-amber-200 rounded-xl" }),
    /* @__PURE__ */ jsx(Textarea, { value: body, onChange: (e) => setBody(e.target.value), rows: 4, className: "border-amber-200 rounded-xl resize-none" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Author display name (optional)" }),
      /* @__PURE__ */ jsx(Input, { value: authorName, onChange: (e) => setAuthorName(e.target.value), placeholder: "Leave blank to show your profile name", className: "h-11 mt-1 border-amber-200 rounded-xl" })
    ] }),
    canManageImages && memory.images.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Existing attachments" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2", children: memory.images.filter((img) => isImageType(img.mime_type)).map((img) => /* @__PURE__ */ jsxs("div", { className: "relative rounded-lg overflow-hidden border border-amber-100 aspect-square", children: [
        /* @__PURE__ */ jsx("img", { src: img.image_url, alt: "", className: "h-full w-full object-cover" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeAttachment(img.id), "aria-label": "Remove", className: "absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center", children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" }) })
      ] }, img.id)) }),
      memory.images.filter((img) => !isImageType(img.mime_type) && !isVideoType(img.mime_type)).map((img) => /* @__PURE__ */ jsx(FileAttachmentCard, { img, onRemove: removeAttachment, isLegacy: img.id === memory.id }, img.id)),
      memory.images.filter((img) => isVideoType(img.mime_type)).map((img) => /* @__PURE__ */ jsxs("div", { className: "relative rounded-lg overflow-hidden border border-amber-100", children: [
        /* @__PURE__ */ jsx("video", { src: img.image_url, controls: true, className: "w-full max-h-48 object-contain" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeAttachment(img.id), "aria-label": "Remove video", className: "absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center", children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" }) })
      ] }, img.id))
    ] }),
    canManageImages && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs(Label, { className: "font-semibold text-gray-700 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Paperclip, { className: "h-4 w-4" }),
        " Add more files"
      ] }),
      /* @__PURE__ */ jsx(DropzoneUpload, { files: newFiles, onFilesChange: setNewFiles, accept: MEMORY_ACCEPT, multiple: true, disabled: saving, progress: uploadQueue.progress, className: "mt-1" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onDone, disabled: saving, className: "h-10 rounded-xl", children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { type: "button", onClick: save, disabled: saving, className: "h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl", children: saving ? "Saving…" : "Save changes" })
    ] })
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
