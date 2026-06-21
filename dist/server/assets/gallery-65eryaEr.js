import { jsxs, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { l as listGallery, u as uploadGalleryItem, t as toggleGalleryLike, d as deleteGalleryItem, a as deleteGalleryComment, b as addGalleryComment } from "./gallery-BBEAt57q.js";
import { u as useAuth, B as Button } from "./router-2Ap6QW_Q.js";
import { I as Input } from "./input-vU7p-ajT.js";
import { L as Label } from "./label-Dk8345wm.js";
import { Upload, Image, Film, FileText, Trash2, Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { I as ImageLightbox } from "./ImageLightbox-Dt94sEvv.js";
import { D as DropzoneUpload, c as compressImage, u as uploadToFirebaseStorage, d as deleteFromFirebaseStorage } from "./image-compress-DkoZDrXA.js";
import "./createSsrRpc-Ddo47cL3.js";
import "./server-Bk-SOkRu.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
import "./middleware-CpYjh-aW.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [lb, setLb] = useState(null);
  const {
    data: items
  } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => listGallery()
  });
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
    setUploadProgress({
      done: 0,
      total: files.length
    });
    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (file.type.startsWith("image/")) {
          file = await compressImage(file);
        }
        const {
          url,
          path
        } = await uploadToFirebaseStorage(file, "gallery", user.id);
        await uploadGalleryItem({
          data: {
            url,
            storagePath: path,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            caption: caption || void 0
          }
        });
        setUploadProgress({
          done: i + 1,
          total: files.length
        });
      }
      toast.success(`Uploaded ${files.length} item(s) successfully!`);
      setFiles([]);
      setCaption("");
      setShowUpload(false);
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };
  const images = items?.filter((i) => i.media_type === "image") ?? [];
  const videos = items?.filter((i) => i.media_type === "video") ?? [];
  const documents = items?.filter((i) => i.media_type === "document") ?? [];
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
    src: it.file_url ?? `/api/gallery/${it.id}`,
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
          /* @__PURE__ */ jsx(DropzoneUpload, { files, onFilesChange: setFiles, accept: "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx", disabled: uploading, className: "mt-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "caption", className: "font-semibold text-gray-700", children: "Caption (optional, applied to all)" }),
          /* @__PURE__ */ jsx(Input, { id: "caption", name: "caption", value: caption, onChange: (e) => setCaption(e.target.value), placeholder: "Add a caption…", className: "h-12 mt-1 border-amber-200" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: uploading || files.length === 0, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl shrink-0", children: uploading ? "Uploading…" : `Upload ${files.length > 0 ? files.length + " item(s)" : ""}` }),
          uploadProgress && /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500 font-medium", children: [
            "Uploading ",
            uploadProgress.done,
            "/",
            uploadProgress.total,
            "…"
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 flex-wrap mb-8", children: FILTERS.map((f) => /* @__PURE__ */ jsx("button", { onClick: () => setActiveFilter(f), className: `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeFilter === f ? "bg-amber-500 text-white shadow-sm" : "bg-white text-gray-600 border border-amber-200 hover:border-amber-400 hover:text-amber-700"}`, children: f }, f)) }),
      items?.length === 0 && /* @__PURE__ */ jsxs("div", { children: [
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
          /* @__PURE__ */ jsxs("a", { href: it.file_url ?? `/api/gallery/${it.id}`, target: "_blank", rel: "noreferrer", className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-700 truncate", children: it.caption || it.storage_path }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 truncate", children: it.storage_path })
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
function GalleryItem({
  item,
  onOpen,
  canDelete,
  onDelete,
  onToggleLike
}) {
  const [showComments, setShowComments] = useState(false);
  const url = item.file_url ?? `/api/gallery/${item.id}`;
  const isVideo = item.media_type === "video";
  return /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-shadow group", children: [
    canDelete && /* @__PURE__ */ jsx("button", { type: "button", onClick: onDelete, "aria-label": "Delete item", className: "absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsx("div", { className: `${isVideo ? "aspect-video" : "aspect-square"} bg-amber-50 flex items-center justify-center`, children: isVideo ? /* @__PURE__ */ jsx("video", { src: url, controls: true, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("button", { type: "button", onClick: onOpen, "aria-label": `Enlarge ${item.caption ?? "photo"}`, className: "block w-full h-full cursor-zoom-in", children: /* @__PURE__ */ jsx("img", { src: url, alt: item.caption ?? "Photo", className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", loading: "lazy" }) }) }),
    item.caption && /* @__PURE__ */ jsx("p", { className: "px-3 pt-3 text-sm text-gray-600 font-medium", children: item.caption }),
    /* @__PURE__ */ jsxs("div", { className: "px-2 pb-2 pt-1 border-t border-amber-50 mt-2", children: [
      /* @__PURE__ */ jsx(LikeCommentBar, { item, onToggleLike, showComments, onToggleComments: () => setShowComments((v) => !v) }),
      showComments && /* @__PURE__ */ jsx(GalleryComments, { item })
    ] })
  ] });
}
export {
  Gallery as component
};
