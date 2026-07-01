import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ArrowLeft, Briefcase, MapPin, Mail, Phone, MessageCircle, Star, Heart, Users, Smile, BookOpen, Camera, Film, FileText, Plus, Eye, EyeOff, Check, Pencil, Trash2 } from "lucide-react";
import { c as createSsrRpc, R as Route, u as useAuth } from "./router-CxW41eXB.js";
import { r as requireApproved, b as requireAdmin } from "./middleware-DcrzD3h4.js";
import { c as createServerFn } from "./server-Dnlq8-1X.js";
import { I as ImageLightbox } from "./ImageLightbox-Dt94sEvv.js";
import { u as useUploadQueue, D as DropzoneUpload, d as deleteFromFirebaseStorage, c as compressImage, a as uploadToFirebaseStorageResumable } from "./useUploadQueue-D5V0zfB_.js";
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
import "firebase/storage";
const getMemberBySlug = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("ee27abc08ddb6ca4ce8d58fededf9321cdf198a2e4ae472865b426d862734fc4"));
const listMemberBlogItems = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("50bcd0f2b5eb3da7c3b0be35c6d0c3dd3d4d77f7930d18737dd2ed3d31fe0852"));
const addMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("f8f0784d737eb9c9ea3872ddd172ac0928f9523920ac9490de11836707ed8640"));
const editMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("b97dd90213707117aff72b2f21486f25f4378626d3eb755a9540a2a245c5adee"));
const deleteMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("444acdbddaa9000a21e1ea734b2985e61e85e80a3462221a57aaefa739c4f00f"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).handler(createSsrRpc("2e0a2b0b3c1a0cb19388f76deab7d3d3dba6e24e479e4dc10141d5df69aa7602"));
createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("33e0fefb67e0ee3425222e652505be3b239fe01f5cdbc7b34ce03bc031c569e6"));
const TABS = [{
  key: "about",
  label: "About",
  icon: Star
}, {
  key: "memories",
  label: "Memories",
  icon: Heart
}, {
  key: "travel",
  label: "Travel",
  icon: MapPin
}, {
  key: "friends",
  label: "Friends",
  icon: Users
}, {
  key: "family",
  label: "Family",
  icon: Smile
}, {
  key: "poems",
  label: "Poems",
  icon: BookOpen
}, {
  key: "thoughts",
  label: "Thoughts",
  icon: Star
}, {
  key: "photos",
  label: "Photos",
  icon: Camera
}, {
  key: "videos",
  label: "Videos",
  icon: Film
}, {
  key: "files",
  label: "Files",
  icon: FileText
}];
const PHOTO_ACCEPT = "image/*";
const VIDEO_ACCEPT = "video/*";
const FILE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip";
function tabAccept(tab) {
  if (tab === "photos") return PHOTO_ACCEPT;
  if (tab === "videos") return VIDEO_ACCEPT;
  if (tab === "files") return FILE_ACCEPT;
  return PHOTO_ACCEPT;
}
function tabAllowsText(tab) {
  return ["memories", "travel", "friends", "family", "poems", "thoughts"].includes(tab);
}
function tabAllowsFile(tab) {
  return ["photos", "videos", "files", "memories", "travel", "friends", "family"].includes(tab);
}
function attachmentType(tab) {
  if (tab === "photos") return "photo";
  if (tab === "videos") return "video";
  if (tab === "files") return "file";
  return "photo";
}
function ItemForm({
  memberId,
  tab,
  existing,
  onDone
}) {
  const qc = useQueryClient();
  const {
    user
  } = useAuth();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [files, setFiles] = useState([]);
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? true);
  const uploadQueue = useUploadQueue();
  const [saving, setSaving] = useState(false);
  const addMutation = useMutation({
    mutationFn: (d) => addMemberBlogItem({
      data: d
    })
  });
  const editMutation = useMutation({
    mutationFn: (d) => editMemberBlogItem({
      data: d
    })
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (tab !== "about" && !body.trim() && files.length === 0 && !existing?.file_url) {
      toast.error("Add some content or upload a file.");
      return;
    }
    setSaving(true);
    try {
      let filePayload = {};
      if (files.length > 0) {
        const file = files[0];
        const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
        uploadQueue.init([file]);
        uploadQueue.setStatus(file, "uploading");
        const result = await uploadToFirebaseStorageResumable(compressed, `member-blogs/${memberId}`, user.id, (pct) => uploadQueue.setPct(file, pct));
        uploadQueue.setStatus(file, "completed");
        filePayload = {
          file_url: result.url,
          fb_storage_path: result.path,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          attachment_type: attachmentType(tab)
        };
      }
      if (existing) {
        await editMutation.mutateAsync({
          id: existing.id,
          title: title || null,
          body: body || null,
          is_published: isPublished,
          ...filePayload
        });
        toast.success("Updated!");
      } else {
        await addMutation.mutateAsync({
          member_id: memberId,
          category: tab,
          title: title || void 0,
          body: body || void 0,
          is_published: isPublished,
          ...filePayload
        });
        toast.success("Added!");
      }
      qc.invalidateQueries({
        queryKey: ["member-blog", memberId]
      });
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
      uploadQueue.reset();
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 bg-white rounded-2xl border border-amber-100 shadow-sm p-5", children: [
    tabAllowsText(tab) && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Title (optional)", className: "w-full rounded-xl border border-amber-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" }),
      /* @__PURE__ */ jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), placeholder: tab === "poems" ? "Write your poem here…" : tab === "thoughts" ? "Share your thoughts…" : "Write something…", rows: 5, className: "w-full rounded-xl border border-amber-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" })
    ] }),
    tabAllowsFile(tab) && !existing?.file_url && /* @__PURE__ */ jsx(DropzoneUpload, { files, onFilesChange: (f) => setFiles(f.slice(0, 1)), accept: tabAccept(tab), multiple: false, disabled: saving, progress: uploadQueue.progress, label: tab === "photos" ? "Upload a photo" : tab === "videos" ? "Upload a video" : tab === "files" ? "Upload a file (PDF, Word, etc.)" : "Attach a photo (optional)" }),
    tab === "photos" && !tabAllowsText(tab) && /* @__PURE__ */ jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Caption (optional)", className: "w-full rounded-xl border border-amber-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-1", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setIsPublished((v) => !v), className: `flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`, children: [
        isPublished ? /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(EyeOff, { className: "h-3.5 w-3.5" }),
        isPublished ? "Visible to members" : "Hidden (draft)"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onDone, disabled: saving, className: "rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-amber-50 transition-colors", children: "Cancel" }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: saving, className: "rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2", children: [
        saving ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
        existing ? "Save" : "Post"
      ] })
    ] })
  ] });
}
function ItemCard({
  item,
  canEdit,
  onEdit,
  onDelete,
  onImageClick
}) {
  const isImage = item.mime_type?.startsWith("image/") || item.attachment_type === "photo";
  const isVideo = item.mime_type?.startsWith("video/") || item.attachment_type === "video";
  return /* @__PURE__ */ jsxs("div", { className: `bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden ${!item.is_published ? "opacity-60" : ""}`, children: [
    item.file_url && isImage && /* @__PURE__ */ jsx("button", { type: "button", onClick: onImageClick, className: "block w-full cursor-zoom-in", "aria-label": "Enlarge photo", children: /* @__PURE__ */ jsx("img", { src: item.file_url, alt: item.title ?? "Photo", className: "w-full object-cover max-h-72 hover:scale-[1.02] transition-transform duration-300" }) }),
    item.file_url && isVideo && /* @__PURE__ */ jsx("video", { src: item.file_url, controls: true, className: "w-full max-h-72 bg-black" }),
    item.file_url && !isImage && !isVideo && /* @__PURE__ */ jsxs("a", { href: item.file_url, target: "_blank", rel: "noreferrer", className: "flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100 hover:bg-amber-100 transition-colors", children: [
      /* @__PURE__ */ jsx(FileText, { className: "h-5 w-5 text-amber-500 shrink-0" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-gray-700 truncate", children: item.file_name ?? "Download file" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
      item.title && /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900 mb-1", children: item.title }),
      item.body && /* @__PURE__ */ jsx("p", { className: "text-gray-700 text-sm whitespace-pre-wrap", children: item.body }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-3", children: [
        !item.is_published && /* @__PURE__ */ jsx("span", { className: "text-xs rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 font-semibold", children: "Draft" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: new Date(item.created_at).toLocaleDateString() }),
        canEdit && /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onEdit, "aria-label": "Edit", className: "h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors", children: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onDelete, "aria-label": "Delete", className: "h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] })
    ] })
  ] });
}
function PhotoGrid({
  items,
  canEdit,
  onEdit,
  onDelete
}) {
  const [lbIndex, setLbIndex] = useState(null);
  const photos = items.filter((i) => i.file_url && (i.mime_type?.startsWith("image/") || i.attachment_type === "photo"));
  const lbImages = photos.map((i) => ({
    src: i.file_url,
    alt: i.title ?? "Photo",
    caption: i.title ?? void 0
  }));
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2", children: photos.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setLbIndex(idx), className: "block w-full aspect-square overflow-hidden rounded-xl cursor-zoom-in", children: /* @__PURE__ */ jsx("img", { src: item.file_url, alt: item.title ?? "Photo", className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" }) }),
      canEdit && /* @__PURE__ */ jsxs("div", { className: "absolute top-1 right-1 hidden group-hover:flex gap-1", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onEdit(item), className: "h-6 w-6 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:text-amber-600 shadow", children: /* @__PURE__ */ jsx(Pencil, { className: "h-3 w-3" }) }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onDelete(item), className: "h-6 w-6 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:text-red-600 shadow", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }) })
      ] })
    ] }, item.id)) }),
    /* @__PURE__ */ jsx(ImageLightbox, { images: lbImages, index: lbIndex, onClose: () => setLbIndex(null), onIndexChange: setLbIndex })
  ] });
}
function TabContent({
  memberId,
  tab,
  canEdit
}) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [lbIndex, setLbIndex] = useState(null);
  const {
    data: items = [],
    isLoading
  } = useQuery({
    queryKey: ["member-blog", memberId, tab],
    queryFn: () => listMemberBlogItems({
      data: {
        member_id: memberId,
        category: tab
      }
    })
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMemberBlogItem({
      data: {
        id
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["member-blog", memberId]
      });
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed")
  });
  const handleDelete = async (item) => {
    if (!confirm("Delete this item?")) return;
    if (item.fb_storage_path) {
      try {
        await deleteFromFirebaseStorage(item.fb_storage_path);
      } catch {
      }
    }
    deleteMutation.mutate(item.id);
  };
  const imageItems = items.filter((i) => i.file_url && (i.mime_type?.startsWith("image/") || i.attachment_type === "photo"));
  const lbImages = imageItems.map((i) => ({
    src: i.file_url,
    alt: i.title ?? "Photo",
    caption: i.title ?? void 0
  }));
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 gap-4", children: [0, 1].map((i) => /* @__PURE__ */ jsx("div", { className: "h-32 rounded-2xl bg-amber-50 animate-pulse" }, i)) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    canEdit && /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: !showForm && !editItem && /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setShowForm(true), className: "flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-semibold transition-colors", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      tab === "photos" ? "Add Photo" : tab === "videos" ? "Add Video" : tab === "files" ? "Upload File" : "Add Post"
    ] }) }),
    showForm && /* @__PURE__ */ jsx(ItemForm, { memberId, tab, onDone: () => setShowForm(false) }),
    editItem && /* @__PURE__ */ jsx(ItemForm, { memberId, tab, existing: editItem, onDone: () => setEditItem(null) }),
    tab === "photos" ? items.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { tab, canEdit, onAdd: () => setShowForm(true) }) : /* @__PURE__ */ jsx(PhotoGrid, { items, canEdit, onEdit: (item) => setEditItem(item), onDelete: handleDelete }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      items.length === 0 && /* @__PURE__ */ jsx(EmptyState, { tab, canEdit, onAdd: () => setShowForm(true) }),
      /* @__PURE__ */ jsx("div", { className: tab === "videos" ? "space-y-4" : "grid sm:grid-cols-2 gap-4", children: items.map((item) => /* @__PURE__ */ jsx(ItemCard, { item, canEdit, onEdit: () => setEditItem(item), onDelete: () => handleDelete(item), onImageClick: () => setLbIndex(imageItems.findIndex((x) => x.id === item.id)) }, item.id)) })
    ] }),
    tab !== "photos" && /* @__PURE__ */ jsx(ImageLightbox, { images: lbImages, index: lbIndex, onClose: () => setLbIndex(null), onIndexChange: setLbIndex })
  ] });
}
function EmptyState({
  tab,
  canEdit,
  onAdd
}) {
  const msgs = {
    about: "",
    memories: "No memories shared yet.",
    travel: "No travel stories yet.",
    friends: "No friends posts yet.",
    family: "No family posts yet.",
    poems: "No poems posted yet.",
    thoughts: "No thoughts shared yet.",
    photos: "No photos uploaded yet.",
    videos: "No videos uploaded yet.",
    files: "No files shared yet."
  };
  return /* @__PURE__ */ jsxs("div", { className: "text-center py-14", children: [
    /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm", children: msgs[tab] }),
    canEdit && /* @__PURE__ */ jsxs("button", { type: "button", onClick: onAdd, className: "mt-4 flex items-center gap-2 mx-auto rounded-xl border border-amber-300 text-amber-600 hover:bg-amber-50 px-4 py-2 text-sm font-semibold transition-colors", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " Add something"
    ] })
  ] });
}
function MemberBlogPage() {
  const {
    slug
  } = Route.useParams();
  const {
    user,
    isAdmin,
    isOwner
  } = useAuth();
  const [activeTab, setActiveTab] = useState("about");
  const {
    data: member,
    isLoading,
    error
  } = useQuery({
    queryKey: ["member-by-slug", slug],
    queryFn: () => getMemberBySlug({
      data: {
        slug
      }
    })
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-amber-400" }) });
  }
  if (!member) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500", children: [
      /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold", children: "Member not found." }),
      /* @__PURE__ */ jsx(Link, { to: "/directory", className: "text-amber-600 hover:underline text-sm", children: "← Back to Directory" })
    ] });
  }
  const canEdit = !!(user && (user.id === member.id || isAdmin || isOwner));
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-3", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-5xl", children: /* @__PURE__ */ jsxs(Link, { to: "/directory", className: "flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-semibold w-fit", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      "Members Directory"
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-amber-100 px-4 py-8", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl flex flex-col sm:flex-row items-center sm:items-start gap-6", children: [
      member.photo_url ? /* @__PURE__ */ jsx("img", { src: member.photo_url, alt: member.full_name, className: "h-24 w-24 rounded-full object-cover ring-4 ring-amber-200 shrink-0" }) : /* @__PURE__ */ jsx("div", { className: "h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center text-4xl font-bold text-amber-600 shrink-0", children: member.full_name.charAt(0) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 text-center sm:text-left min-w-0", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: member.full_name }),
        member.profession && /* @__PURE__ */ jsxs("p", { className: "flex items-center justify-center sm:justify-start gap-1.5 text-amber-600 font-semibold mt-1", children: [
          /* @__PURE__ */ jsx(Briefcase, { className: "h-4 w-4 shrink-0" }),
          member.profession
        ] }),
        member.location && /* @__PURE__ */ jsxs("p", { className: "flex items-center justify-center sm:justify-start gap-1.5 text-gray-500 text-sm mt-1", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5 shrink-0" }),
          member.location
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center sm:justify-start gap-3 mt-3", children: [
          member.email && /* @__PURE__ */ jsxs("a", { href: `mailto:${member.email}`, className: "flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 transition-colors", children: [
            /* @__PURE__ */ jsx(Mail, { className: "h-3.5 w-3.5" }),
            member.email
          ] }),
          member.phone && /* @__PURE__ */ jsxs("a", { href: `tel:${member.phone}`, className: "flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 transition-colors", children: [
            /* @__PURE__ */ jsx(Phone, { className: "h-3.5 w-3.5" }),
            member.phone
          ] }),
          member.whatsapp && /* @__PURE__ */ jsxs("a", { href: `https://wa.me/${member.whatsapp.replace(/\D/g, "")}`, target: "_blank", rel: "noreferrer", className: "flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors", children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "h-3.5 w-3.5" }),
            "WhatsApp"
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "sticky top-0 z-10 bg-white border-b border-amber-100 shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-5xl px-4 overflow-x-auto", children: /* @__PURE__ */ jsx("div", { className: "flex gap-0 min-w-max", children: TABS.map(({
      key,
      label,
      icon: Icon
    }) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setActiveTab(key), className: `flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === key ? "border-amber-500 text-amber-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`, children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5 shrink-0" }),
      label
    ] }, key)) }) }) }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-5xl px-4 sm:px-6 py-8", children: activeTab === "about" ? /* @__PURE__ */ jsx(AboutTab, { member, canEdit }) : /* @__PURE__ */ jsx(TabContent, { memberId: member.id, tab: activeTab, canEdit }) })
  ] });
}
function AboutTab({
  member,
  canEdit
}) {
  const fields = [{
    label: "Full Name",
    value: member.full_name
  }, {
    label: "Profession",
    value: member.profession
  }, {
    label: "Location",
    value: member.location
  }, {
    label: "Country / State",
    value: member.country_state
  }, {
    label: "Clinic / Hospital",
    value: member.clinic_or_hospital
  }, {
    label: "Spouse",
    value: member.spouse_name
  }, {
    label: "Email",
    value: member.email
  }, {
    label: "Phone",
    value: member.phone
  }, {
    label: "WhatsApp",
    value: member.whatsapp
  }];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    member.bio && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-widest text-amber-500 mb-3", children: "Bio" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-700 whitespace-pre-wrap", children: member.bio })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-widest text-amber-500 mb-4", children: "Details" }),
      /* @__PURE__ */ jsx("dl", { className: "grid sm:grid-cols-2 gap-x-8 gap-y-3", children: fields.map(({
        label,
        value
      }) => value ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wide", children: label }),
        /* @__PURE__ */ jsx("dd", { className: "text-gray-800 text-sm mt-0.5", children: value })
      ] }, label) : null) })
    ] }),
    canEdit && /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-gray-400", children: [
      "To update your profile details, go to ",
      /* @__PURE__ */ jsx(Link, { to: "/profile", className: "text-amber-500 hover:underline", children: "My Profile" }),
      "."
    ] })
  ] });
}
export {
  MemberBlogPage as component
};
