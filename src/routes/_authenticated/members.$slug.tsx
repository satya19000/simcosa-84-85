import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, BookOpen, Camera, Film, FileText, Heart, MapPin, Users,
  Smile, Star, Plus, Pencil, Trash2, Check, Loader2, Eye, EyeOff,
  Briefcase, Mail, Phone, MessageCircle, HardDrive, AlertTriangle,
} from "lucide-react";
import {
  getMemberBySlug, listMemberBlogItems, addMemberBlogItem, editMemberBlogItem,
  deleteMemberBlogItem, getMemberStorageUsage,
  type AddMemberBlogItemInput, type EditMemberBlogItemInput, type MemberBlogItem, type MemberStorageUsage,
} from "@/api/memberBlogs";
import { useAuth } from "@/lib/auth";
import { ImageLightbox, type LightboxImage } from "@/components/ImageLightbox";
import { DropzoneUpload } from "@/components/DropzoneUpload";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import { uploadToFirebaseStorageResumable, deleteFromFirebaseStorage } from "@/lib/storage";
import { compressImage } from "@/lib/image-compress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/members/$slug")({
  head: () => ({ meta: [{ title: "Member Blog — SIMCOSA 84–85" }] }),
  component: MemberBlogPage,
});

// ---------- Storage limits (constants — easy to update) ----------
/** Max raw image size before compression check. */
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;   // 10 MB
/** Max video size. Owner/admin can raise this in a future config column. */
export const VIDEO_MAX_BYTES = 25 * 1024 * 1024;  // 25 MB
/** Max size for PDF / Office docs / archives. */
const DOC_MAX_BYTES = 10 * 1024 * 1024;     // 10 MB
/** Per-member blog storage quota. */
export const MEMBER_QUOTA_BYTES = 200 * 1024 * 1024; // 200 MB

// ---------- Tabs ----------
const TABS = [
  { key: "about", label: "About", icon: Star },
  { key: "memories", label: "Memories", icon: Heart },
  { key: "travel", label: "Travel", icon: MapPin },
  { key: "friends", label: "Friends", icon: Users },
  { key: "family", label: "Family", icon: Smile },
  { key: "poems", label: "Poems", icon: BookOpen },
  { key: "thoughts", label: "Thoughts", icon: Star },
  { key: "photos", label: "Photos", icon: Camera },
  { key: "videos", label: "Videos", icon: Film },
  { key: "files", label: "Files", icon: FileText },
] as const;

type TabKey = typeof TABS[number]["key"];

const PHOTO_ACCEPT = "image/*";
const VIDEO_ACCEPT = "video/*";
const FILE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv";

function tabAccept(tab: TabKey): string {
  if (tab === "photos") return PHOTO_ACCEPT;
  if (tab === "videos") return VIDEO_ACCEPT;
  if (tab === "files") return FILE_ACCEPT;
  return PHOTO_ACCEPT;
}

function tabAllowsText(tab: TabKey): boolean {
  return ["memories", "travel", "friends", "family", "poems", "thoughts"].includes(tab);
}

function tabAllowsFile(tab: TabKey): boolean {
  return ["photos", "videos", "files", "memories", "travel", "friends", "family"].includes(tab);
}

function attachmentType(tab: TabKey): string {
  if (tab === "photos") return "photo";
  if (tab === "videos") return "video";
  if (tab === "files") return "file";
  return "photo";
}

/** Validate file size against per-type limits; returns error string or null. */
function validateFileSize(file: File, tab: TabKey): string | null {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (isImage && file.size > IMAGE_MAX_BYTES) {
    return `Image too large (${fmtMB(file.size)}). Maximum is 10 MB.`;
  }
  if (isVideo && file.size > VIDEO_MAX_BYTES) {
    return `Video too large (${fmtMB(file.size)}). Maximum is 25 MB. Please upload a shorter, compressed video.`;
  }
  if (!isImage && !isVideo && file.size > DOC_MAX_BYTES) {
    return `File too large (${fmtMB(file.size)}). Maximum is 10 MB.`;
  }
  return null;
}

function fmtMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// ---------- Storage bar ----------

