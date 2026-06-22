import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getBlog, deleteBlog, toggleBlogLike, addBlogComment, setBlogFeatured, setBlogPublished, updateBlog, type BlogCategory } from "@/api/blogs";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Heart, MessageCircle, Send, Star, EyeOff, Eye, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CATEGORIES, SAMPLE_BLOGS } from "./blogs";
import { Linkify } from "@/lib/linkify";

export const Route = createFileRoute("/_authenticated/blogs/$id")({
  head: () => ({ meta: [{ title: "Blog — SIMCOSA 84–85" }] }),
  component: BlogDetail,
});

function BlogDetail() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ title: string; content: string; excerpt: string; category: BlogCategory } | null>(null);
  const [saving, setSaving] = useState(false);

  const sample = SAMPLE_BLOGS.find(b => b.id === id);

  const { data: blog } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => getBlog({ data: { id } }),
    enabled: !sample,
  });

  if (sample) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
          <Link to="/blogs" className="inline-flex items-center gap-2 text-amber-600 font-bold text-sm mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="h-4 w-4" /> Back to Blogs
          </Link>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 mb-3">
            {CATEGORIES.find(c => c.value === sample.category)?.label}
          </span>
          <h1>{sample.title}</h1>
          <p className="text-gray-500 mt-2">{sample.author} · {format(new Date(sample.created_at), "PPP")}</p>
          <p className="text-gray-700 leading-relaxed mt-6 text-lg"><Linkify text={sample.content} /></p>
        </div>
      </div>
    );
  }

  if (blog === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-400">Loading…</div>;
  }
  if (blog === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2>Blog not found</h2>
        <Link to="/blogs"><Button className="mt-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl h-12 px-6">Back to Blogs</Button></Link>
      </div>
    );
  }

  const isOwner = user?.id === blog.author_id;
  const liked = blog.blog_likes.some(l => l.user_id === user!.id);

  const onLike = async () => {
    try {
      await toggleBlogLike({ data: { blogId: blog.id, liked } });
      qc.invalidateQueries({ queryKey: ["blog", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const onComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await addBlogComment({ data: { blogId: blog.id, body: comment } });
      setComment("");
      qc.invalidateQueries({ queryKey: ["blog", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this blog? This cannot be undone.")) return;
    try {
      await deleteBlog({ data: { id: blog.id } });
      toast.success("Blog deleted");
      navigate({ to: "/blogs" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const onToggleFeature = async () => {
    try {
      await setBlogFeatured({ data: { id: blog.id, featured: !blog.is_featured } });
      qc.invalidateQueries({ queryKey: ["blog", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const onTogglePublished = async () => {
    try {
      await setBlogPublished({ data: { id: blog.id, published: !blog.is_published } });
      qc.invalidateQueries({ queryKey: ["blog", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const startEditing = () => {
    setEditForm({ title: blog.title, content: blog.content, excerpt: blog.excerpt ?? "", category: blog.category });
    setEditing(true);
  };

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    try {
      await updateBlog({ data: { id: blog.id, ...editForm } });
      toast.success("Blog updated");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["blog", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Link to="/blogs" className="inline-flex items-center gap-2 text-amber-600 font-bold text-sm mb-6 hover:gap-3 transition-all">
          <ArrowLeft className="h-4 w-4" /> Back to Blogs
        </Link>

        {blog.image_url && (
          <div className="rounded-2xl overflow-hidden border border-amber-100 mb-6">
            <img src={blog.image_url} alt={blog.title} className="w-full max-h-96 object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
            {CATEGORIES.find(c => c.value === blog.category)?.label}
          </span>
          {blog.is_featured && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
              <Star className="h-3 w-3 fill-yellow-600" /> Featured
            </span>
          )}
          {!blog.is_published && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Hidden</span>
          )}
        </div>

        <h1>{blog.title}</h1>
        <p className="text-gray-500 mt-2">
          {blog.profiles?.full_name ?? "A Batchmate"} · {format(new Date(blog.created_at), "PPP")}
        </p>

        {editing && editForm ? (
          <form onSubmit={onSaveEdit} className="mt-6 bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-gray-700">Title *</Label>
                <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required className="h-12 mt-1 border-amber-200 rounded-xl" />
              </div>
              <div>
                <Label className="font-semibold text-gray-700">Category *</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v as BlogCategory })}>
                  <SelectTrigger className="h-12 mt-1 border-amber-200 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="font-semibold text-gray-700">Short excerpt</Label>
              <Input value={editForm.excerpt} onChange={e => setEditForm({ ...editForm, excerpt: e.target.value })} className="h-12 mt-1 border-amber-200 rounded-xl" />
            </div>
            <div>
              <Label className="font-semibold text-gray-700">Content *</Label>
              <Textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} required rows={6} className="text-base mt-1 border-amber-200 rounded-xl resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-8">
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-gray-700 leading-relaxed mt-6 text-lg"><Linkify text={blog.content} /></p>
        )}

        {/* Owner / admin actions */}
        {(isOwner || isAdmin) && !editing && (
          <div className="flex items-center gap-3 flex-wrap mt-6 pt-6 border-t border-amber-100">
            {isOwner && (
              <Button variant="outline" onClick={startEditing} className="border-amber-200 text-amber-700 rounded-xl">
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" onClick={onToggleFeature} className="border-amber-200 text-amber-700 rounded-xl">
                <Star className="h-4 w-4 mr-2" /> {blog.is_featured ? "Unfeature" : "Feature"}
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" onClick={onTogglePublished} className="border-amber-200 text-amber-700 rounded-xl">
                {blog.is_published ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {blog.is_published ? "Hide" : "Unhide"}
              </Button>
            )}
            <Button variant="outline" onClick={onDelete} className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        )}

        {/* Like bar */}
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-amber-100">
          <button
            onClick={onLike}
            aria-label={liked ? "Unlike this blog" : "Like this blog"}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-rose-500" : ""}`} />
            {blog.blog_likes.length} {liked ? "Liked" : "Like"}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <MessageCircle className="h-5 w-5" />
            {blog.blog_comments.length} Comments
          </span>
        </div>

        {/* Comments */}
        <div className="mt-6 space-y-3">
          {blog.blog_comments.length > 0 && (
            <div className="space-y-2 bg-amber-50/60 rounded-xl p-3">
              {blog.blog_comments.map(c => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-amber-100 text-amber-700">
                    {(c.profiles?.full_name ?? "M").charAt(0)}
                  </div>
                  <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-amber-100">
                    <span className="font-bold text-gray-800">{c.profiles?.full_name ?? "Member"}: </span>
                    <span className="text-gray-600">{c.body}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && onComment()}
              placeholder="Write a comment…"
              aria-label="Write a comment"
              className="h-11 text-sm rounded-xl border-amber-200"
            />
            <Button onClick={onComment} disabled={sending || !comment.trim()} className="h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
