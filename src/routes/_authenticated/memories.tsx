import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listMemories, postMemory, toggleLike as toggleLikeFn, addComment } from "@/api/memories";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, BookOpen, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/memories")({
  head: () => ({ meta: [{ title: "Memories Wall — SIMCOSA 84–85" }] }),
  component: Memories,
});

const AVATAR_COLORS = [
  "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700",
  "bg-purple-100 text-purple-700",
];

function Memories() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [posting, setPosting] = useState(false);

  const { data: memories } = useQuery({
    queryKey: ["memories"],
    queryFn: () => listMemories(),
  });

  const onPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPosting(true);
    try {
      await postMemory({ data: { title: String(fd.get("title") || ""), body: String(fd.get("body")) } });
      form.reset();
      toast.success("Your memory has been shared! 💛");
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (mid: string, liked: boolean) => {
    try {
      await toggleLikeFn({ data: { memoryId: mid, liked } });
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Memories Wall</p>
          <h1>Stories That Warm Our Hearts</h1>
          <p className="text-gray-500 mt-2 text-lg">Share an old memory — a story, a moment, a person we cherish.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Post form */}
        <form onSubmit={onPost} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center font-display font-bold text-amber-700">
              {user?.email?.charAt(0).toUpperCase() ?? "M"}
            </div>
            <p className="font-semibold text-gray-700">Share a memory with your batchmates</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="t" className="font-semibold text-gray-700">Title (optional)</Label>
              <Input id="t" name="title" placeholder="Give your memory a title…" className="h-12 text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="b" className="font-semibold text-gray-700">Your memory *</Label>
              <Textarea id="b" name="body" required rows={4} placeholder="Share a story, a moment, a person you miss from our batch days…" className="text-base mt-1 border-amber-200 focus:border-amber-400 rounded-xl resize-none" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={posting} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl">
              <Send className="h-4 w-4 mr-2" /> {posting ? "Posting…" : "Share Memory"}
            </Button>
          </div>
        </form>

        {/* Memory feed */}
        <div className="space-y-5">
          {memories?.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-amber-200 mx-auto mb-4" />
              <h3 className="text-gray-500 font-display">No memories yet</h3>
              <p className="text-gray-400 mt-2">Be the first to share a cherished memory!</p>
            </div>
          )}

          {memories?.map((m, i) => {
            const liked = m.memory_likes?.some((l: { user_id: string }) => l.user_id === user!.id);
            const initials = (m.profiles?.full_name ?? "M").charAt(0);
            return (
              <article key={m.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-display text-xl font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{m.profiles?.full_name ?? "A Batchmate"}</p>
                      <p className="text-xs text-gray-400">{format(new Date(m.created_at), "PPP")}</p>
                    </div>
                  </div>
                  {m.title && <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{m.title}</h3>}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{m.body}</p>
                </div>

                {/* Like/comment bar */}
                <div className="px-6 py-3 border-t border-amber-50 flex items-center gap-6">
                  <button
                    onClick={() => toggleLike(m.id, !!liked)}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`}
                  >
                    <Heart className={`h-5 w-5 ${liked ? "fill-rose-500" : ""}`} />
                    {m.memory_likes?.length ?? 0} {liked ? "Liked" : "Like"}
                  </button>
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <MessageCircle className="h-5 w-5" />
                    {m.memory_comments?.length ?? 0} Comments
                  </span>
                </div>

                <Comments memoryId={m.id} comments={m.memory_comments ?? []} colorIdx={i} />
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Comments({
  memoryId,
  comments,
  colorIdx,
}: {
  memoryId: string;
  comments: Array<{ id: string; body: string; created_at: string; profiles: { full_name: string } | null }>;
  colorIdx: number;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const COLORS = [
    "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700",
  ];

  const add = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addComment({ data: { memoryId, body: text } });
      setText("");
      qc.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-6 pb-5 space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2 bg-amber-50/60 rounded-xl p-3">
          {comments.map((c, ci) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${COLORS[(colorIdx + ci + 1) % COLORS.length]}`}>
                {(c.profiles?.full_name ?? "M").charAt(0)}
              </div>
              <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-amber-100">
                <span className="font-bold text-gray-800">{c.profiles?.full_name ?? "Member"}: </span>
                <span className="text-gray-600">{c.body}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && add()}
          placeholder="Write a comment…"
          className="h-11 text-sm rounded-xl border-amber-200"
        />
        <Button onClick={add} disabled={sending || !text.trim()} className="h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-4">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
