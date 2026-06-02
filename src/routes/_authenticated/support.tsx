import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Help & Support Corner" }] }),
  component: Support,
});

const categories = [
  { v: "medical", l: "Medical" },
  { v: "financial", l: "Financial" },
  { v: "emotional", l: "Emotional" },
  { v: "family", l: "Family issue" },
  { v: "other", l: "Other" },
];

function Support() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("medical");

  const { data: mine } = useQuery({
    queryKey: ["my-support", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("support_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await supabase.from("support_requests").insert({
      user_id: user!.id,
      category: category as "medical" | "financial" | "emotional" | "family" | "other",
      subject: String(fd.get("subject")),
      message: String(fd.get("message")),
    });
    if (error) return toast.error(error.message);
    toast.success("Sent. Admins will reach out privately.");
    form.reset();
    qc.invalidateQueries({ queryKey: ["my-support"] });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <h1>Help & Support Corner</h1>
      <p className="text-muted-foreground mt-2">
        Reach out in confidence. Only admins of our batch see what you write here.
      </p>

      <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="sub">Subject</Label><Input id="sub" name="subject" required className="h-12 text-base" /></div>
        <div><Label htmlFor="msg">Message</Label><Textarea id="msg" name="message" required rows={5} className="text-base" /></div>
        <Button type="submit" className="h-12 px-6">Send privately</Button>
      </form>

      {mine && mine.length > 0 && (
        <div className="mt-10">
          <h2>Your past requests</h2>
          <div className="mt-4 space-y-3">
            {mine.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex justify-between gap-3">
                  <h3 className="text-lg">{r.subject}</h3>
                  <span className="text-sm text-muted-foreground capitalize">{r.category} · {r.status}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{r.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
