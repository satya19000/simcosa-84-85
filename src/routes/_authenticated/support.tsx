import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMySupport, createSupport } from "@/api/support";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { HelpCircle, Heart, Shield, Send, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Help & Support Corner — SIMCOSA 84–85" }] }),
  component: Support,
});

const categories = [
  { v: "medical", l: "Medical Advice / Consultation", emoji: "🏥" },
  { v: "financial", l: "Financial Support", emoji: "💰" },
  { v: "emotional", l: "Emotional / Mental Health Support", emoji: "💙" },
  { v: "family", l: "Family / Personal Issue", emoji: "👨‍👩‍👧" },
  { v: "other", l: "Other / General", emoji: "💬" },
];

const statusColors: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-sky-100 text-sky-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

function Support() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("medical");
  const [sending, setSending] = useState(false);

  const { data: mine } = useQuery({
    queryKey: ["my-support", user?.id],
    enabled: !!user,
    queryFn: () => listMySupport(),
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSending(true);
    try {
      await createSupport({
        data: {
          category: category as "medical" | "financial" | "emotional" | "family" | "other",
          subject: String(fd.get("subject")),
          message: String(fd.get("message")),
        },
      });
      toast.success("Sent! Admins will reach out to you privately. 💛");
      form.reset();
      qc.invalidateQueries({ queryKey: ["my-support"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Batch Support</p>
          <h1>Help & Support Corner</h1>
          <p className="text-gray-500 mt-2 text-lg">Reach out in confidence — only batch admins see your messages. We're here for each other.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield, label: "100% Private", desc: "Only admins can see", color: "text-emerald-600" },
            { icon: Heart, label: "Compassionate", desc: "We're here for you", color: "text-rose-500" },
            { icon: Clock, label: "Timely Response", desc: "Within 24 hours", color: "text-amber-600" },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-amber-100 text-center shadow-sm">
              <Icon className={`h-6 w-6 ${color} mx-auto mb-1`} />
              <p className="font-bold text-gray-800 text-sm">{label}</p>
              <p className="text-gray-400 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-5">
          <div>
            <Label className="font-semibold text-gray-700">What kind of support do you need?</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 text-base mt-1 border-amber-200 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.v} value={c.v}>{c.emoji} {c.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sub" className="font-semibold text-gray-700">Subject</Label>
            <Input id="sub" name="subject" required placeholder="Brief subject…" className="h-12 text-base mt-1 border-amber-200 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="msg" className="font-semibold text-gray-700">Your message</Label>
            <Textarea id="msg" name="message" required rows={5} placeholder="Share as much or as little as you're comfortable with…" className="text-base mt-1 border-amber-200 rounded-xl resize-none" />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={sending} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl flex items-center gap-2">
              <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send Privately"}
            </Button>
          </div>
        </form>

        {/* Past requests */}
        {mine && mine.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-500" /> Your Past Requests
            </h2>
            <div className="space-y-3">
              {mine.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{r.subject}</h3>
                      <p className="text-sm text-gray-500 capitalize mt-0.5">{categories.find(c => c.v === r.category)?.emoji} {r.category}</p>
                    </div>
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full shrink-0 ${statusColors[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600 text-sm leading-relaxed">{r.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
