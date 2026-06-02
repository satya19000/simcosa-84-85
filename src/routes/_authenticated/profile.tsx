import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "", phone: "", whatsapp: "", location: "", profession: "", bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      location: profile.location ?? "",
      profession: profile.profession ?? "",
      bio: profile.bio ?? "",
    });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refresh();
    router.navigate({ to: "/directory" });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <h1>My Profile</h1>
      <p className="text-muted-foreground mt-2">Keep your details up to date so classmates can reach you.</p>
      <form onSubmit={save} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
        <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="h-12 text-base" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 text-base" /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+91…" className="h-12 text-base" /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>City / Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-12 text-base" /></div>
          <div><Label>Profession</Label><Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="h-12 text-base" /></div>
        </div>
        <div><Label>About you</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="text-base" /></div>
        <Button type="submit" disabled={saving} className="h-12 px-6">{saving ? "Saving…" : "Save profile"}</Button>
      </form>
    </div>
  );
}
