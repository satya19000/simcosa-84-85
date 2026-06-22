import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listBlogs, createBlog, type BlogCategory } from "@/api/blogs";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenLine, Star, ArrowRight, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DropzoneUpload } from "@/components/DropzoneUpload";
import { Linkify } from "@/lib/linkify";
import { uploadToFirebaseStorageResumable } from "@/lib/storage";
import { compressImage } from "@/lib/image-compress";
import { useUploadQueue } from "@/hooks/useUploadQueue";

export const Route = createFileRoute("/_authenticated/blogs")({
  head: () => ({
    meta: [
      { title: "SIMCOSA Blogs — SIMCOSA 84–85" },
      { name: "description", content: "Share opinions, poems, articles and thoughts from our batchmates." },
    ],
  }),
  component: Blogs,
});

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_UPLOAD_MB = 15;

export const CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: "opinions", label: "Opinions" },
  { value: "poems", label: "Poems" },
  { value: "health_tips", label: "Health Tips" },
  { value: "memories", label: "Memories" },
  { value: "events", label: "Events" },
  { value: "general", label: "General" },
];

export const SAMPLE_BLOGS = [
  {
    id: "sample-1",
    title: "Our Golden Days at Siddhartha Medical College",
    category: "memories" as BlogCategory,
    author: "A Batchmate",
    created_at: "2025-01-15T00:00:00.000Z",
    excerpt: "From late-night study sessions to canteen chai breaks — looking back at the years that made us who we are.",
    content:
      "From late-night study sessions to canteen chai breaks, our years at Govt. Siddhartha Medical College shaped not just our careers but our friendships for life. We walked into those gates as nervous teenagers and walked out as doctors and lifelong friends. Every corridor, every exam hall, every hostel room holds a memory worth cherishing. As we look back today, we realise just how golden those days truly were.",
  },
  {
    id: "sample-2",
    title: "Friendship Beyond Time",
    category: "opinions" as BlogCategory,
    author: "A Batchmate",
    created_at: "2025-02-20T00:00:00.000Z",
    excerpt: "Forty years on, the bonds we built in medical college remain as strong as ever — distance and time couldn't change that.",
    content:
      "Forty years on, the bonds we built in medical college remain as strong as ever. We have scattered across cities and continents, taken up different specialities, and built different lives — yet whenever we meet, it feels like no time has passed at all. That, to me, is the true magic of the SIMCOSA 84-85 family — a friendship that distance and time could never change.",
  },
  {
    id: "sample-3",
    title: "A Small Poem for SIMCOSA 84–85",
    category: "poems" as BlogCategory,
    author: "A Batchmate",
    created_at: "2025-03-10T00:00:00.000Z",
    excerpt: "A short verse dedicated to the friends who became family, written for our batch.",
    content:
      "Friends we were, friends we remain,\nThrough joy and loss, through sun and rain.\nSiddhartha's halls still echo our laughter,\nA bond that time runs gently after.\nHere's to the batch of '84 and '85,\nMay our friendship forever stay alive.",
  },
  {
    id: "sample-4",
    title: "Health Tips for Our Age Group",
    category: "health_tips" as BlogCategory,
    author: "A Batchmate",
    created_at: "2025-04-05T00:00:00.000Z",
    excerpt: "A few simple, doctor-approved reminders for staying healthy as we cross our 60s together.",
    content:
      "As doctors ourselves, we know the advice — but here's a gentle reminder for all of us: stay active with a daily walk, keep your blood pressure and sugar checked regularly, eat mindfully, stay hydrated, prioritise sleep, and don't skip your annual health screenings. Just as important — stay socially connected. Batch reunions, calls with old friends, and shared laughter are good for the heart in more ways than one!",
  },
];

