import { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { Plus } from "lucide-react";
import type { ActionItem, Meeting } from "@meetbrief/shared";
import { db } from "../../lib/firebase";
import { useUid } from "../../lib/auth";
import { clean, nowIso, useMeetingTasks } from "../../lib/data";
import { TaskList } from "../../components/TaskList";
import { Button, EmptyState, Input } from "../../components/ui";

export function ActionsTab({ meeting: m, onSeek }: { meeting: Meeting; onSeek: (ms: number) => void }) {
  const uid = useUid();
  const tasks = useMeetingTasks(uid, m.id);
  const [title, setTitle] = useState("");
  const sorted = [...tasks.data].sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || (a.sourceStartMs ?? 0) - (b.sourceStartMs ?? 0));

  return (
    <div className="space-y-5 pt-5">
      <form
        className="no-print flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const ref = doc(collection(db, "tasks"));
          const task: ActionItem = {
            id: ref.id, meetingId: m.id, meetingTitle: m.title, ownerId: uid, memberIds: m.memberIds, title: title.trim(),
            priority: "medium", status: "open", createdAt: nowIso(), updatedAt: nowIso(),
          };
          setTitle("");
          await setDoc(ref, clean(task));
        }}
      >
        <Input aria-label="New action item" placeholder="Add an action item…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit"><Plus size={18} aria-hidden /> Add</Button>
      </form>
      {tasks.loading ? <p className="text-muted">Loading…</p> : sorted.length ? <TaskList tasks={sorted} onSeek={onSeek} /> : <EmptyState title="No action items">They are extracted automatically when the minutes are written.</EmptyState>}
    </div>
  );
}
