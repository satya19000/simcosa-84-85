import { jsxs, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { c as createSsrRpc } from "./createSsrRpc-FPjj_8jQ.js";
import { r as requireAuth } from "./middleware-D7ktv78M.js";
import { c as createServerFn } from "./server-DU9y0RcP.js";
import { u as useAuth, B as Button } from "./router-CtQcOegp.js";
import { I as Input } from "./input-CkiUYRF6.js";
import { L as Label } from "./label-D2iUUbXS.js";
import { Upload, Image, Film } from "lucide-react";
import { toast } from "sonner";
import { I as ImageLightbox } from "./ImageLightbox-DxOfaZqk.js";
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
const listGallery = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("ed01fb10c2765f96827b4840cbb8c2b27108f6ad8d25060fc53d08de0bf38c9d"));
const uploadGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createSsrRpc("99da4081e401e388a612265a7617d134a407e27c1d3a1e0ec44e469483df93a7"));
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
function Gallery() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
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
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!file || !user) return;
    setUploading(true);
    try {
      await uploadGalleryItem({
        data: fd
      });
      toast.success("Uploaded successfully!");
      form.reset();
      setShowUpload(false);
      qc.invalidateQueries({
        queryKey: ["gallery"]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const images = items?.filter((i) => i.media_type === "image") ?? [];
  const videos = items?.filter((i) => i.media_type === "video") ?? [];
  const uploadedImages = images.map((it) => ({
    src: `/api/gallery/${it.id}`,
    alt: it.caption ?? "Photo",
    caption: it.caption ?? void 0
  }));
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
      showUpload && /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl mt-6", children: /* @__PURE__ */ jsxs("form", { onSubmit, className: "bg-amber-50 rounded-2xl border border-amber-200 p-5 flex flex-col sm:flex-row gap-3 items-end", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 w-full", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "file", className: "font-semibold text-gray-700", children: "Choose a photo or video" }),
          /* @__PURE__ */ jsx(Input, { id: "file", name: "file", type: "file", accept: "image/*,video/*", required: true, className: "h-12 mt-1 border-amber-200" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 w-full", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "caption", className: "font-semibold text-gray-700", children: "Caption (optional)" }),
          /* @__PURE__ */ jsx(Input, { id: "caption", name: "caption", placeholder: "Add a caption…", className: "h-12 mt-1 border-amber-200" })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: uploading, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl shrink-0", children: uploading ? "Uploading…" : "Upload" })
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
        }) }, it.id)) })
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
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: videos.map((it) => /* @__PURE__ */ jsx(GalleryItem, { item: it }, it.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(ImageLightbox, { images: lb?.images ?? [], index: lb?.index ?? null, onClose: () => setLb(null), onIndexChange: (i) => setLb((s) => s ? {
      ...s,
      index: i
    } : s) })
  ] });
}
function GalleryItem({
  item,
  onOpen
}) {
  const url = `/api/gallery/${item.id}`;
  const isVideo = item.media_type === "video";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-shadow group", children: [
    /* @__PURE__ */ jsx("div", { className: `${isVideo ? "aspect-video" : "aspect-square"} bg-amber-50 flex items-center justify-center`, children: isVideo ? /* @__PURE__ */ jsx("video", { src: url, controls: true, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("button", { type: "button", onClick: onOpen, "aria-label": `Enlarge ${item.caption ?? "photo"}`, className: "block w-full h-full cursor-zoom-in", children: /* @__PURE__ */ jsx("img", { src: url, alt: item.caption ?? "Photo", className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", loading: "lazy" }) }) }),
    item.caption && /* @__PURE__ */ jsx("p", { className: "p-3 text-sm text-gray-600 font-medium", children: item.caption })
  ] });
}
export {
  Gallery as component
};