function Blogs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [category, setCategory] = useState<BlogCategory>("general");
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const uploadQueue = useUploadQueue();

  const { data: blogs } = useQuery({
    queryKey: ["blogs", activeCategory],
    queryFn: () => listBlogs({ data: activeCategory === "all" ? undefined : { category: activeCategory } }),
  });

  const onPublish = async (e: React.FormEvent<HTMLFormElement>) => {
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
      let uploaded: { url: string; path: string } | null = null;
      if (file) {
        uploadQueue.setStatus(original!, "uploading", 0);
        file = await compressImage(file);
        uploaded = await uploadToFirebaseStorageResumable(file, "blog-images", user.id, (pct) =>
          uploadQueue.setPct(original!, pct),
        );
        uploadQueue.setStatus(original!, "completed", 100);
      }
      await createBlog({
        data: {
          title: String(fd.get("title") || ""),
          content: String(fd.get("content") || ""),
          excerpt: String(fd.get("excerpt") || "") || undefined,
          category,
          url: uploaded?.url,
          storagePath: uploaded?.path,
          fileName: file?.name,
          mimeType: file?.type,
          fileSize: file?.size,
        },
      });
      form.reset();
      setCategory("general");
      setCoverFiles([]);
      setShowForm(false);
      uploadQueue.reset();
      toast.success("Upload completed successfully. Your blog has been published! 📝");
      qc.invalidateQueries({ queryKey: ["blogs"] });
    } catch (err) {
      if (original) uploadQueue.setStatus(original, "error");
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const showSamples = (blogs?.length ?? 0) === 0;
  const categoryLabel = (c: BlogCategory) => CATEGORIES.find(x => x.value === c)?.label ?? c;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Batch Voices</p>
            <h1>SIMCOSA Blogs</h1>
            <p className="text-gray-500 mt-2 text-lg">Share opinions, poems, articles and thoughts from our batchmates.</p>
          </div>
          {user && (
            <Button
              onClick={() => setShowForm(v => !v)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 h-12 rounded-xl shrink-0"
            >
              <PenLine className="h-5 w-5 mr-2" /> Write a Blog
            </Button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={onPublish} className="mx-auto max-w-6xl mt-6 bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="font-semibold text-gray-700">Title *</Label>
                <Input id="title" name="title" required placeholder="Give your blog a title…" className="h-12 mt-1 border-amber-200 rounded-xl" />
              </div>
              <div>
                <Label className="font-semibold text-gray-700">Category *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as BlogCategory)}>
                  <SelectTrigger className="h-12 mt-1 border-amber-200 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="excerpt" className="font-semibold text-gray-700">Short excerpt (optional)</Label>
              <Input id="excerpt" name="excerpt" placeholder="A one-line summary shown on the blog card…" className="h-12 mt-1 border-amber-200 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="content" className="font-semibold text-gray-700">Content *</Label>
              <Textarea id="content" name="content" required rows={6} placeholder="Write your blog…" className="text-base mt-1 border-amber-200 rounded-xl resize-none" />
            </div>
            <div>
              <Label className="font-semibold text-gray-700">Cover image (optional)</Label>
              <DropzoneUpload
                files={coverFiles}
                onFilesChange={setCoverFiles}
                accept="image/*"
                multiple={false}
                disabled={posting}
                className="mt-1"
                progress={uploadQueue.progress}
              />
            </div>
            <div className="flex items-center justify-end gap-4">
              {posting && coverFiles.length > 0 && <span className="text-sm text-amber-700 font-semibold">Uploading… please wait</span>}
              <Button type="submit" disabled={posting} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl">
                {posting ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Category filters */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeCategory === "all" ? "bg-amber-500 text-white shadow-sm" : "bg-white text-gray-600 border border-amber-200 hover:border-amber-400 hover:text-amber-700"}`}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeCategory === c.value ? "bg-amber-500 text-white shadow-sm" : "bg-white text-gray-600 border border-amber-200 hover:border-amber-400 hover:text-amber-700"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {showSamples ? (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <h3 className="font-display font-bold text-gray-700">Sample Blogs</h3>
              <span className="text-xs text-gray-400">(write your own above!)</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SAMPLE_BLOGS
                .filter(b => activeCategory === "all" || b.category === activeCategory)
                .map(b => (
                  <article key={b.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="self-start px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 mb-3">
                        {categoryLabel(b.category)}
                      </span>
                      <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{b.title}</h3>
                      <p className="text-gray-500 text-sm mb-1">{b.author} · {format(new Date(b.created_at), "PPP")}</p>
                      <p className="text-gray-600 leading-relaxed mt-2 flex-1"><Linkify text={b.excerpt} /></p>
                      <Link to="/blogs/$id" params={{ id: b.id }} className="mt-4 inline-flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all">
                        Read More <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogs?.map(b => (
              <article key={b.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden flex flex-col">
                {b.image_url && (
                  <div className="aspect-video bg-amber-50">
                    <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                      {categoryLabel(b.category)}
                    </span>
                    {b.is_featured && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                        <Star className="h-3 w-3 fill-yellow-600" /> Featured
                      </span>
                    )}
                    {!b.is_published && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Hidden</span>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-gray-500 text-sm mb-1">
                    {b.profiles?.full_name ?? "A Batchmate"} · {format(new Date(b.created_at), "PPP")}
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-2 flex-1">{b.excerpt && <Linkify text={b.excerpt} />}</p>
                  <Link to="/blogs/$id" params={{ id: b.id }} className="mt-4 inline-flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all">
                    Read More <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
