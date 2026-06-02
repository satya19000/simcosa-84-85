import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/memories")({
  head: () => ({ meta: [{ title: "Memories Wall" }] }),
  component: Memories,
});

function Memories() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: memories } = useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*, profiles(full_name), memory_likes(user_id), memory_comments(id, body, user_id, created_at, profiles(full_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const onPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await supabase.from("memories").insert({
      user_id: user!.id,
      title: String(fd.get("title") || ""),
      body: String(fd.get("body")),
    });
    if (error) return toast.error(error.message);
    form.reset();
    toast.success("Memory shared");
    qc.invalidateQueries({ queryKey: ["memories"] });
  };

  const toggleLike = async (mid: string, liked: boolean) => {
    if (liked) {
      await supabase.from("memory_likes").delete().eq("memory_id", mid).eq("user_id", user!.id);
    } else {
      await supabase.from("memory_likes").insert({ memory_id: mid, user_id: user!.id });
    }
    qc.invalidateQueries({ queryKey: ["memories"] });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1>Memories Wall</h1>
      <p className="text-muted-foreground mt-2">Share an old memory — a story, a moment, a person we miss.</p>

      <form onSubmit={onPost} className="mt-6 rounded-xl border border-border bg-card p-5 space-y-3">
        <div><Label htmlFor="t">Title (optional)</Label><Input id="t" name="title" className="h-12 text-base" /></div>
        <div><Label htmlFor="b">Your memory</Label><Textarea id="b" name="body" required rows={4} className="text-base" /></div>
        <Button type="submit" className="h-12 px-6">Post</Button>
      </form>

      <div className="mt-8 space-y-5">
        {memories?.map((m) => {
          const liked = m.memory_likes?.some((l: { user_id: string }) => l.user_id === user!.id);
          return (
            <article key={m.id} className="rounded-xl border border-border bg-card p-5">
              <header className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-primary">{m.profiles?.full_name ?? "Member"}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(m.created_at), "PPP")}</p>
              </header>
              {m.title && <h3 className="mt-2">{m.title}</h3>}
              <p className="mt-2 whitespace-pre-line">{m.body}</p>
              <div className="mt-4 flex items-center gap-4 text-muted-foreground">
                <button onClick={() => toggleLike(m.id, !!liked)} className="flex items-center gap-1 hover:text-primary">
                  <Heart className={`h-5 w-5 ${liked ? "fill-destructive text-destructive" : ""}`} />
                  {m.memory_likes?.length ?? 0}
                </button>
                <span className="flex items-center gap-1"><MessageCircle className="h-5 w-5" />{m.memory_comments?.length ?? 0}</span>
              </div>
              <Comments memoryId={m.id} comments={m.memory_comments ?? []} />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Comments({ memoryId, comments }: { memoryId: string; comments: Array<{ id: string; body: string; created_at: string; profiles: { full_name: string } | null }> }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const add = async () => {
    if (!text.trim()) return;
    const { error } = await supabase.from("memory_comments").insert({ memory_id: memoryId, user_id: user!.id, body: text });
    if (error) return toast.error(error.message);
    setText("");
    qc.invalidateQueries({ queryKey: ["memories"] });
  };

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="text-sm">
          <span className="font-semibold text-primary">{c.profiles?.full_name ?? "Member"}: </span>
          <span>{c.body}</span>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" className="h-11" />
        <Button onClick={add} className="h-11">Send</Button>
      </div>
    </div>
  );
}