function StorageBar({ usage }: { usage: MemberStorageUsage }) {
  const pct = Math.min(100, (usage.total_bytes / MEMBER_QUOTA_BYTES) * 100);
  const nearLimit = pct >= 80;
  const atLimit = pct >= 100;
  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-amber-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-600">
          Storage used: {fmtBytes(usage.total_bytes)} / {fmtBytes(MEMBER_QUOTA_BYTES)}
        </span>
        {atLimit && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 ml-auto" />}
      </div>
      <div className="w-full h-2 rounded-full bg-amber-50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${atLimit ? "bg-red-500" : nearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <span>{usage.photo_count} photo{usage.photo_count !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{usage.video_count} video{usage.video_count !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{usage.doc_count} file{usage.doc_count !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{usage.file_count} with attachment{usage.file_count !== 1 ? "s" : ""} total</span>
      </div>
    </div>
  );
}

// ---------- Item form ----------

interface ItemFormProps {
  memberId: string;
  tab: TabKey;
  existing?: MemberBlogItem;
  /** Current bytes already used (for quota pre-check). */
  usedBytes: number;
  onDone: () => void;
}

function ItemForm({ memberId, tab, existing, usedBytes, onDone }: ItemFormProps) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? true);
  const uploadQueue = useUploadQueue();
  const [saving, setSaving] = useState(false);

  const addMutation = useMutation({ mutationFn: (d: AddMemberBlogItemInput) => addMemberBlogItem({ data: d }) });
  const editMutation = useMutation({ mutationFn: (d: EditMemberBlogItemInput) => editMemberBlogItem({ data: d }) });

  const handleFilesChange = (incoming: File[]) => {
    const f = incoming.slice(0, 1);
    if (f.length === 0) { setFiles([]); return; }
    const err = validateFileSize(f[0], tab);
    if (err) { toast.error(err); return; }
    setFiles(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (tab !== "about" && !body.trim() && files.length === 0 && !existing?.file_url) {
      toast.error("Add some content or upload a file.");
      return;
    }
    setSaving(true);
    try {
      let filePayload: Partial<AddMemberBlogItemInput> = {};
      if (files.length > 0) {
        const file = files[0];

        // Quota pre-check (client-side guard before upload).
        if (usedBytes + file.size > MEMBER_QUOTA_BYTES) {
          toast.error("Storage limit reached for this member blog. Please delete old files or contact admin.");
          setSaving(false);
          return;
        }

        const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
        uploadQueue.init([file]);
        uploadQueue.setStatus(file, "uploading");
        const result = await uploadToFirebaseStorageResumable(
          compressed,
          `member-blogs/${memberId}`,
          user.id,
          (pct) => uploadQueue.setPct(file, pct),
        );
        uploadQueue.setStatus(file, "completed");
        filePayload = {
          file_url: result.url,
          fb_storage_path: result.path,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          attachment_type: attachmentType(tab),
        };
      }

      if (existing) {
        await editMutation.mutateAsync({
          id: existing.id,
          title: title || null,
          body: body || null,
          is_published: isPublished,
          ...filePayload,
        });
        toast.success("Updated!");
      } else {
        await addMutation.mutateAsync({
          member_id: memberId,
          category: tab,
          title: title || undefined,
          body: body || undefined,
          is_published: isPublished,
          ...filePayload,
        });
        toast.success("Added!");
      }
      qc.invalidateQueries({ queryKey: ["member-blog", memberId] });
      qc.invalidateQueries({ queryKey: ["member-blog-usage", memberId] });
      onDone();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      // Surface the server-side duplicate error clearly.
      toast.error(msg);
    } finally {
      setSaving(false);
      uploadQueue.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
      {tabAllowsText(tab) && (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-xl border border-amber-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={tab === "poems" ? "Write your poem here…" : tab === "thoughts" ? "Share your thoughts…" : "Write something…"}
            rows={5}
            className="w-full rounded-xl border border-amber-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </>
      )}

      {tabAllowsFile(tab) && !existing?.file_url && (
        <div className="space-y-2">
          <DropzoneUpload
            files={files}
            onFilesChange={handleFilesChange}
            accept={tabAccept(tab)}
            multiple={false}
            disabled={saving}
            progress={uploadQueue.progress}
            label={
              tab === "photos" ? "Upload a photo (max 10 MB — converted to WebP)" :
              tab === "videos" ? "Upload a video (max 25 MB)" :
              tab === "files" ? "Upload a file — PDF, Word, etc. (max 10 MB)" :
              "Attach a photo (optional, max 10 MB)"
            }
          />
          {tab === "videos" && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Videos use more storage. Short compressed videos are recommended to save storage.
            </p>
          )}
          <p className="text-[11px] text-gray-400">
            {tab === "photos" || (tabAllowsText(tab) && tab !== "videos") ? "Images are automatically compressed to WebP." : ""}
            {tab === "files" ? "Accepted: PDF, Word, Excel, PowerPoint, TXT, ZIP, CSV." : ""}
          </p>
        </div>
      )}

      {tab === "photos" && !tabAllowsText(tab) && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full rounded-xl border border-amber-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setIsPublished((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
        >
          {isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {isPublished ? "Visible to members" : "Hidden (draft)"}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-amber-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {existing ? "Save" : "Post"}
        </button>
      </div>
    </form>
  );
}

// ---------- Item card ----------

interface ItemCardProps {
  item: MemberBlogItem;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onImageClick?: () => void;
}

function ItemCard({ item, canEdit, onEdit, onDelete, onImageClick }: ItemCardProps) {
  const isImage = item.mime_type?.startsWith("image/") || item.attachment_type === "photo";
  const isVideo = item.mime_type?.startsWith("video/") || item.attachment_type === "video";

  return (
    <div className={`bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden ${!item.is_published ? "opacity-60" : ""}`}>
      {item.file_url && isImage && (
        <button
          type="button"
          onClick={onImageClick}
          className="block w-full cursor-zoom-in"
          aria-label="Enlarge photo"
        >
          <img src={item.file_url} alt={item.title ?? "Photo"} className="w-full object-cover max-h-72 hover:scale-[1.02] transition-transform duration-300" />
        </button>
      )}
      {item.file_url && isVideo && (
        <video src={item.file_url} controls className="w-full max-h-72 bg-black" />
      )}
      {item.file_url && !isImage && !isVideo && (
        <a
          href={item.file_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100 hover:bg-amber-100 transition-colors"
        >
          <FileText className="h-5 w-5 text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-gray-700 truncate">{item.file_name ?? "Download file"}</span>
          {item.file_size && (
            <span className="ml-auto text-xs text-gray-400 shrink-0">{fmtMB(item.file_size)}</span>
          )}
        </a>
      )}
      <div className="p-4">
        {item.title && <p className="font-bold text-gray-900 mb-1">{item.title}</p>}
        {item.body && <p className="text-gray-700 text-sm whitespace-pre-wrap">{item.body}</p>}
        <div className="flex items-center gap-2 mt-3">
          {!item.is_published && (
            <span className="text-xs rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 font-semibold">Draft</span>
          )}
          {item.file_size && isImage && (
            <span className="text-xs text-gray-300">{fmtMB(item.file_size)}</span>
          )}
          <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
          {canEdit && (
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit"
                className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete"
                className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Photo grid tab ----------

function PhotoGrid({ items, canEdit, onEdit, onDelete }: {
  items: MemberBlogItem[];
  canEdit: boolean;
  onEdit: (item: MemberBlogItem) => void;
  onDelete: (item: MemberBlogItem) => void;
}) {
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const photos = items.filter((i) => i.file_url && (i.mime_type?.startsWith("image/") || i.attachment_type === "photo"));
  const lbImages: LightboxImage[] = photos.map((i) => ({ src: i.file_url!, alt: i.title ?? "Photo", caption: i.title ?? undefined }));

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((item, idx) => (
          <div key={item.id} className="relative group">
            <button
              type="button"
              onClick={() => setLbIndex(idx)}
              className="block w-full aspect-square overflow-hidden rounded-xl cursor-zoom-in"
            >
              <img
                src={item.file_url!}
                alt={item.title ?? "Photo"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
            {canEdit && (
              <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="h-6 w-6 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:text-amber-600 shadow"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="h-6 w-6 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:text-red-600 shadow"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <ImageLightbox images={lbImages} index={lbIndex} onClose={() => setLbIndex(null)} onIndexChange={setLbIndex} />
    </>
  );
}

// ---------- Tab content ----------

interface TabContentProps {
  memberId: string;
  tab: TabKey;
  canEdit: boolean;
  storageUsage: MemberStorageUsage | undefined;
}

function TabContent({ memberId, tab, canEdit, storageUsage }: TabContentProps) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MemberBlogItem | null>(null);
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["member-blog", memberId, tab],
    queryFn: () => listMemberBlogItems({ data: { member_id: memberId, category: tab as string } }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMemberBlogItem({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member-blog", memberId] });
      qc.invalidateQueries({ queryKey: ["member-blog-usage", memberId] });
      toast.success("Deleted");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const handleDelete = async (item: MemberBlogItem) => {
    if (!confirm("Delete this item?")) return;
    if (item.fb_storage_path) {
      try { await deleteFromFirebaseStorage(item.fb_storage_path); } catch { /* best-effort */ }
    }
    deleteMutation.mutate(item.id);
  };

  const atQuota = storageUsage ? storageUsage.total_bytes >= MEMBER_QUOTA_BYTES : false;
  const usedBytes = storageUsage?.total_bytes ?? 0;

  const imageItems = items.filter((i) => i.file_url && (i.mime_type?.startsWith("image/") || i.attachment_type === "photo"));
  const lbImages: LightboxImage[] = imageItems.map((i) => ({ src: i.file_url!, alt: i.title ?? "Photo", caption: i.title ?? undefined }));

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {[0, 1].map((i) => <div key={i} className="h-32 rounded-2xl bg-amber-50 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && atQuota && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          Storage limit reached. Delete old files to free space before uploading more.
        </div>
      )}

      {canEdit && (
        <div className="flex justify-end">
          {!showForm && !editItem && (
            <button
              type="button"
              onClick={() => {
                if (atQuota) {
                  toast.error("Storage limit reached for this member blog. Please delete old files or contact admin.");
                  return;
                }
                setShowForm(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {tab === "photos" ? "Add Photo" : tab === "videos" ? "Add Video" : tab === "files" ? "Upload File" : "Add Post"}
            </button>
          )}
        </div>
      )}

      {showForm && (
        <ItemForm memberId={memberId} tab={tab} usedBytes={usedBytes} onDone={() => setShowForm(false)} />
      )}

      {editItem && (
        <ItemForm memberId={memberId} tab={tab} existing={editItem} usedBytes={usedBytes} onDone={() => setEditItem(null)} />
      )}

      {tab === "photos" ? (
        items.length === 0 ? (
          <EmptyState tab={tab} canEdit={canEdit} onAdd={() => setShowForm(true)} />
        ) : (
          <PhotoGrid
            items={items}
            canEdit={canEdit}
            onEdit={(item) => setEditItem(item)}
            onDelete={handleDelete}
          />
        )
      ) : (
        <>
          {items.length === 0 && <EmptyState tab={tab} canEdit={canEdit} onAdd={() => setShowForm(true)} />}
          <div className={tab === "videos" ? "space-y-4" : "grid sm:grid-cols-2 gap-4"}>
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                canEdit={canEdit}
                onEdit={() => setEditItem(item)}
                onDelete={() => handleDelete(item)}
                onImageClick={() => setLbIndex(imageItems.findIndex((x) => x.id === item.id))}
              />
            ))}
          </div>
        </>
      )}

      {tab !== "photos" && (
        <ImageLightbox images={lbImages} index={lbIndex} onClose={() => setLbIndex(null)} onIndexChange={setLbIndex} />
      )}
    </div>
  );
}

function EmptyState({ tab, canEdit, onAdd }: { tab: TabKey; canEdit: boolean; onAdd: () => void }) {
  const msgs: Record<TabKey, string> = {
    about: "",
    memories: "No memories shared yet.",
    travel: "No travel stories yet.",
    friends: "No friends posts yet.",
    family: "No family posts yet.",
    poems: "No poems posted yet.",
    thoughts: "No thoughts shared yet.",
    photos: "No photos uploaded yet.",
    videos: "No videos uploaded yet.",
    files: "No files shared yet.",
  };
  return (
    <div className="text-center py-14">
      <p className="text-gray-400 text-sm">{msgs[tab]}</p>
      {canEdit && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 flex items-center gap-2 mx-auto rounded-xl border border-amber-300 text-amber-600 hover:bg-amber-50 px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" /> Add something
        </button>
      )}
    </div>
  );
}

// ---------- Main page ----------

function MemberBlogPage() {
  const { slug } = Route.useParams();
  const { user, isAdmin, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("about");

  const { data: member, isLoading } = useQuery({
    queryKey: ["member-by-slug", slug],
    queryFn: () => getMemberBySlug({ data: { slug } }),
  });

  const canEdit = !!(user && member && (user.id === member.id || isAdmin || isOwner));

  // Load storage usage only for the page owner / admin / owner — the server
  // enforces the same check so this is purely a UX optimisation.
  const { data: storageUsage } = useQuery({
    queryKey: ["member-blog-usage", member?.id],
    queryFn: () => getMemberStorageUsage({ data: { member_id: member!.id } }),
    enabled: canEdit && !!member,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p className="text-lg font-semibold">Member not found.</p>
        <Link to="/directory" className="text-amber-600 hover:underline text-sm">← Back to Directory</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Back nav */}
      <div className="bg-white border-b border-amber-100 px-4 py-3">
        <div className="mx-auto max-w-5xl">
          <Link to="/directory" className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-semibold w-fit">
            <ArrowLeft className="h-4 w-4" />
            Members Directory
          </Link>
        </div>
      </div>

      {/* Profile header */}
      <div className="bg-white border-b border-amber-100 px-4 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.full_name} className="h-24 w-24 rounded-full object-cover ring-4 ring-amber-200 shrink-0" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center text-4xl font-bold text-amber-600 shrink-0">
              {member.full_name.charAt(0)}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{member.full_name}</h1>
            {member.profession && (
              <p className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-600 font-semibold mt-1">
                <Briefcase className="h-4 w-4 shrink-0" />{member.profession}
              </p>
            )}
            {member.location && (
              <p className="flex items-center justify-center sm:justify-start gap-1.5 text-gray-500 text-sm mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />{member.location}
              </p>
            )}
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 transition-colors">
                  <Mail className="h-3.5 w-3.5" />{member.email}
                </a>
              )}
              {member.phone && (
                <a href={`tel:${member.phone}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 transition-colors">
                  <Phone className="h-3.5 w-3.5" />{member.phone}
                </a>
              )}
              {member.whatsapp && (
                <a
                  href={`https://wa.me/${member.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-amber-100 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        {/* Storage bar — visible to page owner / admin / owner only */}
        {canEdit && storageUsage && (
          <StorageBar usage={storageUsage} />
        )}

        {activeTab === "about" ? (
          <AboutTab member={member} canEdit={canEdit} />
        ) : (
          <TabContent memberId={member.id} tab={activeTab} canEdit={canEdit} storageUsage={storageUsage} />
        )}
      </div>
    </div>
  );
}

function AboutTab({ member, canEdit }: { member: NonNullable<Awaited<ReturnType<typeof getMemberBySlug>>>; canEdit: boolean }) {
  const fields = [
    { label: "Full Name", value: member.full_name },
    { label: "Profession", value: member.profession },
    { label: "Location", value: member.location },
    { label: "Country / State", value: member.country_state },
    { label: "Clinic / Hospital", value: member.clinic_or_hospital },
    { label: "Spouse", value: member.spouse_name },
    { label: "Email", value: member.email },
    { label: "Phone", value: member.phone },
    { label: "WhatsApp", value: member.whatsapp },
  ];

  return (
    <div className="space-y-6">
      {member.bio && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Bio</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{member.bio}</p>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4">Details</h3>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {fields.map(({ label, value }) =>
            value ? (
              <div key={label}>
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</dt>
                <dd className="text-gray-800 text-sm mt-0.5">{value}</dd>
              </div>
            ) : null,
          )}
        </dl>
      </div>
      {canEdit && (
        <p className="text-center text-xs text-gray-400">
          To update your profile details, go to <Link to="/profile" className="text-amber-500 hover:underline">My Profile</Link>.
        </p>
      )}
    </div>
  );
}
