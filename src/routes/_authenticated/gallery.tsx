import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listGallery,
  uploadGalleryItem,
  editGalleryItem,
  deleteGalleryItem,
  replaceGalleryItemFile,
  toggleGalleryLike,
  addGalleryComment,
  deleteGalleryComment,
  type GalleryRow,
  type GalleryComment,
} from "@/api/gallery";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Film, Image, FileText, Trash2, Heart, MessageCircle, Send, Pencil, MapPin, Calendar, Users, ImageOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ImageLightbox, type LightboxImage } from "@/components/ImageLightbox";
import { DropzoneUpload } from "@/components/DropzoneUpload";
import { uploadToFirebaseStorageResumable, deleteFromFirebaseStorage } from "@/lib/storage";
import { compressImage } from "@/lib/image-compress";
import { useUploadQueue } from "@/hooks/useUploadQueue";

export const Route = createFileRoute("/_authenticated/gallery")({
  head: () => ({ meta: [{ title: "Photo & Video Gallery — SIMCOSA 84–85" }] }),
  component: Gallery,
});

const FILTERS = ["All", "College Days", "Reunions", "Achievements", "Family Moments", "Tributes"];

const SAMPLE_IMAGES: LightboxImage[] = [
  { src: "/assets/hero-reunion.jpeg", caption: "Reunion — Yellow Shirt Day" },
  { src: "/assets/simcosa-stage.jpeg", caption: "SIMCOSA 85 — Celebrating Friendship" },
  { src: "/assets/birthday-event.jpeg", caption: "Batch Birthday Celebration" },
  { src: "/assets/member-profile.jpeg", caption: "Our Batchmate" },
];

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_UPLOAD_MB = 15;

