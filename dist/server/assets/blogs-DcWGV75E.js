import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { l as listBlogs, c as createBlog } from "./blogs-CvaUepxB.js";
import { u as useAuth, B as Button, C as CATEGORIES, S as SAMPLE_BLOGS } from "./router-CBd90zdT.js";
import { I as Input } from "./input-C577VKKH.js";
import { L as Label } from "./label-_i8jGqrD.js";
import { T as Textarea } from "./textarea-Czq13ejP.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DtiatUKQ.js";
import { PenLine, BookOpen, ArrowRight, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { u as useUploadQueue, D as DropzoneUpload, c as compressImage, a as uploadToFirebaseStorageResumable } from "./useUploadQueue-gqchMW3s.js";
import "./middleware-kw9m56U6.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
import "./server-BQd5bh2q.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
import "firebase/storage";
const ALLOWED_IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_UPLOAD_MB = 15;
function Blogs() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [category, setCategory] = useState("general");
  const [coverFiles, setCoverFiles] = useState([]);
  const uploadQueue = useUploadQueue();
  const {
    data: blogs
  } = useQuery({
    queryKey: ["blogs", activeCategory],
    queryFn: () => listBlogs({
      data: activeCategory === "all" ? void 0 : {
        category: activeCategory
      }
    })
  });
  const onPublish = async (e) => {
    e.preventDefault();
    if (!user) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    let file = coverFiles[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        toast.error("Unsupported image format. Please use JPG, PNG, or WEBP.");
        return;
      }
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast.error(`File is too large. Maximum size is ${MAX_UPLOAD_MB}MB.`);
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
        uploaded = await uploadToFirebaseStorageResumable(file, "blog-images", user.id, (pct) => uploadQueue.setPct(original, pct));
        uploadQueue.setStatus(original, "completed", 100);
      }
      await createBlog({
        data: {
          title: String(fd.get("title") || ""),
          content: String(fd.get("content") || ""),
          excerpt: String(fd.get("excerpt") || "") || void 0,
          category,
          url: uploaded?.url,
          storagePath: uploaded?.path,
          fileName: file?.name,
          mimeType: file?.type,
          fileSize: file?.size
        }
      });
      form.reset();
      setCategory("general");
      setCoverFiles([]);
      setShowForm(false);
      uploadQueue.reset();
      toast.success("Upload completed successfully. Your blog has been published! 📝");
      qc.invalidateQueries({
        queryKey: ["blogs"]
      });
    } catch (err) {
      if (original) uploadQueue.setStatus(original, "error");
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setPosting(false);
    }
  };
  const showSamples = (blogs?.length ?? 0) === 0;
  const categoryLabel = (c) => CATEGORIES.find((x) => x.value === c)?.label ?? c;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white border-b border-amber-100 px-4 py-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-end justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-amber-600 font-bold text-sm uppercase tracking-widest mb-2", children: "Batch Voices" }),
          /* @__PURE__ */ jsx("h1", { children: "SIMCOSA Blogs" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-2 text-lg", children: "Share opinions, poems, articles and thoughts from our batchmates." })
        ] }),
        user && /* @__PURE__ */ jsxs(Button, { onClick: () => setShowForm((v) => !v), className: "bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 h-12 rounded-xl shrink-0", children: [
          /* @__PURE__ */ jsx(PenLine, { className: "h-5 w-5 mr-2" }),
          " Write a Blog"
        ] })
      ] }),
      showForm && /* @__PURE__ */ jsxs("form", { onSubmit: onPublish, className: "mx-auto max-w-6xl mt-6 bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "title", className: "font-semibold text-gray-700", children: "Title *" }),
            /* @__PURE__ */ jsx(Input, { id: "title", name: "title", required: true, placeholder: "Give your blog a title…", className: "h-12 mt-1 border-amber-200 rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Category *" }),
            /* @__PURE__ */ jsxs(Select, { value: category, onValueChange: (v) => setCategory(v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "h-12 mt-1 border-amber-200 rounded-xl", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: CATEGORIES.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c.value, children: c.label }, c.value)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "excerpt", className: "font-semibold text-gray-700", children: "Short excerpt (optional)" }),
          /* @__PURE__ */ jsx(Input, { id: "excerpt", name: "excerpt", placeholder: "A one-line summary shown on the blog card…", className: "h-12 mt-1 border-amber-200 rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "content", className: "font-semibold text-gray-700", children: "Content *" }),
          /* @__PURE__ */ jsx(Textarea, { id: "content", name: "content", required: true, rows: 6, placeholder: "Write your blog…", className: "text-base mt-1 border-amber-200 rounded-xl resize-none" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Cover image (optional)" }),
          /* @__PURE__ */ jsx(DropzoneUpload, { files: coverFiles, onFilesChange: setCoverFiles, accept: "image/*", multiple: false, disabled: posting, className: "mt-1", progress: uploadQueue.progress })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-4", children: [
          posting && coverFiles.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-amber-700 font-semibold", children: "Uploading… please wait" }),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: posting, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl", children: posting ? "Publishing…" : "Publish" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-8", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setActiveCategory("all"), className: `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeCategory === "all" ? "bg-amber-500 text-white shadow-sm" : "bg-white text-gray-600 border border-amber-200 hover:border-amber-400 hover:text-amber-700"}`, children: "All" }),
        CATEGORIES.map((c) => /* @__PURE__ */ jsx("button", { onClick: () => setActiveCategory(c.value), className: `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeCategory === c.value ? "bg-amber-500 text-white shadow-sm" : "bg-white text-gray-600 border border-amber-200 hover:border-amber-400 hover:text-amber-700"}`, children: c.label }, c.value))
      ] }),
      showSamples ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "h-5 w-5 text-amber-500" }),
          /* @__PURE__ */ jsx("h3", { className: "font-display font-bold text-gray-700", children: "Sample Blogs" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: "(write your own above!)" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5", children: SAMPLE_BLOGS.filter((b) => activeCategory === "all" || b.category === activeCategory).map((b) => /* @__PURE__ */ jsx("article", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden flex flex-col", children: /* @__PURE__ */ jsxs("div", { className: "p-6 flex-1 flex flex-col", children: [
          /* @__PURE__ */ jsx("span", { className: "self-start px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 mb-3", children: categoryLabel(b.category) }),
          /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900 mb-2", children: b.title }),
          /* @__PURE__ */ jsxs("p", { className: "text-gray-500 text-sm mb-1", children: [
            b.author,
            " · ",
            format(new Date(b.created_at), "PPP")
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 leading-relaxed mt-2 flex-1", children: b.excerpt }),
          /* @__PURE__ */ jsxs(Link, { to: "/blogs/$id", params: {
            id: b.id
          }, className: "mt-4 inline-flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all", children: [
            "Read More ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ] })
        ] }) }, b.id)) })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5", children: blogs?.map((b) => /* @__PURE__ */ jsxs("article", { className: "bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden flex flex-col", children: [
        b.image_url && /* @__PURE__ */ jsx("div", { className: "aspect-video bg-amber-50", children: /* @__PURE__ */ jsx("img", { src: b.image_url, alt: b.title, className: "w-full h-full object-cover", loading: "lazy" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 flex-1 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 flex-wrap", children: [
            /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700", children: categoryLabel(b.category) }),
            b.is_featured && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-600" }),
              " Featured"
            ] }),
            !b.is_published && /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500", children: "Hidden" })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold text-gray-900 mb-2", children: b.title }),
          /* @__PURE__ */ jsxs("p", { className: "text-gray-500 text-sm mb-1", children: [
            b.profiles?.full_name ?? "A Batchmate",
            " · ",
            format(new Date(b.created_at), "PPP")
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 leading-relaxed mt-2 flex-1", children: b.excerpt }),
          /* @__PURE__ */ jsxs(Link, { to: "/blogs/$id", params: {
            id: b.id
          }, className: "mt-4 inline-flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all", children: [
            "Read More ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ] })
        ] })
      ] }, b.id)) })
    ] })
  ] });
}
export {
  Blogs as component
};
