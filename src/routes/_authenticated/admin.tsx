import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminGetMediaStats, adminListMedia, adminDeleteMediaItem } from "@/api/media";
import { formatFileSize } from "@/lib/image-compress";
import {
  adminListMembers,
  adminApproveMember, adminRejectMember, adminMarkNeedsClarification, adminDeleteMember,
  adminPromoteToAdmin, adminDemoteAdmin, adminListAdmins, adminAddAdminByEmail,
  adminAddMember, adminImportMembers, type AdminImportRow,
  adminListEvents, adminCreateEvent, adminDeleteEvent,
  adminListAnnouncements, adminCreateAnnouncement, adminDeleteAnnouncement,
  adminListDonations, adminCreateDonation,
  adminListExpenses, adminCreateExpense,
  adminListSupport, adminResolveSupport,
  adminListBlogs, adminDeleteBlog,
  adminListGallery, adminDeleteGalleryItem, adminReorderGallery, type AdminGalleryRow,
  adminListMemories, adminDeleteMemory, adminFindDuplicateMemories, adminMergeMemories, adminEditMemoryAuthor,
} from "@/api/admin";
import { uploadGalleryItem, replaceGalleryItemFile } from "@/api/gallery";
import { postMemory, addMemoryImages } from "@/api/memories";
import { uploadToFirebaseStorageResumable, deleteFromFirebaseStorage } from "@/lib/storage";
import { compressImage } from "@/lib/image-compress";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import type { ApprovalStatus } from "@/backend/auth/service";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropzoneUpload } from "@/components/DropzoneUpload";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="px-4 py-20 text-center">Loading…</div>;
  if (!user) {
    if (typeof window !== "undefined") window.location.replace("/auth");
    return <div className="px-4 py-20 text-center">Redirecting to login…</div>;
  }
  if (!isAdmin) return <div className="px-4 py-20 text-center"><h2>Access Denied</h2><p className="mt-2 text-muted-foreground">You don't have admin access.</p></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1>Admin Dashboard</h1>
      <p className="text-muted-foreground mt-2">Manage members, events, announcements, finances and requests.</p>

      <AddMembersPanel />

      <Tabs defaultValue="pending" className="mt-8">
        <TabsList className="flex flex-wrap h-auto justify-start">
          <TabsTrigger value="pending">Pending Members</TabsTrigger>
          <TabsTrigger value="approved">Approved Members</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Members</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="blogs">Blogs</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="memories">Memories</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6"><PendingMembersTab /></TabsContent>
        <TabsContent value="approved" className="mt-6"><ApprovedMembersTab /></TabsContent>
        <TabsContent value="rejected" className="mt-6"><RejectedMembersTab /></TabsContent>
        <TabsContent value="admins" className="mt-6"><AdminsTab /></TabsContent>
        <TabsContent value="blogs" className="mt-6"><BlogsTab /></TabsContent>
        <TabsContent value="gallery" className="mt-6"><GalleryTab /></TabsContent>
        <TabsContent value="memories" className="mt-6"><MemoriesTab /></TabsContent>
        <TabsContent value="events" className="mt-6"><EventsTab /></TabsContent>
        <TabsContent value="announcements" className="mt-6"><AnnouncementsTab /></TabsContent>
        <TabsContent value="donations" className="mt-6"><DonationsTab /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpensesTab /></TabsContent>
        <TabsContent value="support" className="mt-6"><SupportTab /></TabsContent>
        <TabsContent value="media" className="mt-6"><MediaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function useAdminMembers() {
  return useQuery({ queryKey: ["admin-members"], queryFn: () => adminListMembers() });
}

// Minimal CSV parser: handles a header row, comma delimiters, and double-quoted fields.
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ",") { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    return row;
  });
}