function Gallery() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [takenDate, setTakenDate] = useState("");
  const [people, setPeople] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadQueue = useUploadQueue();
  const [activeFilter, setActiveFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [lb, setLb] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  const { data: items, isLoading, isError, error } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => listGallery(),
  });

  if (isError) {
    console.error("[gallery] failed to load gallery items:", error);
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        const { url, path } = await uploadToFirebaseStorageResumable(file, "gallery", user.id, (pct) =>
          uploadQueue.setPct(original, pct),
        );
        await uploadGalleryItem({
          data: {
            url,
            storagePath: path,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            caption: caption || undefined,
            title: title || undefined,
            location: location || undefined,
            takenDate: takenDate || undefined,
            people: people || undefined,
          },
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
    qc.invalidateQueries({ queryKey: ["gallery"] });
    setUploading(false);
  };

  // Admin Gallery shows every non-deleted row unconditionally. Bucket every
  // item here too — video/document are explicit, everything else (including
  // legacy/unexpected media_type values) falls into the image bucket — so no
  // row with an available file is ever silently dropped from the public page.
  const videos = items?.filter(i => i.media_type === "video") ?? [];
  const documents = items?.filter(i => i.media_type === "document") ?? [];
  const images = items?.filter(i => i.media_type !== "video" && i.media_type !== "document") ?? [];

  const onDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await deleteGalleryItem({ data: { id } });
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["gallery"] });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) =>
          console.error("[gallery] failed to delete storage object:", err),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const uploadedImages: LightboxImage[] = images.map(it => ({
    src: it.file_available && it.file_url ? it.file_url : "",
    alt: it.caption ?? "Photo",
    caption: it.caption ?? undefined,
  }));

  const toggleLike = async (id: string, liked: boolean) => {
    if (!user) {
      toast.error("Please sign in to like items.");
      return;
    }
    try {
      await toggleGalleryLike({ data: { galleryItemId: id, liked } });
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Our Memories</p>
            <h1>Photo & Video Gallery</h1>
            <p className="text-gray-500 mt-2 text-lg">Old school photos, reunion snaps, candid moments — all in one place.</p>
          </div>
          <Button
            onClick={() => setShowUpload(v => !v)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 h-12 rounded-xl shrink-0"
          >
            <Upload className="h-5 w-5 mr-2" /> Upload Photo/Video
          </Button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="mx-auto max-w-6xl mt-6">
            <form onSubmit={onSubmit} className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
              <div>
                <Label className="font-semibold text-gray-700">Choose photos, videos, or files</Label>
                <DropzoneUpload
                  files={files}
                  onFilesChange={setFiles}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  disabled={uploading}
                  className="mt-1"
                  progress={uploadQueue.progress}
                />
                {files.some((f) => f.type.startsWith("video/")) && (
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">Videos may take longer depending on file size and internet speed.</p>
                )}
              </div>
              <p className="text-xs text-gray-500 -mt-1">Optional details below are applied to all selected files. You can edit each photo's details later.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="font-semibold text-gray-700">Title (optional)</Label>
                  <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Reunion Day" className="h-12 mt-1 border-amber-200" />
                </div>
                <div>
                  <Label htmlFor="caption" className="font-semibold text-gray-700">Caption / memory note (optional)</Label>
                  <Input id="caption" name="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption…" className="h-12 mt-1 border-amber-200" />
                </div>
                <div>
                  <Label htmlFor="location" className="font-semibold text-gray-700">Place / location (optional)</Label>
                  <Input id="location" name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Vijayawada" className="h-12 mt-1 border-amber-200" />
                </div>
                <div>
                  <Label htmlFor="takenDate" className="font-semibold text-gray-700">Date taken (optional)</Label>
                  <Input id="takenDate" name="takenDate" type="date" value={takenDate} onChange={(e) => setTakenDate(e.target.value)} className="h-12 mt-1 border-amber-200" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="people" className="font-semibold text-gray-700">People in photo (optional)</Label>
                  <Input id="people" name="people" value={people} onChange={(e) => setPeople(e.target.value)} placeholder="e.g. Dr. Satya, Dr. Vijaya Gopal" className="h-12 mt-1 border-amber-200" />
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <Button type="submit" disabled={uploading || files.length === 0} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl shrink-0">
                  {uploading ? "Uploading…" : `Upload ${files.length > 0 ? files.length + " item(s)" : ""}`}
                </Button>
                {uploading && (
                  <span className="text-sm text-amber-700 font-semibold">
                    Uploading {Math.min(uploadQueue.completedCount + uploadQueue.failedCount + 1, uploadQueue.total)} of {uploadQueue.total} files… please wait
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeFilter === f ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-amber-200 hover:border-amber-400 hover:text-amber-700'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Error state — don't silently render a blank page if the query fails */}
        {isError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600 font-semibold mb-8">
            Unable to load gallery. Please contact admin.
          </div>
        )}

        {/* Built-in preview images */}
        {!isLoading && !isError && items?.length === 0 && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Image className="h-5 w-5 text-amber-500" />
              <h3 className="font-display font-bold text-gray-700">Sample Gallery</h3>
              <span className="text-xs text-gray-400">(upload your own photos above)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {SAMPLE_IMAGES.map((img, idx) => (
                <button
                  type="button"
                  key={img.src}
                  onClick={() => setLb({ images: SAMPLE_IMAGES, index: idx })}
                  className="text-left rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-shadow group cursor-zoom-in"
                >
                  <div className="aspect-square">
                    <img src={img.src} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                  <p className="p-3 text-sm text-gray-600 font-medium">{img.caption}</p>
                </button>
              ))}
            </div>
            <div className="mt-8 text-center text-gray-400">
              <Upload className="h-10 w-10 mx-auto mb-3 text-amber-200" />
              <p className="font-semibold">Be the first to upload batch photos!</p>
              <p className="text-sm mt-1">Click "Upload Photo/Video" above to get started.</p>
            </div>
          </div>
        )}

        {/* Uploaded photos */}
        {images.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <Image className="h-5 w-5 text-amber-500" />
              <h3 className="font-display font-bold text-gray-700">Photos ({images.length})</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((it, idx) => (
                <GalleryItem
                  key={it.id}
                  item={it}
                  onOpen={() => setLb({ images: uploadedImages, index: idx })}
                  canDelete={isAdmin || it.uploaded_by === user?.id}
                  onDelete={() => onDelete(it.id)}
                  onToggleLike={toggleLike}
                />
              ))}
            </div>
          </div>
        )}

        {/* Uploaded videos */}
        {videos.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Film className="h-5 w-5 text-amber-500" />
              <h3 className="font-display font-bold text-gray-700">Videos ({videos.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(it => (
                <GalleryItem
                  key={it.id}
                  item={it}
                  canDelete={isAdmin || it.uploaded_by === user?.id}
                  onDelete={() => onDelete(it.id)}
                  onToggleLike={toggleLike}
                />
              ))}
            </div>
          </div>
        )}

        {/* Uploaded documents */}
        {documents.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-5">
              <FileText className="h-5 w-5 text-amber-500" />
              <h3 className="font-display font-bold text-gray-700">Files ({documents.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(it => (
                <div
                  key={it.id}
                  className="relative flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-amber-500" />
                  </div>
                  {it.file_available && it.file_url ? (
                    <a
                      href={it.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 min-w-0"
                    >
                      <p className="font-semibold text-gray-700 truncate">{it.caption || it.storage_path}</p>
                      <p className="text-xs text-gray-400 truncate">{it.storage_path}</p>
                    </a>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-700 truncate">{it.caption || it.storage_path}</p>
                      <p className="text-xs text-red-400 truncate">Old file missing. Please re-upload.</p>
                    </div>
                  )}
                  {(isAdmin || it.uploaded_by === user?.id) && (
                    <button
                      type="button"
                      onClick={() => onDelete(it.id)}
                      aria-label="Delete file"
                      className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageLightbox
        images={lb?.images ?? []}
        index={lb?.index ?? null}
        onClose={() => setLb(null)}
        onIndexChange={(i) => setLb((s) => (s ? { ...s, index: i } : s))}
        renderFooter={(i) => {
          const it = images[i];
          if (!it) return null;
          return (
            <div className="rounded-2xl bg-white/95 backdrop-blur p-3">
              <GalleryDetails item={it} canEdit={isAdmin || it.uploaded_by === user?.id} />
              <LikeCommentBar item={it} onToggleLike={toggleLike} />
              <GalleryComments item={it} />
            </div>
          );
        }}
      />
    </div>
  );
}

function LikeCommentBar({
  item,
  onToggleLike,
  onToggleComments,
  showComments,
}: {
  item: GalleryRow;
  onToggleLike: (id: string, liked: boolean) => void;
  onToggleComments?: () => void;
  showComments?: boolean;
}) {
  const { user } = useAuth();
  const liked = !!user && (item.gallery_likes ?? []).some((l) => l.user_id === user.id);
  const likeCount = item.gallery_likes?.length ?? 0;
  const commentCount = item.gallery_comments?.length ?? 0;
  return (
    <div className="flex items-center gap-5 px-1 py-1">
      <button
        type="button"
        onClick={() => onToggleLike(item.id, liked)}
        className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`}
      >
        <Heart className={`h-5 w-5 ${liked ? "fill-rose-500" : ""}`} />
        {likeCount} {liked ? "Liked" : "Like"}
      </button>
      <button
        type="button"
        onClick={onToggleComments}
        className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${showComments ? "text-amber-600" : "text-gray-400 hover:text-amber-500"}`}
      >
        <MessageCircle className="h-5 w-5" />
        {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
      </button>
    </div>
  );
}

function GalleryComments({ item }: { item: GalleryRow }) {
  const { user, isApproved, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const comments: GalleryComment[] = item.gallery_comments ?? [];

  const add = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addGalleryComment({ data: { galleryItemId: item.id, comment: text } });
      setText("");
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  const onDeleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteGalleryComment({ data: { id } });
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="px-1 pt-2 space-y-2">
      {comments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto bg-amber-50/60 rounded-xl p-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-amber-100">
              <p className="min-w-0">
                <span className="font-bold text-gray-800">{c.profiles?.full_name ?? "Member"}: </span>
                <span className="text-gray-600">{c.comment}</span>
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
          ))}
        </div>
      )}

      {!user && <p className="text-xs text-gray-400 px-1">Please sign in to comment.</p>}
      {user && !isApproved && !isAdmin && (
        <p className="text-xs text-gray-400 px-1">Admin approval required to comment.</p>
      )}
      {user && (isApproved || isAdmin) && (
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && add()}
            placeholder="Write a comment…"
            className="h-10 text-sm rounded-xl border-amber-200"
          />
          <Button onClick={add} disabled={sending || !text.trim()} className="h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function GalleryDetails({ item, canEdit }: { item: GalleryRow; canEdit?: boolean }) {
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
          title: title || undefined,
          caption: caption || undefined,
          location: location || undefined,
          takenDate: takenDate || undefined,
          people: people || undefined,
        },
      });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      setEditing(false);
      toast.success("Details updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update details");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="px-1 pb-2 space-y-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-9 text-sm border-amber-200" />
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Description / memory note" className="h-9 text-sm border-amber-200" />
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Place / location" className="h-9 text-sm border-amber-200" />
        <Input type="date" value={takenDate} onChange={(e) => setTakenDate(e.target.value)} className="h-9 text-sm border-amber-200" />
        <Input value={people} onChange={(e) => setPeople(e.target.value)} placeholder="People in photo" className="h-9 text-sm border-amber-200" />
        <div className="flex gap-2">
          <Button type="button" onClick={save} disabled={saving} className="h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-4 text-sm">
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving} className="h-9 rounded-xl px-4 text-sm">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!hasDetails && !canEdit) return null;

  return (
    <div className="px-1 pb-1">
      {item.title && <p className="text-sm font-bold text-gray-800">{item.title}</p>}
      {item.caption && <p className="text-sm text-gray-600">{item.caption}</p>}
      {(item.location || item.taken_date || item.people) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
          {item.location && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-amber-500" /> Taken at: {item.location}</span>
          )}
          {item.taken_date && (
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-amber-500" /> Date: {item.taken_date.slice(0, 10)}</span>
          )}
          {item.people && (
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-amber-500" /> With: {item.people}</span>
          )}
        </div>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={startEdit}
          className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold mt-1.5"
        >
          <Pencil className="h-3 w-3" /> Edit details
        </button>
      )}
    </div>
  );
}

