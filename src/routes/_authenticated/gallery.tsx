import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listGallery, uploadGalleryItem, deleteGalleryItem } from "@/api/gallery";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Film, Image, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageLightbox, type LightboxImage } from "@/components/ImageLightbox";
import { DropzoneUpload } from "@/components/DropzoneUpload";

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [lb, setLb] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  const { data: items } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => listGallery(),
  });

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
    setUploadProgress({ done: 0, total: files.length });
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.set("file", files[i]);
        if (caption) fd.set("caption", caption);
        await uploadGalleryItem({ data: fd });
        setUploadProgress({ done: i + 1, total: files.length });
      }
      toast.success(`Uploaded ${files.length} item(s) successfully!`);
      setFiles([]);
      setCaption("");
      setShowUpload(false);
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const images = items?.filter(i => i.media_type === "image") ?? [];
  const videos = items?.filter(i => i.media_type === "video") ?? [];
  const documents = items?.filter(i => i.media_type === "document") ?? [];

  const onDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteGalleryItem({ data: { id } });
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const uploadedImages: LightboxImage[] = images.map(it => ({
    src: `/api/gallery/${it.id}`,
    alt: it.caption ?? "Photo",
    caption: it.caption ?? undefined,
  }));

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
                />
              </div>
              <div>
                <Label htmlFor="caption" className="font-semibold text-gray-700">Caption (optional, applied to all)</Label>
                <Input id="caption" name="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption…" className="h-12 mt-1 border-amber-200" />
              </div>
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={uploading || files.length === 0} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl shrink-0">
                  {uploading ? "Uploading…" : `Upload ${files.length > 0 ? files.length + " item(s)" : ""}`}
                </Button>
                {uploadProgress && (
                  <span className="text-sm text-gray-500 font-medium">
                    Uploading {uploadProgress.done}/{uploadProgress.total}…
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

        {/* Built-in preview images */}
        {items?.length === 0 && (
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
                  <a
                    href={`/api/gallery/${it.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-0"
                  >
                    <p className="font-semibold text-gray-700 truncate">{it.caption || it.storage_path}</p>
                    <p className="text-xs text-gray-400 truncate">{it.storage_path}</p>
                  </a>
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
      />
    </div>
  );
}

function GalleryItem({
  item,
  onOpen,
  canDelete,
  onDelete,
}: {
  item: { id: string; storage_path: string; media_type: string; caption: string | null };
  onOpen?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const url = `/api/gallery/${item.id}`;
  const isVideo = item.media_type === "video";
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
        {isVideo
          ? <video src={url} controls className="w-full h-full object-cover" />
          : (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Enlarge ${item.caption ?? "photo"}`}
              className="block w-full h-full cursor-zoom-in"
            >
              <img src={url} alt={item.caption ?? "Photo"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            </button>
          )
        }
      </div>
      {item.caption && <p className="p-3 text-sm text-gray-600 font-medium">{item.caption}</p>}
    </div>
  );
}
