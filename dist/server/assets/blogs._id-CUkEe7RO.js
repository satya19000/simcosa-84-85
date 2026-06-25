import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { g as getBlog, L as Linkify, u as updateBlog, s as setBlogFeatured, a as setBlogPublished, d as deleteBlog, t as toggleBlogLike, b as addBlogComment } from "./linkify-BDF0cRvE.js";
import { R as Route, u as useAuth, S as SAMPLE_BLOGS, C as CATEGORIES, B as Button } from "./router-CiaoHDRh.js";
import { I as Input } from "./input-CdD2gpc1.js";
import { T as Textarea } from "./textarea-DC4uV14G.js";
import { L as Label } from "./label-w7FimGkJ.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CMPrUYev.js";
import { ArrowLeft, Star, Pencil, EyeOff, Eye, Trash2, Heart, MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
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
import "@tanstack/react-router/ssr/server";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
function BlogDetail() {
  const {
    id
  } = Route.useParams();
  const {
    user,
    isAdmin
  } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const sample = SAMPLE_BLOGS.find((b) => b.id === id);
  const {
    data: blog
  } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => getBlog({
      data: {
        id
      }
    }),
    enabled: !sample
  });
  if (sample) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/blogs", className: "inline-flex items-center gap-2 text-amber-600 font-bold text-sm mb-6 hover:gap-3 transition-all", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to Blogs"
      ] }),
      /* @__PURE__ */ jsx("span", { className: "inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 mb-3", children: CATEGORIES.find((c) => c.value === sample.category)?.label }),
      /* @__PURE__ */ jsx("h1", { children: sample.title }),
      /* @__PURE__ */ jsxs("p", { className: "text-gray-500 mt-2", children: [
        sample.author,
        " · ",
        format(new Date(sample.created_at), "PPP")
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-700 leading-relaxed mt-6 text-lg", children: /* @__PURE__ */ jsx(Linkify, { text: sample.content }) })
    ] }) });
  }
  if (blog === void 0) {
    return /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-3xl px-4 py-20 text-center text-gray-400", children: "Loading…" });
  }
  if (blog === null) {
    return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-20 text-center", children: [
      /* @__PURE__ */ jsx("h2", { children: "Blog not found" }),
      /* @__PURE__ */ jsx(Link, { to: "/blogs", children: /* @__PURE__ */ jsx(Button, { className: "mt-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl h-12 px-6", children: "Back to Blogs" }) })
    ] });
  }
  const isOwner = user?.id === blog.author_id;
  const liked = blog.blog_likes.some((l) => l.user_id === user.id);
  const onLike = async () => {
    try {
      await toggleBlogLike({
        data: {
          blogId: blog.id,
          liked
        }
      });
      qc.invalidateQueries({
        queryKey: ["blog", id]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const onComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await addBlogComment({
        data: {
          blogId: blog.id,
          body: comment
        }
      });
      setComment("");
      qc.invalidateQueries({
        queryKey: ["blog", id]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };
  const onDelete = async () => {
    if (!confirm("Delete this blog? This cannot be undone.")) return;
    try {
      await deleteBlog({
        data: {
          id: blog.id
        }
      });
      toast.success("Blog deleted");
      navigate({
        to: "/blogs"
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const onToggleFeature = async () => {
    try {
      await setBlogFeatured({
        data: {
          id: blog.id,
          featured: !blog.is_featured
        }
      });
      qc.invalidateQueries({
        queryKey: ["blog", id]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const onTogglePublished = async () => {
    try {
      await setBlogPublished({
        data: {
          id: blog.id,
          published: !blog.is_published
        }
      });
      qc.invalidateQueries({
        queryKey: ["blog", id]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const startEditing = () => {
    setEditForm({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt ?? "",
      category: blog.category
    });
    setEditing(true);
  };
  const onSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    try {
      await updateBlog({
        data: {
          id: blog.id,
          ...editForm
        }
      });
      toast.success("Blog updated");
      setEditing(false);
      qc.invalidateQueries({
        queryKey: ["blog", id]
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-b from-amber-50/60 to-white", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 sm:px-6 py-8", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/blogs", className: "inline-flex items-center gap-2 text-amber-600 font-bold text-sm mb-6 hover:gap-3 transition-all", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Back to Blogs"
    ] }),
    blog.image_url && /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden border border-amber-100 mb-6", children: /* @__PURE__ */ jsx("img", { src: blog.image_url, alt: blog.title, className: "w-full max-h-96 object-cover" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-3", children: [
      /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700", children: CATEGORIES.find((c) => c.value === blog.category)?.label }),
      blog.is_featured && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-600" }),
        " Featured"
      ] }),
      !blog.is_published && /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500", children: "Hidden" })
    ] }),
    /* @__PURE__ */ jsx("h1", { children: blog.title }),
    /* @__PURE__ */ jsxs("p", { className: "text-gray-500 mt-2", children: [
      blog.profiles?.full_name ?? "A Batchmate",
      " · ",
      format(new Date(blog.created_at), "PPP")
    ] }),
    editing && editForm ? /* @__PURE__ */ jsxs("form", { onSubmit: onSaveEdit, className: "mt-6 bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Title *" }),
          /* @__PURE__ */ jsx(Input, { value: editForm.title, onChange: (e) => setEditForm({
            ...editForm,
            title: e.target.value
          }), required: true, className: "h-12 mt-1 border-amber-200 rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Category *" }),
          /* @__PURE__ */ jsxs(Select, { value: editForm.category, onValueChange: (v) => setEditForm({
            ...editForm,
            category: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-12 mt-1 border-amber-200 rounded-xl", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: CATEGORIES.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c.value, children: c.label }, c.value)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Short excerpt" }),
        /* @__PURE__ */ jsx(Input, { value: editForm.excerpt, onChange: (e) => setEditForm({
          ...editForm,
          excerpt: e.target.value
        }), className: "h-12 mt-1 border-amber-200 rounded-xl" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "font-semibold text-gray-700", children: "Content *" }),
        /* @__PURE__ */ jsx(Textarea, { value: editForm.content, onChange: (e) => setEditForm({
          ...editForm,
          content: e.target.value
        }), required: true, rows: 6, className: "text-base mt-1 border-amber-200 rounded-xl resize-none" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setEditing(false), className: "rounded-xl", children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: saving, className: "bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-8", children: saving ? "Saving…" : "Save Changes" })
      ] })
    ] }) : /* @__PURE__ */ jsx("p", { className: "text-gray-700 leading-relaxed mt-6 text-lg", children: /* @__PURE__ */ jsx(Linkify, { text: blog.content }) }),
    (isOwner || isAdmin) && !editing && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap mt-6 pt-6 border-t border-amber-100", children: [
      isOwner && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: startEditing, className: "border-amber-200 text-amber-700 rounded-xl", children: [
        /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4 mr-2" }),
        " Edit"
      ] }),
      isAdmin && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: onToggleFeature, className: "border-amber-200 text-amber-700 rounded-xl", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 mr-2" }),
        " ",
        blog.is_featured ? "Unfeature" : "Feature"
      ] }),
      isAdmin && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: onTogglePublished, className: "border-amber-200 text-amber-700 rounded-xl", children: [
        blog.is_published ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4 mr-2" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4 mr-2" }),
        blog.is_published ? "Hide" : "Unhide"
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: onDelete, className: "border-red-200 text-red-600 hover:bg-red-50 rounded-xl", children: [
        /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 mr-2" }),
        " Delete"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6 mt-6 pt-6 border-t border-amber-100", children: [
      /* @__PURE__ */ jsxs("button", { onClick: onLike, "aria-label": liked ? "Unlike this blog" : "Like this blog", className: `flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`, children: [
        /* @__PURE__ */ jsx(Heart, { className: `h-5 w-5 ${liked ? "fill-rose-500" : ""}` }),
        blog.blog_likes.length,
        " ",
        liked ? "Liked" : "Like"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-sm text-gray-400", children: [
        /* @__PURE__ */ jsx(MessageCircle, { className: "h-5 w-5" }),
        blog.blog_comments.length,
        " Comments"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-3", children: [
      blog.blog_comments.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-2 bg-amber-50/60 rounded-xl p-3", children: blog.blog_comments.map((c) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-amber-100 text-amber-700", children: (c.profiles?.full_name ?? "M").charAt(0) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white rounded-xl px-3 py-2 border border-amber-100", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-gray-800", children: [
            c.profiles?.full_name ?? "Member",
            ": "
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: c.body })
        ] })
      ] }, c.id)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-1", children: [
        /* @__PURE__ */ jsx(Input, { value: comment, onChange: (e) => setComment(e.target.value), onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && onComment(), placeholder: "Write a comment…", "aria-label": "Write a comment", className: "h-11 text-sm rounded-xl border-amber-200" }),
        /* @__PURE__ */ jsx(Button, { onClick: onComment, disabled: sending || !comment.trim(), className: "h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-4", children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }) })
      ] })
    ] })
  ] }) });
}
export {
  BlogDetail as component
};
