import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  adminListGallery, adminDeleteGalleryItem,
  adminListMemories, adminDeleteMemory,
} from "@/api/admin";
import type { ApprovalStatus } from "@/backend/auth/service";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="px-4 py-20 text-center">Loading…</div>;
  if (!isAdmin) return <div className="px-4 py-20 text-center"><h2>Admin only</h2><p className="mt-2 text-muted-foreground">You don't have admin access.</p></div>;

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
      }));
      if (rows.length === 0) {
        toast.error("No rows found. Expected columns: name, email, mobile, city, profession");
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
          Columns: name, email, mobile, city, profession. Existing emails are updated, not duplicated.
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

function GalleryTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-gallery"], queryFn: () => adminListGallery() });
  const del = async (id: string) => {
    try {
      await adminDeleteGalleryItem({ data: { id } });
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  if (data?.length === 0) return <p className="text-muted-foreground">No gallery items yet.</p>;
  return (
    <div className="space-y-3">
      {data?.map((g) => (
        <div key={g.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
          <div>
            <p className="font-semibold">{g.title || g.caption || g.storage_path} <span className="text-xs text-muted-foreground ml-1 capitalize">[{g.media_type}]</span></p>
            <p className="text-sm text-muted-foreground">By {g.profiles?.full_name ?? "Unknown"} · {format(new Date(g.created_at), "PPP")}</p>
          </div>
          <Button onClick={() => del(g.id)} variant="outline" className="h-10 text-destructive">Delete</Button>
        </div>
      ))}
    </div>
  );
}

function MemoriesTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-memories"], queryFn: () => adminListMemories() });
  const del = async (id: string) => {
    try {
      await adminDeleteMemory({ data: { id } });
      toast.success("Memory deleted");
      qc.invalidateQueries({ queryKey: ["admin-memories"] });
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  if (data?.length === 0) return <p className="text-muted-foreground">No memories yet.</p>;
  return (
    <div className="space-y-3">
      {data?.map((m) => (
        <div key={m.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
          <div>
            <p className="font-semibold">{m.title || "Untitled"}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{m.body}</p>
            <p className="text-sm text-muted-foreground">By {m.profiles?.full_name ?? "Unknown"} · {format(new Date(m.created_at), "PPP")}</p>
          </div>
          <Button onClick={() => del(m.id)} variant="outline" className="h-10 text-destructive">Delete</Button>
        </div>
      ))}
    </div>
  );
}

function EventsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-events"], queryFn: () => adminListEvents() });
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await adminCreateEvent({ data: {
        title: String(fd.get("title")),
        description: String(fd.get("description") || ""),
        location: String(fd.get("location") || ""),
        event_date: new Date(String(fd.get("event_date"))).toISOString(),
      } });
      form.reset();
      toast.success("Event created");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  const del = async (id: string) => {
    await adminDeleteEvent({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-events"] });
    qc.invalidateQueries({ queryKey: ["events"] });
  };
  return (
    <div>
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 grid sm:grid-cols-2 gap-3">
        <div><Label>Title</Label><Input name="title" required className="h-11" /></div>
        <div><Label>Date & time</Label><Input name="event_date" type="datetime-local" required className="h-11" /></div>
        <div><Label>Location</Label><Input name="location" className="h-11" /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea name="description" rows={3} /></div>
        <Button type="submit" className="sm:col-span-2 h-11">Create event</Button>
      </form>
      <div className="mt-6 space-y-3">
        {data?.map((e) => (
          <div key={e.id} className="rounded-lg border border-border bg-card p-4 flex justify-between gap-3">
            <div><p className="font-semibold">{e.title}</p><p className="text-sm text-muted-foreground">{format(new Date(e.event_date), "PPP p")}</p></div>
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
