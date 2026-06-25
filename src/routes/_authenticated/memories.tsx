import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listMemories, postMemory, addMemoryImages, deleteMemoryImage, editMemory, reorderMemoryImages,
  toggleLike as toggleLikeFn, addComment, deleteMemory, deleteComment,
  type MemoryImage,
} from "@/api/memories";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart, MessageCircle, BookOpen, Send, Trash2, Pencil, Paperclip, X,
  ArrowLeft, ArrowRight, ArrowUpDown, FileText, FileSpreadsheet,
  Presentation, Archive, File, Download, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ImageLightbox, type LightboxImage } from "@/components/ImageLightbox";
import { DropzoneUpload } from "@/components/DropzoneUpload";
import { uploadToFirebaseStorageResumable, deleteFromFirebaseStorage } from "@/lib/storage";
import { compressImage } from "@/lib/image-compress";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import { cn } from "@/lib/utils";

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;
const MAX_DOC_MB = 25;

const MEMORY_ACCEPT = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/quicktime", "video/webm",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
  "application/zip", "application/x-zip-compressed",
].join(",");

function maxMBForType(mimeType: string): number {
  if (mimeType.startsWith("image/")) return MAX_IMAGE_MB;
  if (mimeType.startsWith("video/")) return MAX_VIDEO_MB;
  return MAX_DOC_MB;
}

function isImageType(mimeType: string | null | undefined): boolean {
  return !!(mimeType && mimeType.startsWith("image/"));
}

function isVideoType(mimeType: string | null | undefined): boolean {
  return !!(mimeType && mimeType.startsWith("video/"));
}

export const Route = createFileRoute("/_authenticated/memories")({
  head: () => ({ meta: [{ title: "Memories Wall — SIMCOSA 84–85" }] }),
  component: Memories,
});

const AVATAR_COLORS = [
  "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700",
  "bg-purple-100 text-purple-700",
];