function AddMembersPanel() {
  const qc = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [importStatus, setImportStatus] = useState<ApprovalStatus>("pending");
  const [manualStatus, setManualStatus] = useState<ApprovalStatus>("pending");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-members"] });

  const addManual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setAddingManual(true);
    try {
      await adminAddMember({
        data: {
          full_name: String(fd.get("full_name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          location: String(fd.get("location") || ""),
          profession: String(fd.get("profession") || ""),
          approval_status: manualStatus,
        },
      });
      form.reset();
      setManualStatus("pending");
      toast.success("Member added");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingManual(false);
    }
  };

  const onCsvSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      const rows: AdminImportRow[] = parsed.map((r) => ({
        full_name: r.name || r.full_name || "",
        email: r.email || "",
        phone: r.mobile || r.phone || "",
        location: r.city || r.location || "",
        profession: r.profession || "",
        approval_status: (r.approval_status?.trim().toLowerCase() || undefined) as ApprovalStatus | undefined,
      }));
      if (rows.length === 0) {
        toast.error("No rows found. Expected columns: name, email, mobile, city, profession, approval_status");
        return;
      }
      const res = await adminImportMembers({ data: { rows, approval_status: importStatus } });
      toast.success(`Imported ${res.imported} member(s)${res.skipped ? `, skipped ${res.skipped}` : ""}`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5 space-y-6">
      <div>
        <h3 className="font-semibold">Add Member Manually</h3>
        <form onSubmit={addManual} className="mt-3 grid sm:grid-cols-2 gap-3">
          <div><Label>Full name</Label><Input name="full_name" required className="h-11" /></div>
          <div><Label>Email</Label><Input name="email" type="email" required className="h-11" /></div>
          <div><Label>Mobile</Label><Input name="phone" className="h-11" /></div>
          <div><Label>City</Label><Input name="location" className="h-11" /></div>
          <div><Label>Profession</Label><Input name="profession" className="h-11" /></div>
          <div>
            <Label>Approval status</Label>
            <Select value={manualStatus} onValueChange={(v) => setManualStatus(v as ApprovalStatus)}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={addingManual} className="sm:col-span-2 h-11">
            {addingManual ? "Adding…" : "Add member"}
          </Button>
        </form>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="font-semibold">Bulk Import (CSV)</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Columns: name, email, mobile, city, profession, approval_status (optional, defaults to the dropdown below if missing). Existing emails are updated, not duplicated.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <Select value={importStatus} onValueChange={(v) => setImportStatus(v as ApprovalStatus)}>
            <SelectTrigger className="h-11 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Import as Pending</SelectItem>
              <SelectItem value="approved">Import as Approved</SelectItem>
            </SelectContent>
          </Select>
          <Input type="file" accept=".csv,text/csv" onChange={onCsvSelected} disabled={importing} className="h-11 max-w-xs" />
          {importing && <span className="text-sm text-muted-foreground">Importing…</span>}
        </div>
      </div>
    </div>
  );
}

function PendingMembersTab() {
  const qc = useQueryClient();
  const { data } = useAdminMembers();
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const pending = data?.filter((m) => m.approval_status === "pending" || m.approval_status === "needs_clarification") ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-members"] });

  const approve = async (id: string) => {
    try {
      await adminApproveMember({ data: { id } });
      toast.success("Member approved!");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const reject = async (id: string) => {
    try {
      await adminRejectMember({ data: { id, reason } });
      toast.success("Member rejected");
      setReasonFor(null);
      setReason("");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const clarify = async (id: string) => {
    try {
      await adminMarkNeedsClarification({ data: { id, reason } });
      toast.success("Marked as needs clarification");
      setReasonFor(null);
      setReason("");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const remove = async (id: string) => {
    try {
      await adminDeleteMember({ data: { id } });
      toast.success("Signup request deleted");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (pending.length === 0) {
    return <p className="text-muted-foreground">No pending members. All caught up! 🎉</p>;
  }

  return (
    <div className="space-y-3">
      {pending.map((m) => (
        <div key={m.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap justify-between gap-3 items-start">
            <div className="flex gap-3 items-center">
              {m.photo_url && (
                <img src={m.photo_url} alt={m.full_name ?? ""} className="h-12 w-12 rounded-full object-cover" />
              )}
              <div>
                <p className="font-semibold">
                  {m.full_name}{" "}
                  {m.approval_status === "needs_clarification" && (
                    <span className="text-xs text-amber-600 ml-1">[needs clarification]</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{m.email}</p>
                <p className="text-sm text-muted-foreground">{m.phone || m.whatsapp || "no phone"} · {m.location || "no city"} · {m.profession || "no profession"}</p>
                <p className="text-xs text-muted-foreground mt-1">Signed up {format(new Date(m.created_at), "PPP")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => approve(m.id)} className="h-10">Approve</Button>
              <Button onClick={() => setReasonFor(reasonFor === m.id ? null : m.id)} variant="outline" className="h-10">Reject</Button>
              <Button onClick={() => remove(m.id)} variant="ghost" className="h-10 text-destructive">Delete</Button>
            </div>
          </div>
          {reasonFor === m.id && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                className="h-10 max-w-xs"
              />
              <Button onClick={() => reject(m.id)} variant="destructive" className="h-10">Confirm reject</Button>
              <Button onClick={() => clarify(m.id)} variant="outline" className="h-10">Ask for clarification</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ApprovedMembersTab() {
  const qc = useQueryClient();
  const { data } = useAdminMembers();
  const [search, setSearch] = useState("");
  const { data: adminData } = useQuery({ queryKey: ["admin-admins"], queryFn: () => adminListAdmins() });

  const approved = (data?.filter((m) => m.approval_status === "approved") ?? []).filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (m.full_name ?? "").toLowerCase().includes(q) ||
      (m.location ?? "").toLowerCase().includes(q) ||
      (m.profession ?? "").toLowerCase().includes(q)
    );
  });
  const adminIds = new Set((adminData ?? []).map((a) => a.id));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-members"] });
    qc.invalidateQueries({ queryKey: ["admin-admins"] });
  };

  const promote = async (id: string) => {
    try {
      await adminPromoteToAdmin({ data: { id } });
      toast.success("Promoted to admin");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const disable = async (id: string) => {
    try {
      await adminRejectMember({ data: { id, reason: "Disabled by admin" } });
      toast.success("Member disabled");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, city or profession…"
        className="h-11 mb-4 max-w-md"
      />
      <div className="space-y-3">
        {approved.length === 0 && <p className="text-muted-foreground">No approved members found.</p>}
        {approved.map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
            <div>
              <p className="font-semibold">
                {m.full_name} {adminIds.has(m.id) && <span className="text-xs text-gold ml-2">★ Admin</span>}
              </p>
              <p className="text-sm text-muted-foreground">{m.email}</p>
              <p className="text-sm text-muted-foreground">{m.location || "—"} · {m.profession || "—"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!adminIds.has(m.id) && (
                <Button onClick={() => promote(m.id)} variant="outline" className="h-10">Make Admin</Button>
              )}
              <Button onClick={() => disable(m.id)} variant="outline" className="h-10 text-destructive">Disable</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RejectedMembersTab() {
  const qc = useQueryClient();
  const { data } = useAdminMembers();
  const rejected = data?.filter((m) => m.approval_status === "rejected") ?? [];

  const reconsider = async (id: string) => {
    try {
      await adminApproveMember({ data: { id } });
      toast.success("Member approved");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (rejected.length === 0) {
    return <p className="text-muted-foreground">No rejected members.</p>;
  }

  return (
    <div className="space-y-3">
      {rejected.map((m) => (
        <div key={m.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
          <div>
            <p className="font-semibold">{m.full_name}</p>
            <p className="text-sm text-muted-foreground">{m.email}</p>
            {m.rejection_reason && <p className="text-sm text-destructive mt-1">Reason: {m.rejection_reason}</p>}
          </div>
          <Button onClick={() => reconsider(m.id)} variant="outline" className="h-10">Reconsider & approve</Button>
        </div>
      ))}
    </div>
  );
}

function AdminsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-admins"], queryFn: () => adminListAdmins() });
  const [email, setEmail] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-admins"] });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAddAdminByEmail({ data: { email } });
      toast.success("Admin added");
      setEmail("");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const remove = async (id: string) => {
    try {
      await adminDemoteAdmin({ data: { id } });
      toast.success("Admin removed");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <form onSubmit={add} className="flex flex-wrap gap-2 mb-6">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@email.com"
          required
          className="h-11 max-w-xs"
        />
        <Button type="submit" className="h-11">Add admin by email</Button>
      </form>
      <div className="space-y-3">
        {data?.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
            <div>
              <p className="font-semibold">{a.full_name}</p>
              <p className="text-sm text-muted-foreground">{a.email}</p>
            </div>
            <Button onClick={() => remove(a.id)} variant="outline" className="h-10 text-destructive">Remove admin</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-blogs"], queryFn: () => adminListBlogs() });
  const del = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await adminDeleteBlog({ data: { id } });
      toast.success("Blog deleted");
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      qc.invalidateQueries({ queryKey: ["blogs"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  if (data?.length === 0) return <p className="text-muted-foreground">No blogs yet.</p>;
  return (
    <div className="space-y-3">
      {data?.map((b) => (
        <div key={b.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
          <div>
            <p className="font-semibold">{b.title} {b.is_featured && <span className="text-xs text-gold ml-1">★ featured</span>} {!b.is_published && <span className="text-xs text-muted-foreground ml-1">[unpublished]</span>}</p>
            <p className="text-sm text-muted-foreground">By {b.profiles?.full_name ?? "Unknown"} · {format(new Date(b.created_at), "PPP")}</p>
          </div>
          <Button onClick={() => del(b.id)} variant="outline" className="h-10 text-destructive">Delete</Button>
        </div>
      ))}
    </div>
  );
}

const MAX_ADMIN_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Trims and lowercases a filename/storage_path for case-insensitive bulk-replace matching. */
function normalizeFileName(value: string): string {
  return value.trim().toLowerCase();
}

function GalleryTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-gallery"], queryFn: () => adminListGallery() });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const uploadQueue = useUploadQueue();
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const bulkQueue = useUploadQueue();
  const [bulkSummary, setBulkSummary] = useState<{ matched: number; uploaded: number; failed: number; unmatched: File[] } | null>(null);
  const [unmatchedUploading, setUnmatchedUploading] = useState(false);
  const unmatchedQueue = useUploadQueue();

  const replaceFile = async (id: string, file: File) => {
    if (!user) return;
    setReplacingId(id);
    try {
      const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
      const { url, path } = await uploadToFirebaseStorageResumable(compressed, "gallery", user.id);
      await replaceGalleryItemFile({
        data: { id, url, storagePath: path, fileName: compressed.name, mimeType: compressed.type, fileSize: compressed.size },
      });
      toast.success("File replaced");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Replace failed");
    } finally {
      setReplacingId(null);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await adminDeleteGalleryItem({ data: { id } });
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      if (res.fbStoragePath) {
        deleteFromFirebaseStorage(res.fbStoragePath).catch((err) =>
          console.error("[admin/gallery] failed to delete storage object:", err),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const moveGalleryItem = async (id: string, kind: "up" | "down" | "top" | "bottom") => {
    if (!data) return;
    const ids = data.map((g) => g.id);
    const idx = ids.indexOf(id);
    if (idx === -1) return;
    let newIdx: number;
    if (kind === "up") newIdx = idx - 1;
    else if (kind === "down") newIdx = idx + 1;
    else if (kind === "top") newIdx = 0;
    else newIdx = ids.length - 1;
    if (newIdx < 0 || newIdx >= ids.length || newIdx === idx) return;
    const reordered = [...ids];
    reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, id);
    try {
      await adminReorderGallery({ data: { orderedItemIds: reordered } });
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Photo order updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update order");
    }
  };

  const upload = async () => {
    if (files.length === 0 || !user) return;
    for (const file of files) {
      if (file.size > MAX_ADMIN_UPLOAD_BYTES) {
        toast.error(`"${file.name}" is too large. Please upload a smaller image or compressed version.`);
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
          data: { url, storagePath: path, fileName: file.name, mimeType: file.type, fileSize: file.size },
        });
        uploadQueue.setStatus(original, "completed", 100);
        succeeded++;
      } catch (err) {
        uploadQueue.setStatus(original, "error");
        failed++;
        console.error("[admin/gallery] upload failed:", err);
      }
    }
    if (failed === 0) {
      toast.success("Upload completed successfully.");
      setFiles([]);
      uploadQueue.reset();
    } else {
      toast.error(`Upload failed. Please try again. (Uploaded: ${succeeded}, Failed: ${failed})`);
    }
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
    setUploading(false);
  };

  // Matches each selected file by filename against gallery_items.storage_path
  // (case-insensitive, trimmed) and replaces only rows that are still missing
  // a file (no file_url and no fb_storage_path) and not deleted. Each row is
  // matched at most once, even if multiple selected files share a name.
  const runBulkReplace = async () => {
    if (bulkFiles.length === 0 || !user || !data) return;
    setBulkRunning(true);
    bulkQueue.init(bulkFiles);

    const eligible = data.filter((g) => !g.file_url && !g.fb_storage_path);
    const usedRowIds = new Set<string>();
    const matches: { file: File; row: AdminGalleryRow }[] = [];
    const unmatched: File[] = [];
    for (const file of bulkFiles) {
      const row = eligible.find(
        (g) => !usedRowIds.has(g.id) && normalizeFileName(g.storage_path) === normalizeFileName(file.name),
      );
      if (row) {
        usedRowIds.add(row.id);
        matches.push({ file, row });
      } else {
        unmatched.push(file);
        bulkQueue.setStatus(file, "error");
      }
    }

    let uploaded = 0;
    let failed = 0;
    for (const { file, row } of matches) {
      bulkQueue.setStatus(file, "uploading", 0);
      try {
        const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;
        const { url, path } = await uploadToFirebaseStorageResumable(compressed, "gallery", user.id, (pct) =>
          bulkQueue.setPct(file, pct),
        );
        await replaceGalleryItemFile({
          data: { id: row.id, url, storagePath: path, fileName: compressed.name, mimeType: compressed.type, fileSize: compressed.size },
        });
        bulkQueue.setStatus(file, "completed", 100);
        uploaded++;
      } catch (err) {
        bulkQueue.setStatus(file, "error");
        failed++;
        console.error("[admin/gallery] bulk replace failed:", err);
      }
    }

    setBulkSummary({ matched: matches.length, uploaded, failed, unmatched });
    if (uploaded > 0) {
      toast.success(`Bulk replace: ${uploaded} file(s) restored.`);
    }
    if (failed > 0) {
      toast.error(`Bulk replace: ${failed} file(s) failed to upload.`);
    }
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
    setBulkRunning(false);
  };

  const uploadUnmatchedAsNew = async () => {
    const unmatched = bulkSummary?.unmatched ?? [];
    if (unmatched.length === 0 || !user) return;
    setUnmatchedUploading(true);
    unmatchedQueue.init(unmatched);
    let succeeded = 0;
    let failed = 0;
    for (const original of unmatched) {
      let file = original;
      unmatchedQueue.setStatus(original, "uploading", 0);
      try {
        if (file.type.startsWith("image/")) {
          file = await compressImage(file);
        }
        const { url, path } = await uploadToFirebaseStorageResumable(file, "gallery", user.id, (pct) =>
          unmatchedQueue.setPct(original, pct),
        );
        await uploadGalleryItem({
          data: { url, storagePath: path, fileName: file.name, mimeType: file.type, fileSize: file.size },
        });
        unmatchedQueue.setStatus(original, "completed", 100);
        succeeded++;
      } catch (err) {
        unmatchedQueue.setStatus(original, "error");
        failed++;
        console.error("[admin/gallery] unmatched upload failed:", err);
      }
    }
    if (failed === 0) {
      toast.success("Unmatched files uploaded as new gallery items.");
      setBulkSummary((s) => (s ? { ...s, unmatched: [] } : s));
      setBulkFiles([]);
      bulkQueue.reset();
      unmatchedQueue.reset();
    } else {
      toast.error(`Some uploads failed. (Uploaded: ${succeeded}, Failed: ${failed})`);
    }
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
    setUnmatchedUploading(false);
  };

  return (
    <div>
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 mb-6">
        <h3 className="font-semibold mb-1">Bulk Replace Missing Files</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Use this only for old missing photos. File names should match the old photo names.
        </p>
        <DropzoneUpload
          files={bulkFiles}
          onFilesChange={setBulkFiles}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          disabled={bulkRunning}
          progress={bulkQueue.progress}
          label="Drag and drop the matching old photos here, or click to browse"
        />
        {bulkFiles.length > 0 && (
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <Button onClick={runBulkReplace} disabled={bulkRunning} className="h-11">
              {bulkRunning ? "Replacing…" : `Replace from ${bulkFiles.length} file(s)`}
            </Button>
            {bulkRunning && (
              <span className="text-sm text-amber-700 font-semibold">
                Processing {Math.min(bulkQueue.completedCount + bulkQueue.failedCount + 1, bulkQueue.total)} of {bulkQueue.total} files… please wait
              </span>
            )}
          </div>
        )}
        {bulkSummary && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-white p-3 text-sm space-y-2">
            <p>
              Total selected: <strong>{bulkFiles.length}</strong> · Matched: <strong>{bulkSummary.matched}</strong> ·
              {" "}Replaced: <strong className="text-emerald-600">{bulkSummary.uploaded}</strong> ·
              {" "}Failed: <strong className="text-destructive">{bulkSummary.failed}</strong> ·
              {" "}Unmatched: <strong>{bulkSummary.unmatched.length}</strong>
            </p>
            {bulkSummary.unmatched.length > 0 && (
              <div>
                <p className="text-muted-foreground">Unmatched files (no old gallery row found for this filename):</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  {bulkSummary.unmatched.map((f) => (
                    <li key={f.name}>{f.name}</li>
                  ))}
                </ul>
                <Button
                  onClick={uploadUnmatchedAsNew}
                  disabled={unmatchedUploading}
                  variant="outline"
                  className="h-9 mt-2 text-sm"
                >
                  {unmatchedUploading ? "Uploading…" : "Upload unmatched files as new gallery items"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h3 className="font-semibold mb-3">Upload photos/files</h3>
        <DropzoneUpload
          files={files}
          onFilesChange={setFiles}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          disabled={uploading}
          progress={uploadQueue.progress}
        />
        {files.some((f) => f.type.startsWith("video/")) && (
          <p className="text-xs text-amber-600 mt-1.5 font-medium">Videos may take longer depending on file size and internet speed.</p>
        )}
        {files.length > 0 && (
          <div className="mt-3 flex items-center gap-4">
            <Button onClick={upload} disabled={uploading} className="h-11">
              {uploading ? "Uploading…" : `Upload ${files.length} item(s)`}
            </Button>
            {uploading && (
              <span className="text-sm text-amber-700 font-semibold">
                Uploading {Math.min(uploadQueue.completedCount + uploadQueue.failedCount + 1, uploadQueue.total)} of {uploadQueue.total} files… please wait
              </span>
            )}
          </div>
        )}
      </div>
    {data?.length === 0 && <p className="text-muted-foreground">No gallery items yet.</p>}
    <div className="space-y-3">
      {data?.map((g, gi) => (
        <div key={g.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                aria-label="Move to top"
                disabled={gi === 0}
                onClick={() => moveGalleryItem(g.id, "top")}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronsUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move up"
                disabled={gi === 0}
                onClick={() => moveGalleryItem(g.id, "up")}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={gi === (data?.length ?? 0) - 1}
                onClick={() => moveGalleryItem(g.id, "down")}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move to bottom"
                disabled={gi === (data?.length ?? 0) - 1}
                onClick={() => moveGalleryItem(g.id, "bottom")}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronsDown className="h-3.5 w-3.5" />
              </button>
            </div>
            {g.file_available && g.media_type === "image" ? (
              <img src={g.file_url!} alt={g.caption ?? g.title ?? "Photo"} className="h-14 w-14 rounded-lg object-cover shrink-0" loading="lazy" />
            ) : g.file_available ? (
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">Video</div>
            ) : (
              <div className="h-14 w-14 rounded-lg bg-destructive/10 flex items-center justify-center text-[10px] text-destructive text-center px-1 shrink-0">File missing</div>
            )}
            <div>
              <p className="font-semibold">{g.title || g.caption || g.storage_path} <span className="text-xs text-muted-foreground ml-1 capitalize">[{g.media_type}]</span></p>
              <p className="text-sm text-muted-foreground">By {g.profiles?.full_name ?? "Unknown"} · {format(new Date(g.created_at), "PPP")}</p>
              {!g.file_available && (
                <p className="text-xs text-destructive font-medium mt-0.5">Old photo file missing. Please re-upload this image.</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center h-10 px-3 rounded-md border border-border text-sm font-medium cursor-pointer hover:bg-accent">
              {replacingId === g.id ? "Uploading…" : "Replace file"}
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                disabled={replacingId === g.id}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) replaceFile(g.id, file);
                }}
              />
            </label>
            <Button onClick={() => del(g.id)} variant="outline" className="h-10 text-destructive">Delete</Button>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}

function MemoriesTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-memories"], queryFn: () => adminListMemories() });
  const [files, setFiles] = useState<File[]>([]);
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [posting, setPosting] = useState(false);
  const uploadQueue = useUploadQueue();
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [editingAuthorValue, setEditingAuthorValue] = useState("");
  const [savingAuthor, setSavingAuthor] = useState(false);

  const startEditAuthor = (id: string, current: string | null) => {
    setEditingAuthorId(id);
    setEditingAuthorValue(current ?? "");
  };

  const saveAuthor = async (id: string) => {
    setSavingAuthor(true);
    try {
      await adminEditMemoryAuthor({ data: { id, authorName: editingAuthorValue || undefined } });
      toast.success("Author name updated");
      setEditingAuthorId(null);
      qc.invalidateQueries({ queryKey: ["admin-memories"] });
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingAuthor(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await adminDeleteMemory({ data: { id } });
      toast.success("Memory deleted");
      qc.invalidateQueries({ queryKey: ["admin-memories"] });
      qc.invalidateQueries({ queryKey: ["memories"] });
      for (const path of res.fbStoragePaths) {
        deleteFromFirebaseStorage(path).catch((err) =>
          console.error("[admin/memories] failed to delete storage object:", err),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const post = async () => {
    if (!body.trim() || !user) return;
    const oversized = files.find((f) => f.size > MAX_ADMIN_UPLOAD_BYTES);
    if (oversized) {
      toast.error(`"${oversized.name}" is too large. Please upload a smaller image or compressed version.`);
      return;
    }
    setPosting(true);
    if (files.length > 0) uploadQueue.init(files);
    try {
      const { id: memoryId } = await postMemory({ data: { body, authorName: authorName || undefined } });
      const uploadedImages: { url: string; storagePath: string; fileName: string; mimeType: string; fileSize: number }[] = [];
      for (const original of files) {
        try {
          uploadQueue.setStatus(original, "uploading", 0);
          const compressed = await compressImage(original);
          const uploaded = await uploadToFirebaseStorageResumable(compressed, "memories", user.id, (pct) =>
            uploadQueue.setPct(original, pct),
          );
          uploadedImages.push({
            url: uploaded.url,
            storagePath: uploaded.path,
            fileName: compressed.name,
            mimeType: compressed.type,
            fileSize: compressed.size,
          });
          uploadQueue.setStatus(original, "completed", 100);
        } catch (err) {
          uploadQueue.setStatus(original, "error");
          throw err;
        }
      }
      if (uploadedImages.length > 0) {
        await addMemoryImages({ data: { memoryId, images: uploadedImages } });
      }
      setBody("");
      setAuthorName("");
      setFiles([]);
      uploadQueue.reset();
      toast.success("Upload completed successfully. Memory posted.");
      qc.invalidateQueries({ queryKey: ["admin-memories"] });
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-semibold">Post a memory with photo</h3>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Share a memory…" />
        <div>
          <Label>Posted on behalf of / Batchmate name (optional)</Label>
          <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="e.g. Dr. Srilatha" className="h-11" />
        </div>
        <DropzoneUpload files={files} onFilesChange={setFiles} accept="image/*" multiple disabled={posting} progress={uploadQueue.progress} />
        <div className="flex items-center gap-4">
          <Button onClick={post} disabled={posting || !body.trim()} className="h-11">
            {posting ? "Posting…" : "Post memory"}
          </Button>
          {posting && files.length > 0 && <span className="text-sm text-amber-700 font-semibold">Uploading… please wait</span>}
        </div>
      </div>
      <MergeDuplicateMemories />
      {data?.length === 0 && <p className="text-muted-foreground">No memories yet.</p>}
      <div className="space-y-3">
        {data?.map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
            <div>
              <p className="font-semibold">{m.title || "Untitled"}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">{m.body}</p>
              <p className="text-sm text-muted-foreground">
                Shown as {m.display_name} · uploaded by {m.profiles?.full_name ?? "Unknown"} · {format(new Date(m.created_at), "PPP")}
              </p>
              {editingAuthorId === m.id ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input
                    value={editingAuthorValue}
                    onChange={(e) => setEditingAuthorValue(e.target.value)}
                    placeholder="Leave blank to show uploader's profile name"
                    className="h-9 max-w-xs"
                  />
                  <Button onClick={() => saveAuthor(m.id)} disabled={savingAuthor} className="h-9">Save</Button>
                  <Button onClick={() => setEditingAuthorId(null)} variant="outline" className="h-9">Cancel</Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEditAuthor(m.id, m.author_name)}
                  className="mt-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                  Edit author name
                </button>
              )}
            </div>
            <Button onClick={() => del(m.id)} variant="outline" className="h-10 text-destructive">Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MergeDuplicateMemories() {
  const qc = useQueryClient();
  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-duplicate-memories"],
    queryFn: () => adminFindDuplicateMemories(),
  });
  const [mergingKey, setMergingKey] = useState<string | null>(null);

  const merge = async (keepId: string, duplicateIds: string[], key: string) => {
    if (!confirm(`Merge ${duplicateIds.length} duplicate post(s) into one memory? Their photos will be combined and the duplicates deleted.`)) return;
    setMergingKey(key);
    try {
      await adminMergeMemories({ data: { keepId, duplicateIds } });
      toast.success("Duplicates merged");
      qc.invalidateQueries({ queryKey: ["admin-duplicate-memories"] });
      qc.invalidateQueries({ queryKey: ["admin-memories"] });
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Merge failed");
    } finally {
      setMergingKey(null);
    }
  };

  if (isLoading || !groups || groups.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 mb-6 space-y-3">
      <h3 className="font-semibold">Merge duplicate memories</h3>
      <p className="text-sm text-muted-foreground">
        These posts have the same title, story, and author, created within minutes of each other — likely one memory split into several posts. Merging combines all their photos into the first post and removes the duplicates.
      </p>
      <div className="space-y-2">
        {groups.map((g, gi) => {
          const key = `${g.user_id}-${gi}`;
          const [keep, ...dupes] = g.memories;
          return (
            <div key={key} className="rounded-lg border border-amber-200 bg-white p-3 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-semibold">{g.title || "Untitled"}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{g.body}</p>
                <p className="text-sm text-muted-foreground">
                  By {g.full_name ?? "Unknown"} · {g.memories.length} posts, {g.memories.reduce((n, m) => n + m.image_count, 0)} total photos
                </p>
              </div>
              <Button
                onClick={() => merge(keep.id, dupes.map((d) => d.id), key)}
                disabled={mergingKey === key}
                className="h-10"
              >
                {mergingKey === key ? "Merging…" : "Merge into one post"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-events"], queryFn: () => adminListEvents() });
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const uploadQueue = useUploadQueue();

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const eventDate = new Date(String(fd.get("event_date"))).toISOString();

    let file = coverFiles[0];
    if (file && file.size > MAX_ADMIN_UPLOAD_BYTES) {
      toast.error("This file is too large. Please upload a smaller image or compressed version.");
      return;
    }

    setCreating(true);
    const original = file;
    if (original) uploadQueue.init([original]);
    try {
      let uploaded: { url: string; path: string } | null = null;
      if (file) {
        uploadQueue.setStatus(original!, "uploading", 0);
        file = await compressImage(file);
        uploaded = await uploadToFirebaseStorageResumable(file, "event-covers", user.id, (pct) =>
          uploadQueue.setPct(original!, pct),
        );
        uploadQueue.setStatus(original!, "completed", 100);
      }
      await adminCreateEvent({
        data: {
          title: String(fd.get("title") || ""),
          description: String(fd.get("description") || "") || undefined,
          location: String(fd.get("location") || "") || undefined,
          event_date: eventDate,
          url: uploaded?.url,
          storagePath: uploaded?.path,
          fileName: file?.name,
          mimeType: file?.type,
          fileSize: file?.size,
        },
      });
      form.reset();
      setCoverFiles([]);
      uploadQueue.reset();
      toast.success("Upload completed successfully. Event created.");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    } catch (err) {
      if (original) uploadQueue.setStatus(original, "error");
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setCreating(false);
    }
  };
  const del = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const res = await adminDeleteEvent({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-events"] });
    qc.invalidateQueries({ queryKey: ["events"] });
    if (res.fbStoragePath) {
      deleteFromFirebaseStorage(res.fbStoragePath).catch((err) =>
        console.error("[admin/events] failed to delete storage object:", err),
      );
    }
  };
  return (
    <div>
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 grid sm:grid-cols-2 gap-3">
        <div><Label>Title</Label><Input name="title" required className="h-11" /></div>
        <div><Label>Date & time</Label><Input name="event_date" type="datetime-local" required className="h-11" /></div>
        <div><Label>Location</Label><Input name="location" className="h-11" /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea name="description" rows={3} /></div>
        <div className="sm:col-span-2">
          <Label>Cover image (optional)</Label>
          <DropzoneUpload files={coverFiles} onFilesChange={setCoverFiles} accept="image/*" multiple={false} disabled={creating} className="mt-1" progress={uploadQueue.progress} />
        </div>
        <div className="sm:col-span-2 flex items-center gap-4">
          <Button type="submit" disabled={creating} className="h-11">
            {creating ? "Creating…" : "Create event"}
          </Button>
          {creating && coverFiles.length > 0 && <span className="text-sm text-amber-700 font-semibold">Uploading… please wait</span>}
        </div>
      </form>
      <div className="mt-6 space-y-3">
        {data?.map((e) => (
          <div key={e.id} className="rounded-lg border border-border bg-card p-4 flex justify-between gap-3 items-center">
            <div className="flex items-center gap-3">
              {e.cover_url && <img src={e.cover_url} alt={e.title} className="h-12 w-12 rounded-lg object-cover shrink-0" loading="lazy" />}
              <div><p className="font-semibold">{e.title}</p><p className="text-sm text-muted-foreground">{format(new Date(e.event_date), "PPP p")}</p></div>
            </div>
            <Button variant="outline" onClick={() => del(e.id)}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsTab() {
  const qc = useQueryClient();
  const [kind, setKind] = useState("notice");
  const { data } = useQuery({ queryKey: ["admin-announcements"], queryFn: () => adminListAnnouncements() });
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await adminCreateAnnouncement({ data: {
        kind: kind as "birthday" | "achievement" | "condolence" | "notice",
        title: String(fd.get("title")),
        body: String(fd.get("body") || ""),
      } });
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const del = async (id: string) => {
    await adminDeleteAnnouncement({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };
  return (
    <div>
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div><Label>Kind</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="achievement">Achievement</SelectItem>
              <SelectItem value="condolence">Condolence</SelectItem>
              <SelectItem value="notice">Notice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Title</Label><Input name="title" required className="h-11" /></div>
        <div><Label>Body</Label><Textarea name="body" rows={3} /></div>
        <Button type="submit" className="h-11">Post announcement</Button>
      </form>
      <div className="mt-6 space-y-3">
        {data?.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card p-4 flex justify-between gap-3">
            <div><p className="font-semibold">{a.title}</p><p className="text-sm text-muted-foreground capitalize">{a.kind}</p></div>
            <Button variant="outline" onClick={() => del(a.id)}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonationsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-donations"], queryFn: () => adminListDonations() });
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await adminCreateDonation({ data: {
        donor_name: String(fd.get("donor_name")),
        amount: Number(fd.get("amount")),
        purpose: String(fd.get("purpose") || ""),
      } });
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin-donations"] });
      qc.invalidateQueries({ queryKey: ["donations"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  return (
    <div>
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 grid sm:grid-cols-3 gap-3">
        <div><Label>Donor name</Label><Input name="donor_name" required className="h-11" /></div>
        <div><Label>Amount (₹)</Label><Input name="amount" type="number" step="0.01" required className="h-11" /></div>
        <div><Label>Purpose</Label><Input name="purpose" className="h-11" /></div>
        <Button type="submit" className="sm:col-span-3 h-11">Add donation</Button>
      </form>
      <div className="mt-6 space-y-2">
        {data?.map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-card p-4 flex justify-between">
            <div><p className="font-medium">{d.donor_name}</p><p className="text-sm text-muted-foreground">{d.purpose}</p></div>
            <p className="font-display text-lg">₹{Number(d.amount).toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpensesTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-expenses"], queryFn: () => adminListExpenses() });
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await adminCreateExpense({ data: {
        description: String(fd.get("description")),
        amount: Number(fd.get("amount")),
        category: String(fd.get("category") || ""),
      } });
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin-expenses"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  return (
    <div>
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 grid sm:grid-cols-3 gap-3">
        <div><Label>Description</Label><Input name="description" required className="h-11" /></div>
        <div><Label>Amount (₹)</Label><Input name="amount" type="number" step="0.01" required className="h-11" /></div>
        <div><Label>Category</Label><Input name="category" className="h-11" /></div>
        <Button type="submit" className="sm:col-span-3 h-11">Add expense</Button>
      </form>
      <div className="mt-6 space-y-2">
        {data?.map((e) => (
          <div key={e.id} className="rounded-lg border border-border bg-card p-4 flex justify-between">
            <div><p className="font-medium">{e.description}</p><p className="text-sm text-muted-foreground">{e.category}</p></div>
            <p className="font-display text-lg text-destructive">₹{Number(e.amount).toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaTab() {
  const qc = useQueryClient();
  const [source, setSource] = useState<string>("all");
  const [mediaType, setMediaType] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const PAGE_SIZE = 50;

  const { data: stats } = useQuery({
    queryKey: ["admin-media-stats"],
    queryFn: () => adminGetMediaStats(),
  });

  const { data: items, isFetching } = useQuery({
    queryKey: ["admin-media", source, mediaType, sort, page],
    queryFn: () =>
      adminListMedia({
        data: {
          source: source === "all" ? "all" : (source as "gallery" | "memory_image" | "blog" | "event"),
          media_type: mediaType === "all" ? undefined : mediaType,
          sort: sort as "newest" | "oldest" | "largest" | "smallest",
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
      }),
  });

  const del = async (id: string, itemSource: "gallery" | "memory_image" | "blog" | "event", fbPath: string | null) => {
    if (!confirm("Delete this media item?")) return;
    setDeletingId(id);
    try {
      await adminDeleteMediaItem({ data: { id, source: itemSource } });
      if (fbPath) {
        deleteFromFirebaseStorage(fbPath).catch((err) =>
          console.error("[admin/media] failed to delete storage object:", err),
        );
      }
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      qc.invalidateQueries({ queryKey: ["admin-media-stats"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Files", value: stats.total_files },
            { label: "Gallery", value: stats.gallery.count },
            { label: "Photos (gallery)", value: stats.gallery.images },
            { label: "Videos (gallery)", value: stats.gallery.videos },
            { label: "Memories", value: stats.memory_images.count },
            { label: "Total Storage", value: formatFileSize(stats.total_size) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
      {stats && stats.gallery.missing > 0 && (
        <p className="text-sm text-amber-700 font-medium">
          ⚠ {stats.gallery.missing} gallery item(s) have no accessible file URL.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={source} onValueChange={(v) => { setSource(v); setPage(0); }}>
          <SelectTrigger className="h-10 w-40"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="gallery">Gallery</SelectItem>
            <SelectItem value="memory_image">Memories</SelectItem>
            <SelectItem value="blog">Blogs</SelectItem>
            <SelectItem value="event">Events</SelectItem>
          </SelectContent>
        </Select>
        <Select value={mediaType} onValueChange={(v) => { setMediaType(v); setPage(0); }}>
          <SelectTrigger className="h-10 w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(0); }}>
          <SelectTrigger className="h-10 w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="largest">Largest first</SelectItem>
            <SelectItem value="smallest">Smallest first</SelectItem>
          </SelectContent>
        </Select>
        {isFetching && <span className="self-center text-sm text-muted-foreground">Loading…</span>}
      </div>

      {items?.length === 0 && !isFetching && (
        <p className="text-muted-foreground">No media found.</p>
      )}

      <div className="space-y-2">
        {items?.map((item) => (
          <div key={`${item.source}-${item.id}`} className="rounded-lg border border-border bg-card p-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="shrink-0">
              {item.file_url && item.media_type === "image" ? (
                <img
                  src={item.file_url}
                  alt={item.file_name ?? ""}
                  className="h-12 w-12 rounded-md object-cover"
                  loading="lazy"
                />
              ) : item.media_type === "video" ? (
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">Video</div>
              ) : (
                <div className={`h-12 w-12 rounded-md flex items-center justify-center text-[10px] text-center px-1 ${item.file_available ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
                  {item.file_available ? "Doc" : "Missing"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{item.title ?? item.file_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                <span className="capitalize">{item.source.replace("_", " ")}</span>
                {" · "}{item.media_type}
                {item.file_size ? ` · ${formatFileSize(item.file_size)}` : ""}
                {item.uploaded_by_name ? ` · ${item.uploaded_by_name}` : ""}
                {" · "}{format(new Date(item.created_at), "PP")}
              </p>
            </div>
            <Button
              variant="outline"
              className="h-9 text-destructive shrink-0"
              disabled={deletingId === item.id}
              onClick={() => del(item.id, item.source, item.fb_storage_path)}
            >
              {deletingId === item.id ? "Deleting…" : "Delete"}
            </Button>
          </div>
        ))}
      </div>

      {(items?.length === PAGE_SIZE || page > 0) && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="h-10">
            Previous
          </Button>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={(items?.length ?? 0) < PAGE_SIZE} className="h-10">
            Next
          </Button>
          <span className="self-center text-sm text-muted-foreground">Page {page + 1}</span>
        </div>
      )}
    </div>
  );
}

function SupportTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-support"], queryFn: () => adminListSupport() });
  const resolve = async (id: string) => {
    await adminResolveSupport({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-support"] });
  };
  return (
    <div className="space-y-3">
      {data?.length === 0 && <p className="text-muted-foreground">No requests yet.</p>}
      {data?.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-semibold">{r.subject} <span className="text-xs ml-2 capitalize text-muted-foreground">[{r.category}]</span></p>
              <p className="text-sm text-muted-foreground">From: {r.profiles?.full_name} · {r.profiles?.phone ?? "no phone"}</p>
            </div>
            <span className="text-sm capitalize">{r.status}</span>
          </div>
          <p className="mt-2">{r.message}</p>
          {r.status !== "resolved" && <Button onClick={() => resolve(r.id)} variant="outline" className="mt-3">Mark resolved</Button>}
        </div>
      ))}
    </div>
  );
}
