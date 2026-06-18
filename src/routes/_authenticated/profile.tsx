import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { updateMyProfile } from "@/api/profile";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, MapPin, Briefcase, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — SIMCOSA 84–85" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, isAdmin, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "", phone: "", whatsapp: "", location: "", profession: "", bio: "",
    spouse_name: "", clinic_or_hospital: "", country_state: "",
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
      spouse_name: profile.spouse_name ?? "",
      clinic_or_hospital: profile.clinic_or_hospital ?? "",
      country_state: profile.country_state ?? "",
    });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({ data: form });
      toast.success("Profile updated! 🎉");
      await refresh();
      if (isAdmin || profile?.approval_status === "approved") {
        router.navigate({ to: "/directory" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const statusBanner = (() => {
    if (isAdmin || profile?.approval_status === "approved" || !profile) return null;
    const status = profile.approval_status;
    const text =
      status === "rejected"
        ? "Your membership request was not approved. Please contact admin."
        : status === "needs_clarification"
          ? "Admin needs more details from you. Please update your profile below."
          : "Your account is awaiting admin approval.";
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 text-amber-800 text-sm font-medium">
        {text}
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Account</p>
          <h1>My Profile</h1>
          <p className="text-gray-500 mt-2 text-lg">Keep your details up to date so classmates can find and connect with you.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {statusBanner}
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-6 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center font-display text-3xl font-bold text-amber-700 shrink-0">
            {form.full_name.charAt(0) || user?.email?.charAt(0).toUpperCase() || "M"}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-xl">{form.full_name || "Your Name"}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <p className="text-amber-600 text-sm font-semibold mt-0.5">SIMCOSA 1984–85 Batch</p>
          </div>
        </div>

        <form onSubmit={save} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-5">
          <div>
            <Label className="font-semibold text-gray-700 flex items-center gap-2"><User className="h-4 w-4 text-amber-500" />Full name *</Label>
            <Input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              required
              placeholder="Dr. Your Name"
              className="h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-gray-700 flex items-center gap-2"><Phone className="h-4 w-4 text-amber-500" />Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="h-12 text-base mt-1 border-amber-200 rounded-xl" />
            </div>
            <div>
              <Label className="font-semibold text-gray-700 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-emerald-500" />WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+91 98765 43210" className="h-12 text-base mt-1 border-amber-200 rounded-xl" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-gray-700 flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-500" />City / Location</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Vijayawada, AP" className="h-12 text-base mt-1 border-amber-200 rounded-xl" />
            </div>
            <div>
              <Label className="font-semibold text-gray-700 flex items-center gap-2"><Briefcase className="h-4 w-4 text-amber-500" />Profession / Speciality</Label>
              <Input value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} placeholder="Cardiologist, Hyderabad" className="h-12 text-base mt-1 border-amber-200 rounded-xl" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-gray-700">Spouse name</Label>
              <Input value={form.spouse_name} onChange={e => setForm({ ...form, spouse_name: e.target.value })} className="h-12 text-base mt-1 border-amber-200 rounded-xl" />
            </div>
            <div>
              <Label className="font-semibold text-gray-700">Clinic / Hospital</Label>
              <Input value={form.clinic_or_hospital} onChange={e => setForm({ ...form, clinic_or_hospital: e.target.value })} className="h-12 text-base mt-1 border-amber-200 rounded-xl" />
            </div>
          </div>

          <div>
            <Label className="font-semibold text-gray-700">Current country / state</Label>
            <Input value={form.country_state} onChange={e => setForm({ ...form, country_state: e.target.value })} className="h-12 text-base mt-1 border-amber-200 rounded-xl" />
          </div>

          <div>
            <Label className="font-semibold text-gray-700">About you</Label>
            <Textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              rows={4}
              placeholder="A short bio — your practice, city, family, hobbies… anything you'd like batchmates to know."
              className="text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl flex items-center gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
