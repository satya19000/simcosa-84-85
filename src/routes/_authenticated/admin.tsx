import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      <Tabs defaultValue="members" className="mt-8">
        <TabsList className="flex flex-wrap h-auto justify-start">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-6"><MembersTab /></TabsContent>
        <TabsContent value="events" className="mt-6"><EventsTab /></TabsContent>
        <TabsContent value="announcements" className="mt-6"><AnnouncementsTab /></TabsContent>
        <TabsContent value="donations" className="mt-6"><DonationsTab /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpensesTab /></TabsContent>
        <TabsContent value="support" className="mt-6"><SupportTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function MembersTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const toggle = async (id: string, approved: boolean) => {
    const { error } = await supabase.from("profiles").update({ approved }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Approved" : "Revoked");
    qc.invalidateQueries({ queryKey: ["admin-members"] });
  };
  return (
    <div className="space-y-3">
      {data?.map((m) => (
        <div key={m.id} className="rounded-lg border border-border bg-card p-4 flex flex-wrap justify-between gap-3 items-center">
          <div>
            <p className="font-semibold">{m.full_name} {m.approved && <span className="text-xs text-gold ml-2">✓ Approved</span>}</p>
            <p className="text-sm text-muted-foreground">{m.email}</p>
          </div>
          <Button onClick={() => toggle(m.id, !m.approved)} variant={m.approved ? "outline" : "default"}>
            {m.approved ? "Revoke access" : "Approve member"}
          </Button>
        </div>
      ))}
    </div>
  );
}

function EventsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-events"], queryFn: async () => (await supabase.from("events").select("*").order("event_date", { ascending: false })).data ?? [] });
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await supabase.from("events").insert({
      title: String(fd.get("title")),
      description: String(fd.get("description") || ""),
      location: String(fd.get("location") || ""),
      event_date: new Date(String(fd.get("event_date"))).toISOString(),
    });
    if (error) return toast.error(error.message);
    form.reset();
    toast.success("Event created");
    qc.invalidateQueries({ queryKey: ["admin-events"] });
    qc.invalidateQueries({ queryKey: ["events"] });
  };
  const del = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
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
  const { data } = useQuery({ queryKey: ["admin-announcements"], queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await supabase.from("announcements").insert({
      kind: kind as "birthday" | "achievement" | "condolence" | "notice",
      title: String(fd.get("title")),
      body: String(fd.get("body") || ""),
    });
    if (error) return toast.error(error.message);
    form.reset();
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };
  const del = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
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
  const { data } = useQuery({ queryKey: ["admin-donations"], queryFn: async () => (await supabase.from("donations").select("*").order("donated_on", { ascending: false })).data ?? [] });
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await supabase.from("donations").insert({
      donor_name: String(fd.get("donor_name")),
      amount: Number(fd.get("amount")),
      purpose: String(fd.get("purpose") || ""),
    });
    if (error) return toast.error(error.message);
    form.reset();
    qc.invalidateQueries({ queryKey: ["admin-donations"] });
    qc.invalidateQueries({ queryKey: ["donations"] });
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
  const { data } = useQuery({ queryKey: ["admin-expenses"], queryFn: async () => (await supabase.from("expenses").select("*").order("spent_on", { ascending: false })).data ?? [] });
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await supabase.from("expenses").insert({
      description: String(fd.get("description")),
      amount: Number(fd.get("amount")),
      category: String(fd.get("category") || ""),
    });
    if (error) return toast.error(error.message);
    form.reset();
    qc.invalidateQueries({ queryKey: ["admin-expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses"] });
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
  const { data } = useQuery({ queryKey: ["admin-support"], queryFn: async () => (await supabase.from("support_requests").select("*, profiles(full_name, phone)").order("created_at", { ascending: false })).data ?? [] });
  const resolve = async (id: string) => {
    await supabase.from("support_requests").update({ status: "resolved" }).eq("id", id);
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
