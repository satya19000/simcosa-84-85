import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listMemories, postMemory, toggleLike as toggleLikeFn, addComment, deleteMemory, deleteComment } from "@/api/memories";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, BookOpen, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ImageLightbox, type LightboxImage } from "@/components/ImageLightbox";
import { DropzoneUpload } from "@/components/DropzoneUpload";
import { uploadToFirebaseStorageResumable, deleteFromFirebaseStorage } from "@/lib/storage";
import { compressImage } from "@/lib/image-compress";
import { useUploadQueue } from "@/hooks/useUploadQueue";

const ALLOWED_MEMORY_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_MEMORY_UPLOAD_MB = 15;

export const Route = createFileRoute("/_authenticated/memories")({
  head: () => ({ meta: [{ title: "Memories Wall — SIMCOSA 84–85" }] }),
  component: Memories,
});

const AVATAR_COLORS = [
  "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700",
  "bg-purple-100 text-purple-700",
];

function Memories() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [posting, setPosting] = useState(false);
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const uploadQueue = useUploadQueue();

  const { data: memories } = useQuery({
    queryKey: ["memories"],
    queryFn: () => listMemories(),
  });

  const photoMemories = (memories ?? []).filter((m) => !!m.image_url);
  const lightboxImages: LightboxImage[] = photoMemories.map((m) => ({
    src: m.image_url as string,
    alt: m.title ?? m.profiles?.full_name ?? "Memory photo",
    caption: m.title ?? (m.profiles?.full_name ? `Shared by ${m.profiles.full_name}` : undefined),
  }));

  const onPost = async (e: React.FormEvent<HTMLFormElement>) => {
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
      let uploaded: { url: string; path: string } | null = null;
      if (file) {
        uploadQueue.setStatus(original!, "uploading", 0);
        file = await compressImage(file);
        uploaded = await uploadToFirebaseStorageResumable(file, "memories", user.id, (pct) =>
          uploadQueue.setPct(original!, pct),
        );
        uploadQueue.setStatus(original!, "completed", 100);
      }
      await postMemory({
        data: {
          title: title || undefined,
          body,
          url: uploaded?.url,
          storagePath: uploaded?.path,
          fileName: file?.name,
          mimeType: file?.type,
          fileSize: file?.size,
        },
      });
      form.reset();
      setPhotoFiles([]);
      uploadQueue.reset();
      toast.success("Upload completed successfully. Your memory has been shared! 💛");
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      if (original) uploadQueue.setStatus(original, "error");
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (mid: string, liked: boolean) => {
    try {
      await toggleLikeFn({ data: { memoryId: mid, liked } });
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const onDeleteMemory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await deleteMemory({ data: { id } });
      toast.success("Memory deleted");
      qc.invalidateQueries({ queryKey: ["memories"] });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) =>
          console.error("[memories] failed to delete storage object:", err),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Memories Wall</p>
          <h1>Stories That Warm Our Hearts</h1>
          <p className="text-gray-500 mt-2 text-lg">Share an old memory — a story, a moment, a person we cherish.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Post form */}
        <form onSubmit={onPost} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center font-display font-bold text-amber-700">
              {user?.email?.charAt(0).toUpperCase() ?? "M"}
            </div>
            <p className="font-semibold text-gray-700">Share a memory with your batchmates</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="t" className="font-semibold text-gray-700">Title (optional)</Label>
              <Input id="t" name="title" placeholder="Give your memory a title…" className="h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="b" className="font-semibold text-gray-700">Your memory *</Label>
              <Textarea id="b" name="body" required rows={4} placeholder="Share a story, a moment, a person you miss from our batch days…" className="text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl resize-none" />
            </div>
            <div>
              <Label className="font-semibold text-gray-700">Photo (optional)</Label>
              <DropzoneUpload
                files={photoFiles}
                onFilesChange={setPhotoFiles}
                accept="image/*"
                multiple={false}
                disabled={posting}
                className="mt-1"
                progress={uploadQueue.progress}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-4">
            {posting && photoFiles.length > 0 && <span className="text-sm text-amber-700 font-semibold">Uploading… please wait</span>}
            <Button type="submit" disabled={posting} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl">
              <Send className="h-4 w-4 mr-2" /> {posting ? "Posting…" : "Share Memory"}
            </Button>
          </div>
        </form>

        {/* Memory feed */}
        <div className="space-y-5">
          {memories?.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-amber-200 mx-auto mb-4" />
              <h3 className="text-gray-500 font-display">No memories yet</h3>
              <p className="text-gray-400 mt-2">Be the first to share a cherished memory — like Dr. Vijaya Gopal or Dr. Srilatha would!</p>
            </div>
          )}

          {memories?.map((m, i) => {
            const liked = m.memory_likes?.some((l: { user_id: string }) => l.user_id === user!.id);
            const initials = (m.profiles?.full_name ?? "M").charAt(0);
            return (
              <article key={m.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-display text-xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {initials}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{m.profiles?.full_name ?? "A Batchmate"}</p>
                      <p className="text-xs text-gray-400">{format(new Date(m.created_at), "PPP")}</p>
                    </div>
                    {(isAdmin || m.user_id === user?.id) && (
                      <button
                        type="button"
                        onClick={() => onDeleteMemory(m.id)}
                        aria-label="Delete memory"
                        className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {m.title && <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{m.title}</h3>}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{m.body}</p>
                  {m.image_url && (
                    <button
                      type="button"
                      onClick={() => setLbIndex(photoMemories.findIndex((pm) => pm.id === m.id))}
                      className="mt-4 block w-full overflow-hidden rounded-xl border border-amber-100 cursor-zoom-in"
                    >
                      <img
                        src={m.image_url}
                        alt={m.title ?? "Memory photo"}
                        loading="lazy"
                        className="w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300"
                      />
                    </button>
                  )}
                </div>

                {/* Like/comment bar */}
                <div className="px-6 py-3 border-t border-amber-50 flex items-center gap-6">
                  <button
                    onClick={() => toggleLike(m.id, !!liked)}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`}
                  >
                    <Heart className={`h-5 w-5 ${liked ? "fill-rose-500" : ""}`} />
                    {m.memory_likes?.length ?? 0} {liked ? "Liked" : "Like"}
                  </button>
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <MessageCircle className="h-5 w-5" />
                    {m.memory_comments?.length ?? 0} Comments
                  </span>
                </div>

                <Comments memoryId={m.id} comments={m.memory_comments ?? []} colorIdx={i} />
              </article>
            );
          })}
        </div>
      </div>

      <ImageLightbox
        images={lightboxImages}
        index={lbIndex}
        onClose={() => setLbIndex(null)}
        onIndexChange={setLbIndex}
      />
    </div>
  );
}

function Comments({
  memoryId,
  comments,
  colorIdx,
}: {
  memoryId: string;
  comments: Array<{ id: string; body: string; user_id: string; created_at: string; profiles: { full_name: string } | null }>;
  colorIdx: number;
}) {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const onDeleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteComment({ data: { id } });
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const COLORS = [
    "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700",
  ];

  const add = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addComment({ data: { memoryId, body: text } });
      setText("");
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-6 pb-5 space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2 bg-amber-50/60 rounded-xl p-3">
          {comments.map((c, ci) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${COLORS[(colorIdx + ci + 1) % COLORS.length]}`}>
                {(c.profiles?.full_name ?? "M").charAt(0)}
              </div>
              <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-amber-100 flex items-start justify-between gap-2">
                <p>
                  <span className="font-bold text-gray-800">{c.profiles?.full_name ?? "Member"}: </span>
                  <span className="text-gray-600">{c.body}</span>
                </p>
                {(isAdmin || c.user_id === user?.id) && (
                  <button
                    type="button"
                    onClick={() => onDeleteComment(c.id)}
                    aria-label="Delete comment"
                    className="text-gray-300 hover:text-red-600 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && add()}
          placeholder="Write a comment…"
          className="h-11 text-sm rounded-xl border-amber-200"
        />
        <Button onClick={add} disabled={sending || !text.trim()} className="h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-4">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