function validateFiles(files: File[]): string | null {
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

async function uploadMemoryAttachments(
  files: File[],
  userId: string,
  uploadQueue: ReturnType<typeof useUploadQueue>,
) {
  uploadQueue.init(files);
  const uploaded: { url: string; storagePath: string; fileName: string; mimeType: string; fileSize: number }[] = [];
  for (const original of files) {
    try {
      uploadQueue.setStatus(original, "uploading", 0);
      // Only compress images; pass other file types through directly.
      const toUpload = isImageType(original.type) ? await compressImage(original) : original;
      const res = await uploadToFirebaseStorageResumable(toUpload, "memories", userId, (pct) =>
        uploadQueue.setPct(original, pct),
      );
      uploaded.push({
        url: res.url,
        storagePath: res.path,
        fileName: toUpload.name,
        mimeType: toUpload.type,
        fileSize: toUpload.size,
      });
      uploadQueue.setStatus(original, "completed", 100);
    } catch (err) {
      uploadQueue.setStatus(original, "error");
      throw err;
    }
  }
  return uploaded;
}

function attachmentIcon(mimeType: string | null | undefined) {
  if (!mimeType) return <File className="h-8 w-8" />;
  if (mimeType === "application/pdf") return <FileText className="h-8 w-8 text-red-500" />;
  if (mimeType.includes("wordprocessingml") || mimeType === "application/msword")
    return <FileText className="h-8 w-8 text-blue-600" />;
  if (mimeType.includes("presentationml") || mimeType === "application/vnd.ms-powerpoint")
    return <Presentation className="h-8 w-8 text-orange-500" />;
  if (mimeType.includes("spreadsheetml") || mimeType === "application/vnd.ms-excel" || mimeType === "text/csv")
    return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
  if (mimeType === "application/zip" || mimeType === "application/x-zip-compressed")
    return <Archive className="h-8 w-8 text-purple-500" />;
  return <File className="h-8 w-8 text-gray-400" />;
}

function attachmentLabel(mimeType: string | null | undefined): string {
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

function FileAttachmentCard({ img, onRemove, isLegacy }: { img: MemoryImage; onRemove?: (id: string) => void; isLegacy: boolean }) {
  const label = attachmentLabel(img.mime_type);
  const name = img.file_name ?? label;
  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
      {attachmentIcon(img.mime_type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
        <p className="text-xs text-gray-400">{label}{img.file_size ? ` · ${(img.file_size / 1024).toFixed(0)} KB` : ""}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={img.image_url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open file"
          className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={img.image_url}
          download={img.file_name ?? undefined}
          aria-label="Download file"
          className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
        >
          <Download className="h-4 w-4" />
        </a>
        {onRemove && !isLegacy && (
          <button
            type="button"
            aria-label="Remove file"
            onClick={() => onRemove(img.id)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function MemoryAttachmentGrid({
  images,
  onOpen,
  reordering,
  onMove,
  memoryId,
  onRemove,
}: {
  images: MemoryImage[];
  onOpen: (idx: number) => void;
  reordering?: boolean;
  onMove?: (idx: number, dir: -1 | 1) => void;
  memoryId?: string;
  onRemove?: (imageId: string) => void;
}) {
  if (images.length === 0) return null;

  const isLegacy = (img: MemoryImage) => !!(memoryId && img.id === memoryId);

  const visualItems = images.filter((img) => isImageType(img.mime_type) || isVideoType(img.mime_type));
  const docItems = images.filter((img) => !isImageType(img.mime_type) && !isVideoType(img.mime_type));

  const getOriginalIdx = (img: MemoryImage) => images.indexOf(img);

  return (
    <div className="mt-4 space-y-2">
      {/* Visual grid (images + videos) */}
      {visualItems.length > 0 && (
        <div className={cn("grid gap-1.5", visualItems.length === 1 ? "" : visualItems.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
          {visualItems.map((img) => {
            const origIdx = getOriginalIdx(img);
            const i = visualItems.indexOf(img);
            const canDelete = onRemove && !isLegacy(img);
            const isVideo = isVideoType(img.mime_type);

            if (visualItems.length === 1 && !reordering) {
              return (
                <div key={img.id} className="relative overflow-hidden rounded-xl border border-amber-100">
                  {isVideo ? (
                    <video src={img.image_url} controls className="w-full max-h-96 object-contain" />
                  ) : (
                    <button type="button" onClick={() => onOpen(origIdx)} className="block w-full cursor-zoom-in">
                      <img src={img.image_url} alt="Memory photo" loading="lazy" className="w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button" aria-label="Remove" onClick={() => onRemove(img.id)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div key={img.id} className="relative overflow-hidden rounded-lg border border-amber-100 aspect-square">
                {isVideo ? (
                  <video src={img.image_url} className="h-full w-full object-cover" muted />
                ) : (
                  <button
                    type="button" onClick={() => !reordering && onOpen(origIdx)}
                    disabled={reordering}
                    className={cn("h-full w-full block", !reordering && "cursor-zoom-in")}
                  >
                    <img src={img.image_url} alt="Memory photo" loading="lazy" className="h-full w-full object-cover hover:scale-[1.05] transition-transform duration-300" />
                  </button>
                )}
                {reordering ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                    <button
                      type="button" aria-label="Move earlier" disabled={i === 0}
                      onClick={() => onMove?.(origIdx, -1)}
                      className="h-8 w-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-white"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button" aria-label="Move later" disabled={i === visualItems.length - 1}
                      onClick={() => onMove?.(origIdx, 1)}
                      className="h-8 w-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-white"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  canDelete && (
                    <button
                      type="button" aria-label="Remove" onClick={() => onRemove(img.id)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Document/file cards */}
      {!reordering && docItems.length > 0 && (
        <div className="space-y-2">
          {docItems.map((img) => (
            <FileAttachmentCard key={img.id} img={img} onRemove={onRemove} isLegacy={isLegacy(img)} />
          ))}
        </div>
      )}
      {reordering && docItems.length > 0 && (
        <div className="space-y-2">
          {docItems.map((img) => {
            const origIdx = getOriginalIdx(img);
            return (
              <div key={img.id} className="relative flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
                {attachmentIcon(img.mime_type)}
                <p className="flex-1 text-sm font-semibold text-gray-800 truncate">{img.file_name ?? attachmentLabel(img.mime_type)}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button" disabled={origIdx === 0} onClick={() => onMove?.(origIdx, -1)}
                    className="h-7 w-7 rounded-full bg-white border border-amber-200 text-gray-600 flex items-center justify-center disabled:opacity-30 hover:bg-amber-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button" disabled={origIdx === images.length - 1} onClick={() => onMove?.(origIdx, 1)}
                    className="h-7 w-7 rounded-full bg-white border border-amber-200 text-gray-600 flex items-center justify-center disabled:opacity-30 hover:bg-amber-50"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Memories() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [posting, setPosting] = useState(false);
  const [lightbox, setLightbox] = useState<{ memoryId: string; index: number } | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingFilesId, setAddingFilesId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const uploadQueue = useUploadQueue();

  const { data: memories } = useQuery({
    queryKey: ["memories"],
    queryFn: () => listMemories(),
  });

  const onPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "");
    const body = String(fd.get("body") || "");
    const authorName = isAdmin ? String(fd.get("authorName") || "") : "";

    const err = validateFiles(attachmentFiles);
    if (err) { toast.error(err); return; }

    setPosting(true);
    try {
      const { id: memoryId } = await postMemory({ data: { title: title || undefined, body, authorName: authorName || undefined } });
      if (attachmentFiles.length > 0) {
        const uploaded = await uploadMemoryAttachments(attachmentFiles, user.id, uploadQueue);
        await addMemoryImages({ data: { memoryId, images: uploaded } });
      }
      form.reset();
      setAttachmentFiles([]);
      uploadQueue.reset();
      toast.success("Your memory has been shared!");
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err2) {
      toast.error(err2 instanceof Error ? err2.message : "Upload failed. Please try again.");
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
      for (const path of res.fbStoragePaths) {
        deleteFromFirebaseStorage(path).catch((err) =>
          console.error("[memories] failed to delete storage object:", err),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleRemoveAttachment = async (imageId: string) => {
    if (!confirm("Remove this attachment from this memory?")) return;
    try {
      const res = await deleteMemoryImage({ data: { id: imageId } });
      toast.success("Attachment removed");
      qc.invalidateQueries({ queryKey: ["memories"] });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) =>
          console.error("[memories] failed to delete storage object:", err),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to remove attachment");
    }
  };

  const handleMoveAttachment = async (memoryId: string, images: MemoryImage[], idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= images.length) return;
    const reordered = [...images];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const orderedImageIds = reordered.map((img) => img.id);
    try {
      await reorderMemoryImages({ data: { memoryId, orderedImageIds } });
      qc.invalidateQueries({ queryKey: ["memories"] });
      toast.success("Order updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update order");
    }
  };

  const lightboxMemory = memories?.find((m) => m.id === lightbox?.memoryId);
  // Only pass image-type attachments to the lightbox
  const lightboxImages: LightboxImage[] = (lightboxMemory?.images ?? [])
    .filter((img) => isImageType(img.mime_type))
    .map((img) => ({ src: img.image_url, alt: lightboxMemory?.title ?? "Memory photo" }));

  // Map the click index (from full images array) to the lightbox images array
  const toLightboxIndex = (memory: typeof lightboxMemory, origIdx: number): number => {
    if (!memory) return 0;
    const imageItems = memory.images.filter((img) => isImageType(img.mime_type));
    const clickedImg = memory.images[origIdx];
    const lbIdx = imageItems.indexOf(clickedImg);
    return lbIdx >= 0 ? lbIdx : 0;
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
            <p className="font-semibold text-gray-700">Add Memory</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="t" className="font-semibold text-gray-700">Title (optional)</Label>
              <Input id="t" name="title" placeholder="Give your memory a title…" className="h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="b" className="font-semibold text-gray-700">Memory / Story *</Label>
              <Textarea id="b" name="body" required rows={4} placeholder="Share a story, a moment, a person you miss from our batch days…" className="text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl resize-none" />
            </div>
            {isAdmin && (
              <div>
                <Label htmlFor="an" className="font-semibold text-gray-700">Posted on behalf of / Batchmate name (optional)</Label>
                <Input id="an" name="authorName" placeholder="e.g. Dr. Srilatha" className="h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl" />
              </div>
            )}
            <div>
              <Label className="font-semibold text-gray-700">Add photos, videos or files (optional)</Label>
              <p className="text-xs text-gray-400 mt-0.5 mb-1">
                Supported: images (up to {MAX_IMAGE_MB} MB), videos (up to {MAX_VIDEO_MB} MB), PDFs/Office docs/ZIP (up to {MAX_DOC_MB} MB).
              </p>
              <DropzoneUpload
                files={attachmentFiles}
                onFilesChange={setAttachmentFiles}
                accept={MEMORY_ACCEPT}
                multiple
                disabled={posting}
                className="mt-1"
                progress={uploadQueue.progress}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-4">
            {posting && attachmentFiles.length > 0 && <span className="text-sm text-amber-700 font-semibold">Uploading… please wait</span>}
            <Button type="submit" disabled={posting} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl">
              <Send className="h-4 w-4 mr-2" /> {posting ? "Posting…" : "Post Memory"}
            </Button>
          </div>
        </form>

        {/* Memory feed */}
        <div className="space-y-5">
          {memories?.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-amber-200 mx-auto mb-4" />
              <h3 className="text-gray-500 font-display">No memories yet</h3>
              <p className="text-gray-400 mt-2">Be the first to share a cherished memory!</p>
            </div>
          )}

          {memories?.map((m, i) => {
            const liked = m.memory_likes?.some((l: { user_id: string }) => l.user_id === user!.id);
            const initials = (m.profiles?.full_name ?? "M").charAt(0);
            const canManage = isAdmin || m.user_id === user?.id;
            return (
              <article key={m.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-display text-xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {initials}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{m.display_name || "A Batchmate"}</p>
                      <p className="text-xs text-gray-400">{format(new Date(m.created_at), "PPP")}</p>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingId(editingId === m.id ? null : m.id)}
                          aria-label="Edit memory"
                          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMemory(m.id)}
                          aria-label="Delete memory"
                          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingId === m.id ? (
                    <EditMemoryPanel memory={m} onDone={() => setEditingId(null)} />
                  ) : (
                    <>
                      {m.title && <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{m.title}</h3>}
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{m.body}</p>
                      <MemoryAttachmentGrid
                        images={m.images}
                        onOpen={(origIdx) => {
                          const lbIdx = toLightboxIndex(m, origIdx);
                          setLightbox({ memoryId: m.id, index: lbIdx });
                        }}
                        reordering={reorderingId === m.id}
                        onMove={(idx, dir) => handleMoveAttachment(m.id, m.images, idx, dir)}
                        memoryId={m.id}
                        onRemove={canManage ? handleRemoveAttachment : undefined}
                      />
                      {canManage && (
                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          {addingFilesId !== m.id && (
                            <button
                              type="button"
                              onClick={() => setAddingFilesId(m.id)}
                              className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700"
                            >
                              <Paperclip className="h-4 w-4" /> Add more files
                            </button>
                          )}
                          {m.images.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setReorderingId(reorderingId === m.id ? null : m.id)}
                              className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700"
                            >
                              <ArrowUpDown className="h-4 w-4" /> {reorderingId === m.id ? "Done reordering" : "Reorder attachments"}
                            </button>
                          )}
                        </div>
                      )}
                      {canManage && addingFilesId === m.id && (
                        <AddAttachmentsPanel memoryId={m.id} existingImages={m.images} onDone={() => setAddingFilesId(null)} />
                      )}
                    </>
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
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onIndexChange={(idx) => setLightbox((lb) => (lb ? { ...lb, index: idx } : lb))}
      />
    </div>
  );
}

function AddAttachmentsPanel({ memoryId, existingImages, onDone }: { memoryId: string; existingImages: MemoryImage[]; onDone: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const uploadQueue = useUploadQueue();

  const save = async () => {
    if (!user || files.length === 0) return;
    const err = validateFiles(files);
    if (err) { toast.error(err); return; }

    // Client-side dedup by file_name + file_size
    const existingKeys = new Set(
      existingImages
        .filter((img) => img.file_name != null && img.file_size != null)
        .map((img) => `${img.file_name}:${img.file_size}`),
    );
    const unique: File[] = [];
    let dupCount = 0;
    for (const f of files) {
      if (existingKeys.has(`${f.name}:${f.size}`)) { dupCount++; }
      else { unique.push(f); }
    }
    if (dupCount > 0) {
      toast.error(dupCount === 1 ? "This file already exists in this memory" : `${dupCount} duplicate files skipped`);
    }
    if (unique.length === 0) { onDone(); return; }

    setSaving(true);
    try {
      const uploaded = await uploadMemoryAttachments(unique, user.id, uploadQueue);
      await addMemoryImages({ data: { memoryId, images: uploaded } });
      setFiles([]);
      uploadQueue.reset();
      toast.success("Files added");
      qc.invalidateQueries({ queryKey: ["memories"] });
      onDone();
    } catch (err2) {
      toast.error(err2 instanceof Error ? err2.message : "Upload failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 bg-amber-50/50 rounded-xl p-3">
      <DropzoneUpload files={files} onFilesChange={setFiles} accept={MEMORY_ACCEPT} multiple disabled={saving} progress={uploadQueue.progress} />
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={saving} className="h-9 rounded-xl">Cancel</Button>
        <Button type="button" onClick={save} disabled={saving || files.length === 0} className="h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl">
          {saving ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </div>
  );
}

function EditMemoryPanel({
  memory,
  onDone,
}: {
  memory: { id: string; title: string | null; body: string; author_name: string | null; images: MemoryImage[]; user_id: string };
  onDone: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState(memory.title ?? "");
  const [body, setBody] = useState(memory.body);
  const [authorName, setAuthorName] = useState(memory.author_name ?? "");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const uploadQueue = useUploadQueue();
  const canManageImages = isAdmin || memory.user_id === user?.id;

  const save = async () => {
    if (!body.trim() || !user) { toast.error("Your memory text cannot be empty."); return; }
    const err = validateFiles(newFiles);
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      await editMemory({ data: { id: memory.id, title: title || undefined, body, authorName: authorName || undefined } });
      if (newFiles.length > 0) {
        const uploaded = await uploadMemoryAttachments(newFiles, user.id, uploadQueue);
        await addMemoryImages({ data: { memoryId: memory.id, images: uploaded } });
      }
      setNewFiles([]);
      uploadQueue.reset();
      toast.success("Memory updated");
      qc.invalidateQueries({ queryKey: ["memories"] });
      onDone();
    } catch (err2) {
      toast.error(err2 instanceof Error ? err2.message : "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeAttachment = async (imageId: string) => {
    if (!confirm("Remove this attachment?")) return;
    try {
      const res = await deleteMemoryImage({ data: { id: imageId } });
      qc.invalidateQueries({ queryKey: ["memories"] });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) =>
          console.error("[memories] failed to delete storage object:", err),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove attachment");
    }
  };

  return (
    <div className="space-y-3 bg-amber-50/50 rounded-xl p-4">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="h-11 border-amber-200 rounded-xl" />
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="border-amber-200 rounded-xl resize-none" />
      <div>
        <Label className="font-semibold text-gray-700">Author display name (optional)</Label>
        <Input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Leave blank to show your profile name"
          className="h-11 mt-1 border-amber-200 rounded-xl"
        />
      </div>

      {canManageImages && memory.images.length > 0 && (
        <div className="space-y-2">
          <Label className="font-semibold text-gray-700">Existing attachments</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {memory.images.filter((img) => isImageType(img.mime_type)).map((img) => (
              <div key={img.id} className="relative rounded-lg overflow-hidden border border-amber-100 aspect-square">
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button" onClick={() => removeAttachment(img.id)} aria-label="Remove"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {memory.images.filter((img) => !isImageType(img.mime_type) && !isVideoType(img.mime_type)).map((img) => (
            <FileAttachmentCard key={img.id} img={img} onRemove={removeAttachment} isLegacy={img.id === memory.id} />
          ))}
          {memory.images.filter((img) => isVideoType(img.mime_type)).map((img) => (
            <div key={img.id} className="relative rounded-lg overflow-hidden border border-amber-100">
              <video src={img.image_url} controls className="w-full max-h-48 object-contain" />
              <button
                type="button" onClick={() => removeAttachment(img.id)} aria-label="Remove video"
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canManageImages && (
        <div>
          <Label className="font-semibold text-gray-700 flex items-center gap-1.5"><Paperclip className="h-4 w-4" /> Add more files</Label>
          <DropzoneUpload files={newFiles} onFilesChange={setNewFiles} accept={MEMORY_ACCEPT} multiple disabled={saving} progress={uploadQueue.progress} className="mt-1" />
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={saving} className="h-10 rounded-xl">Cancel</Button>
        <Button type="button" onClick={save} disabled={saving} className="h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
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
