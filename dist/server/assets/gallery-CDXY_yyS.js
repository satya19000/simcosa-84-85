import { jsxs, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { l as listGallery, u as uploadGalleryItem, t as toggleGalleryLike, d as deleteGalleryItem, r as replaceGalleryItemFile, e as editGalleryItem, a as deleteGalleryComment, b as addGalleryComment } from "./gallery-VGdWIb-8.js";
import { u as useAuth, B as Button } from "./router-DVvQVXlU.js";
import { I as Input } from "./input-D4wu_qTP.js";
import { L as Label } from "./label-B3Bwran8.js";
import { Upload, Image, Film, FileText, Trash2, ImageOff, RefreshCw, MapPin, Calendar, Users, Pencil, Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { I as ImageLightbox } from "./ImageLightbox-Dt94sEvv.js";
import { u as useUploadQueue, D as DropzoneUpload, c as compressImage, a as uploadToFirebaseStorageResumable, d as deleteFromFirebaseStorage } from "./useUploadQueue-C2OT03as.js";
import "./middleware-4Fp-2rtQ.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "./server-D4zmPpw9.js";
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
const FILTERS = ["All", "College Days", "Reunions", "Achievements", "Family Moments", "Tributes"];
const SAMPLE_IMAGES = [{
  src: "/assets/hero-reunion.jpeg",
  caption: "Reunion — Yellow Shirt Day"
}, {
  src: "/assets/simcosa-stage.jpeg",
  caption: "SIMCOSA 85 — Celebrating Friendship"
}, {
  src: "/assets/birthday-event.jpeg",
  caption: "Batch Birthday Celebration"
}, {
  src: "/assets/member-profile.jpeg",
  caption: "Our Batchmate"
}];
const ALLOWED_IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_UPLOAD_MB = 15;
function Gallery() {
  const {
    user,
    isAdmin
  } = useAuth();
  const qc = useQueryClient();
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [takenDate, setTakenDate] = useState("");
  const [people, setPeople] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadQueue = useUploadQueue();
  const [activeFilter, setActiveFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [lb, setLb] = useState(null);
  const {
    data: items,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => listGallery()
  });
  if (isError) {
    console.error("[gallery] failed to load gallery items:", error);
  }
  const onSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !user) return;
    for (const file of files) {
      if (file.type.startsWith("image") && !ALLOWED_IMAGE_TYPES.has(file.type)) {
        toast.error(`Unsupported image format for "${file.name}". Please use JPG, PNG, or WEBP.`);
        return;
      }
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Maximum size is ${MAX_UPLOAD_MB}MB.`);
        return;
      }
    }
    setUploading(true);
    uploadQueue.init(files);
    let succeeded = 0;
    let failed = 0;
    for (const original of files) {
      let file = original;
      uploadQueue.setStatus(original, "uploading", 0);
      try {
        if (file.type.startsWith("image/")) {
          file = await compressImage(file);
        }
        const {
          url,
          path
        } = await uploadToFirebaseStorageResumable(file, "gallery", user.id, (pct) => uploadQueue.setPct(original, pct));
        await uploadGalleryItem({
          data: {
            url,
            storagePath: path,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            caption: caption || void 0,
            title: title || void 0,
            location: location || void 0,
            takenDate: takenDate || void 0,
            people: people || void 0
          }
        });
        uploadQueue.setStatus(original, "completed", 100);
        succeeded++;
      } catch (err) {
        uploadQueue.setStatus(original, "error");
        failed++;
        console.error("[gallery] upload failed:", err);
      }
    }
    if (failed === 0) {
      toast.success("Upload completed successfully.");
      setFiles([]);
      setCaption("");
      setTitle("");
      setLocation("");
      setTakenDate("");
      setPeople("");
      setShowUpload(false);
      uploadQueue.reset();
    } else {
      toast.error(`Upload failed. Please try again. (Uploaded: ${succeeded}, Failed: ${failed})`);
    }
    qc.invalidateQueries({
      queryKey: ["gallery"]
    });
    setUploading(false);
  };
  const videos = items?.filter((i) => i.media_type === "video") ?? [];
  const documents = items?.filter((i) => i.media_type === "document") ?? [];
  const images = items?.filter((i) => i.media_type !== "video" && i.media_type !== "document") ?? [];
  const onDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await deleteGalleryItem({
        data: {
          id
        }
      });
      toast.success("Item deleted");
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) => console.error("[gallery] failed to delete storage object:", err));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };
  const uploadedImages = images.map((it) => ({
    src: it.file_available && it.file_url ? it.file_url : "",
    alt: it.caption ?? "Photo",
    caption: it.caption ?? void 0
  }));
  const toggleLike = async (id, liked) => {
    if (!user) {
      toast.error("Please sign in to like items.");
      return;
    }
    try {
      await toggleGalleryLike({
        data: {
          galleryItemId: id,
          liked
        }
      });
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-end justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Our Memories" }),
          /* @__PURE__ */ jsx("h1", { children: "Photo & Video Gallery" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Old school photos, reunion snaps, candid moments — all in one place." })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => setShowUpload((v) => !v), className: "bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 h-12 rounded-xl shrink-0", children: [
          /* @__PURE__ */ jsx(Upload, { className: "h-5 w-5 mr-2" }),
          " Upload Photo/Video"
        ] })
      ] }),
      showUpload && /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl mt-6", children: /* @__PURE__ */ jsxs("form", { onSubmit, className: "bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Choose photos, videos, or files" }),
          /* @__PURE__ */ jsx(DropzoneUpload, { files, onFilesChange: setFiles, accept: "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx", disabled: uploading, className: "mt-1", progress: uploadQueue.progress }),
          files.some((f) => f.type.startsWith("video/")) && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 mt-1.5 font-medium", children: "Videos may take longer depending on file size and internet speed." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 -mt-1", children: "Optional details below are applied to all selected files. You can edit each photo's details later." }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "title", className: "font-semibold text-gray-700", children: "Title (optional)" }),
            /* @__PURE__ */ jsx(Input, { id: "title", name: "title", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Reunion Day", className: "h-12 mt-1 border-amber-200" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "caption", className: "font-semibold text-gray-700", children: "Caption / memory note (optional)" }),
            /* @__PURE__ */ jsx(Input, { id: "caption", name: "caption", value: caption, onChange: (e) => setCaption(e.target.value), placeholder: "Add a caption…", className: "h-12 mt-1 border-amber-200" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "location", className: "font-semibold text-gray-700", children: "Place / location (optional)" }),
            /* @__PURE__ */ jsx(Input, { id: "location", name: "location", value: location, onChange: (e) => setLocation(e.target.value), placeholder: "e.g. Vijayawada", className: "h-12 mt-1 border-amber-200" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "takenDate", className: "font-semibold text-gray-700", children: "Date taken (optional)" }),
            /* @__PURE__ */ jsx(Input, { id: "takenDate", name: "takenDate", type: "date", value: takenDate, onChange: (e) => setTakenDate(e.target.value), className: "h-12 mt-1 border-amber-200" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "people", className: "font-semibold text-gray-700", children: "People in photo (optional)" }),
            /* @__PURE__ */ jsx(Input, { id: "people", name: "people", value: people, onChange: (e) => setPeople(e.target.value), placeholder: "e.g. Dr. Satya, Dr. Vijaya Gopal", className: "h-12 mt-1 border-amber-200" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: uploading || files.length === 0, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl shrink-0", children: uploading ? "Uploading…" : `Upload ${files.length > 0 ? files.length + " item(s)" : ""}` }),
          uploading && /* @__PURE__ */ jsxs("span", { className: "text-sm text-amber-700 font-semibold", children: [
            "Uploading ",
            Math.min(uploadQueue.completedCount + uploadQueue.failedCount + 1, uploadQueue.total),
            " of ",
            uploadQueue.total,
            " files… please wait"
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 flex-wrap mb-8", children: FILTERS.map((f) => /* @__PURE__ */ jsx("button", { onClick: () => setActiveFilter(f), className: `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeFilter === f ? "bg-amber-500 text-white shadow-sm" : "bg-white text-gray-600 border border-amber-200 hover:border-amber-400 hover:text-amber-700"}`, children: f }, f)) }),
      isLoading && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-amber-100 bg-white p-6 text-center text-gray-500 font-semibold mb-8", children: "Loading gallery…" }),
      isError && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600 font-semibold mb-8", children: "Unable to load gallery. Please contact admin." }),
      !isLoading && !isError && items?.length === 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Image, { className: "h-5 w-5 text-amber-500" }),
          /* @__PURE__ */ jsx("h3", { className: "font-display font-bold text-gray-700", children: "Sample Gallery" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: "(upload your own photos above)" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: SAMPLE_IMAGES.map((img, idx) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setLb({
          images: SAMPLE_IMAGES,
          index: idx
        }), className: "text-left rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-shadow group cursor-zoom-in", children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-square", children: /* @__PURE__ */ jsx("img", { src: img.src, alt: img.caption, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", loading: "lazy" }) }),
          /* @__PURE__ */ jsx("p", { className: "p-3 text-sm text-gray-600 font-medium", children: img.caption })
        ] }, img.src)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 text-center text-gray-400", children: [
          /* @__PURE__ */ jsx(Upload, { className: "h-10 w-10 mx-auto mb-3 text-amber-200" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Be the first to upload batch photos!" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: 'Click "Upload Photo/Video" above to get started.' })
        ] })
      ] }),
      images.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-5", children: [
          /* @__PURE__ */ jsx(Image, { className: "h-5 w-5 text-amber-500" }),
          /* @__PURE__ */ jsxs("h3", { className: "font-display font-bold text-gray-700", children: [
            "Photos (",
            images.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: images.map((it, idx) => /* @__PURE__ */ jsx(GalleryItem, { item: it, onOpen: () => setLb({
          images: uploadedImages,
          index: idx
        }), canDelete: isAdmin || it.uploaded_by === user?.id, onDelete: () => onDelete(it.id), onToggleLike: toggleLike }, it.id)) })
      ] }),
      videos.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-5", children: [
          /* @__PURE__ */ jsx(Film, { className: "h-5 w-5 text-amber-500" }),
          /* @__PURE__ */ jsxs("h3", { className: "font-display font-bold text-gray-700", children: [
            "Videos (",
            videos.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: videos.map((it) => /* @__PURE__ */ jsx(GalleryItem, { item: it, canDelete: isAdmin || it.uploaded_by === user?.id, onDelete: () => onDelete(it.id), onToggleLike: toggleLike }, it.id)) })
      ] }),
      documents.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-5", children: [
          /* @__PURE__ */ jsx(FileText, { className: "h-5 w-5 text-amber-500" }),
          /* @__PURE__ */ jsxs("h3", { className: "font-display font-bold text-gray-700", children: [
            "Files (",
            documents.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: documents.map((it) => /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow", children: [
          /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(FileText, { className: "h-6 w-6 text-amber-500" }) }),
          it.file_available && it.file_url ? /* @__PURE__ */ jsxs("a", { href: it.file_url, target: "_blank", rel: "noreferrer", className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-700 truncate", children: it.caption || it.storage_path }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 truncate", children: it.storage_path })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-700 truncate", children: it.caption || it.storage_path }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 truncate", children: "Old file missing. Please re-upload." })
          ] }),
          (isAdmin || it.uploaded_by === user?.id) && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onDelete(it.id), "aria-label": "Delete file", className: "h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] }, it.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(ImageLightbox, { images: lb?.images ?? [], index: lb?.index ?? null, onClose: () => setLb(null), onIndexChange: (i) => setLb((s) => s ? {
      ...s,
      index: i
    } : s), renderFooter: (i) => {
      const it = images[i];
      if (!it) return null;
      return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/95 backdrop-blur p-3", children: [
        /* @__PURE__ */ jsx(GalleryDetails, { item: it, canEdit: isAdmin || it.uploaded_by === user?.id }),
        /* @__PURE__ */ jsx(LikeCommentBar, { item: it, onToggleLike: toggleLike }),
        /* @__PURE__ */ jsx(GalleryComments, { item: it })
      ] });
    } })
  ] });
}
function LikeCommentBar({
  item,
  onToggleLike,
  onToggleComments,
  showComments
}) {
  const {
    user
  } = useAuth();
  const liked = !!user && (item.gallery_likes ?? []).some((l) => l.user_id === user.id);
  const likeCount = item.gallery_likes?.length ?? 0;
  const commentCount = item.gallery_comments?.length ?? 0;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5 px-1 py-1", children: [
    /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => onToggleLike(item.id, liked), className: `flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`, children: [
      /* @__PURE__ */ jsx(Heart, { className: `h-5 w-5 ${liked ? "fill-rose-500" : ""}` }),
      likeCount,
      " ",
      liked ? "Liked" : "Like"
    ] }),
    /* @__PURE__ */ jsxs("button", { type: "button", onClick: onToggleComments, className: `flex items-center gap-1.5 text-sm font-semibold transition-colors ${showComments ? "text-amber-600" : "text-gray-400 hover:text-amber-500"}`, children: [
      /* @__PURE__ */ jsx(MessageCircle, { className: "h-5 w-5" }),
      commentCount,
      " ",
      commentCount === 1 ? "Comment" : "Comments"
    ] })
  ] });
}
function GalleryComments({
  item
}) {
  const {
    user,
    isApproved,
    isAdmin
  } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const comments = item.gallery_comments ?? [];
  const add = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addGalleryComment({
        data: {
          galleryItemId: item.id,
          comment: text
        }
      });
      setText("");
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };
  const onDeleteComment = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteGalleryComment({
        data: {
          id
        }
      });
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "px-1 pt-2 space-y-2", children: [
    comments.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto bg-amber-50/60 rounded-xl p-2", children: comments.map((c) => /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-amber-100", children: [
      /* @__PURE__ */ jsxs("p", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-gray-800", children: [
          c.profiles?.full_name ?? "Member",
          ": "
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: c.comment })
      ] }),
      (isAdmin || c.user_id === user?.id) && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onDeleteComment(c.id), "aria-label": "Delete comment", className: "text-gray-300 hover:text-red-600 transition-colors shrink-0", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
    ] }, c.id)) }),
    !user && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 px-1", children: "Please sign in to comment." }),
    user && !isApproved && !isAdmin && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 px-1", children: "Admin approval required to comment." }),
    user && (isApproved || isAdmin) && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(Input, { value: text, onChange: (e) => setText(e.target.value), onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && add(), placeholder: "Write a comment…", className: "h-10 text-sm rounded-xl border-amber-200" }),
      /* @__PURE__ */ jsx(Button, { onClick: add, disabled: sending || !text.trim(), className: "h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-3", children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }) })
    ] })
  ] });
}
function GalleryDetails({
  item,
  canEdit
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [location, setLocation] = useState(item.location ?? "");
  const [takenDate, setTakenDate] = useState(item.taken_date ? item.taken_date.slice(0, 10) : "");
  const [people, setPeople] = useState(item.people ?? "");
  const [saving, setSaving] = useState(false);
  const hasDetails = item.title || item.caption || item.location || item.taken_date || item.people;
  const startEdit = () => {
    setTitle(item.title ?? "");
    setCaption(item.caption ?? "");
    setLocation(item.location ?? "");
    setTakenDate(item.taken_date ? item.taken_date.slice(0, 10) : "");
    setPeople(item.people ?? "");
    setEditing(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      await editGalleryItem({
        data: {
          id: item.id,
          title: title || void 0,
          caption: caption || void 0,
          location: location || void 0,
          takenDate: takenDate || void 0,
          people: people || void 0
        }
      });
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
      setEditing(false);
      toast.success("Details updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update details");
    } finally {
      setSaving(false);
    }
  };
  if (editing) {
    return /* @__PURE__ */ jsxs("div", { className: "px-1 pb-2 space-y-2", children: [
      /* @__PURE__ */ jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Title", className: "h-9 text-sm border-amber-200" }),
      /* @__PURE__ */ jsx(Input, { value: caption, onChange: (e) => setCaption(e.target.value), placeholder: "Description / memory note", className: "h-9 text-sm border-amber-200" }),
      /* @__PURE__ */ jsx(Input, { value: location, onChange: (e) => setLocation(e.target.value), placeholder: "Place / location", className: "h-9 text-sm border-amber-200" }),
      /* @__PURE__ */ jsx(Input, { type: "date", value: takenDate, onChange: (e) => setTakenDate(e.target.value), className: "h-9 text-sm border-amber-200" }),
      /* @__PURE__ */ jsx(Input, { value: people, onChange: (e) => setPeople(e.target.value), placeholder: "People in photo", className: "h-9 text-sm border-amber-200" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", onClick: save, disabled: saving, className: "h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-4 text-sm", children: saving ? "Saving…" : "Save" }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setEditing(false), disabled: saving, className: "h-9 rounded-xl px-4 text-sm", children: "Cancel" })
      ] })
    ] });
  }
  if (!hasDetails && !canEdit) return null;
  return /* @__PURE__ */ jsxs("div", { className: "px-1 pb-1", children: [
    item.title && /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-gray-800", children: item.title }),
    item.caption && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: item.caption }),
    (item.location || item.taken_date || item.people) && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500", children: [
      item.location && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5 text-amber-500" }),
        " Taken at: ",
        item.location
      ] }),
      item.taken_date && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5 text-amber-500" }),
        " Date: ",
        item.taken_date.slice(0, 10)
      ] }),
      item.people && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(Users, { className: "h-3.5 w-3.5 text-amber-500" }),
        " With: ",
        item.people
      ] })
    ] }),
    canEdit && /* @__PURE__ */ jsxs("button", { type: "button", onClick: startEdit, className: "inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold mt-1.5", children: [
      /* @__PURE__ */ jsx(Pencil, { className: "h-3 w-3" }),
      " Edit details"
    ] })
  ] });
}
function GalleryItem({
  item,
  onOpen,
  canDelete,
  onDelete,
  onToggleLike
}) {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const isVideo = item.media_type === "video";
  const fileAvailable = item.file_available && !!item.file_url;
  const canReplace = canDelete;
  const onReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setReplacing(true);
    try {
      const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
      const {
        url,
        path
      } = await uploadToFirebaseStorageResumable(compressed, "gallery", user.id);
      await replaceGalleryItemFile({
        data: {
          id: item.id,
          url,
          storagePath: path,
          fileName: compressed.name,
          mimeType: compressed.type,
          fileSize: compressed.size
        }
      });
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
      toast.success("File replaced");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Replace failed");
    } finally {
      setReplacing(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-shadow group", children: [
    canDelete && /* @__PURE__ */ jsx("button", { type: "button", onClick: onDelete, "aria-label": "Delete item", className: "absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsx("div", { className: `${isVideo ? "aspect-video" : "aspect-square"} bg-amber-50 flex items-center justify-center`, children: !fileAvailable ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-2 text-center px-3 text-gray-400", children: [
      /* @__PURE__ */ jsx(ImageOff, { className: "h-8 w-8" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium", children: "Old photo file missing. Please re-upload this image." }),
      canReplace && /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: `h-3.5 w-3.5 ${replacing ? "animate-spin" : ""}` }),
        replacing ? "Uploading…" : "Replace file",
        /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*,video/*", className: "hidden", disabled: replacing, onChange: onReplaceFile })
      ] })
    ] }) : isVideo ? /* @__PURE__ */ jsx("video", { src: item.file_url, controls: true, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("button", { type: "button", onClick: onOpen, "aria-label": `Enlarge ${item.caption ?? "photo"}`, className: "block w-full h-full cursor-zoom-in", children: /* @__PURE__ */ jsx("img", { src: item.file_url, alt: item.caption ?? "Photo", className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", loading: "lazy" }) }) }),
    /* @__PURE__ */ jsx("div", { className: "px-3 pt-3", children: /* @__PURE__ */ jsx(GalleryDetails, { item, canEdit: canDelete }) }),
    /* @__PURE__ */ jsxs("div", { className: "px-2 pb-2 pt-1 border-t border-amber-50 mt-2", children: [
      /* @__PURE__ */ jsx(LikeCommentBar, { item, onToggleLike, showComments, onToggleComments: () => setShowComments((v) => !v) }),
      showComments && /* @__PURE__ */ jsx(GalleryComments, { item })
    ] })
  ] });
}
export {
  Gallery as component
};
