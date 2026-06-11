import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listGallery, uploadGalleryItem } from "@/api/gallery";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Film, Image } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/gallery")({
  head: () => ({ meta: [{ title: "Photo & Video Gallery — SIMCOSA 84–85" }] }),
  component: Gallery,
});

const FILTERS = ["All", "College Days", "Reunions", "Achievements", "Family Moments", "Tributes"];

function Gallery() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => listGallery(),
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file") as File;
    if (!file || !user) return;
    setUploading(true);
    try {
      await uploadGalleryItem({ data: fd });
      toast.success("Uploaded successfully!");
      form.reset();
      setShowUpload(false);
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const images = items?.filter(i => i.media_type === "image") ?? [];
  const videos = items?.filter(i => i.media_type === "video") ?? [];

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
            <form onSubmit={onSubmit} className="bg-amber-50 rounded-2xl border border-amber-200 p-5 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <Label htmlFor="file" className="font-semibold text-gray-700">Choose a photo or video</Label>
                <Input id="file" name="file" type="file" accept="image/*,video/*" required className="h-12 mt-1 border-amber-200" />
              </div>
              <div className="flex-1 w-full">
                <Label htmlFor="caption" className="font-semibold text-gray-700">Caption (optional)</Label>
                <Input id="caption" name="caption" placeholder="Add a caption…" className="h-12 mt-1 border-amber-200" />
              </div>
              <Button type="submit" disabled={uploading} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl shrink-0">
                {uploading ? "Uploading…" : "Upload"}
              </Button>
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
              {[
                { src: "/assets/hero-reunion.jpeg", caption: "Reunion — Yellow Shirt Day" },
                { src: "/assets/simcosa-stage.jpeg", caption: "SIMCOSA 85 — Celebrating Friendship" },
                { src: "/assets/birthday-event.jpeg", caption: "Batch Birthday Celebration" },
                { src: "/assets/member-profile.jpeg", caption: "Our Batchmate" },
              ].map(img => (
                <div key={img.src} className="rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-shadow group">
                  <div className="aspect-square">
                    <img src={img.src} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                  <p className="p-3 text-sm text-gray-600 font-medium">{img.caption}</p>
                </div>
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
              {images.map(it => <GalleryItem key={it.id} item={it} />)}
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
              {videos.map(it => <GalleryItem key={it.id} item={it} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryItem({ item }: { item: { id: string; storage_path: string; media_type: string; caption: string | null } }) {
  const url = `/api/gallery/${item.id}`;
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-shadow group">
      <div className={`${item.media_type === "video" ? "aspect-video" : "aspect-square"} bg-amber-50 flex items-center justify-center`}>
        {item.media_type === "video"
          ? <video src={url} controls className="w-full h-full object-cover" />
          : <img src={url} alt={item.caption ?? "Photo"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        }
      </div>
      {item.caption && <p className="p-3 text-sm text-gray-600 font-medium">{item.caption}</p>}
    </div>
  );
}
