import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/gallery")({
  head: () => ({ meta: [{ title: "Photo & Video Gallery" }] }),
  component: Gallery,
});

function Gallery() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_items").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file") as File;
    const caption = String(fd.get("caption") || "");
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { error: insErr } = await supabase.from("gallery_items").insert({
      storage_path: path,
      caption,
      media_type: file.type.startsWith("video") ? "video" : "image",
      uploaded_by: user.id,
    });
    setUploading(false);
    if (insErr) return toast.error(insErr.message);
    toast.success("Uploaded");
    form.reset();
    qc.invalidateQueries({ queryKey: ["gallery"] });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1>Photo & Video Gallery</h1>
      <p className="text-muted-foreground mt-2">Old school photos, reunion snaps, candid moments.</p>

      <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <Label htmlFor="file">Add a photo or video</Label>
          <Input id="file" name="file" type="file" accept="image/*,video/*" required className="h-12" />
        </div>
        <div className="flex-1 w-full">
          <Label htmlFor="caption">Caption (optional)</Label>
          <Input id="caption" name="caption" className="h-12" />
        </div>
        <Button type="submit" disabled={uploading} className="h-12 px-6">{uploading ? "Uploading…" : "Upload"}</Button>
      </form>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items?.map((it) => <GalleryItem key={it.id} item={it} />)}
      </div>
      {items?.length === 0 && <p className="mt-6 text-muted-foreground">No photos yet — be the first to upload!</p>}
    </div>
  );
}

function GalleryItem({ item }: { item: { id: string; storage_path: string; media_type: string; caption: string | null } }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("gallery").createSignedUrl(item.storage_path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [item.storage_path]);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="aspect-square bg-secondary flex items-center justify-center">
        {url && (item.media_type === "video"
          ? <video src={url} controls className="w-full h-full object-cover" />
          : <img src={url} alt={item.caption ?? "Photo"} className="w-full h-full object-cover" loading="lazy" />)}
      </div>
      {item.caption && <p className="p-3 text-sm">{item.caption}</p>}
    </div>
  );
}