function GalleryItem({
  item,
  onOpen,
  canDelete,
  onDelete,
  onToggleLike,
}: {
  item: GalleryRow;
  onOpen?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
  onToggleLike: (id: string, liked: boolean) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const isVideo = item.media_type === "video";
  const fileAvailable = item.file_available && !!item.file_url;
  const canReplace = canDelete;

  const onReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setReplacing(true);
    try {
      const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
      const { url, path } = await uploadToFirebaseStorageResumable(compressed, "gallery", user.id);
      await replaceGalleryItemFile({
        data: { id: item.id, url, storagePath: path, fileName: compressed.name, mimeType: compressed.type, fileSize: compressed.size },
      });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("File replaced");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Replace failed");
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-shadow group">
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete item"
          className="absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      <div className={`${isVideo ? "aspect-video" : "aspect-square"} bg-amber-50 flex items-center justify-center`}>
        {!fileAvailable ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center px-3 text-gray-400">
            <ImageOff className="h-8 w-8" />
            <p className="text-xs font-medium">Old photo file missing. Please re-upload this image.</p>
            {canReplace && (
              <label className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer">
                <RefreshCw className={`h-3.5 w-3.5 ${replacing ? "animate-spin" : ""}`} />
                {replacing ? "Uploading…" : "Replace file"}
                <input type="file" accept="image/*,video/*" className="hidden" disabled={replacing} onChange={onReplaceFile} />
              </label>
            )}
          </div>
        ) : isVideo
          ? <video src={item.file_url!} controls className="w-full h-full object-cover" />
          : (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Enlarge ${item.caption ?? "photo"}`}
              className="block w-full h-full cursor-zoom-in"
            >
              <img src={item.file_url!} alt={item.caption ?? "Photo"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            </button>
          )
        }
      </div>
      <div className="px-3 pt-3">
        <GalleryDetails item={item} canEdit={canDelete} />
      </div>
      <div className="px-2 pb-2 pt-1 border-t border-amber-50 mt-2">
        <LikeCommentBar
          item={item}
          onToggleLike={onToggleLike}
          showComments={showComments}
          onToggleComments={() => setShowComments((v) => !v)}
        />
        {showComments && <GalleryComments item={item} />}
      </div>
    </div>
  );
}
