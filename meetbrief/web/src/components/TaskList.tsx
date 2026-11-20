import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDuration, type ActionItem, type TaskStatus } from "@meetbrief/shared";
import { updateTask } from "../lib/data";
import { Banner, Button, Input, Select } from "./ui";

const STATUS_LABEL: Record<TaskStatus, string> = { open: "Open", in_progress: "In progress", done: "Done" };
const PRIORITY_CLS = { high: "bg-accent-soft text-accent", medium: "bg-warn-soft text-warn", low: "bg-paper text-muted" };

export function TaskList({ tasks, showMeeting, onSeek }: { tasks: ActionItem[]; showMeeting?: boolean; onSeek?: (ms: number) => void }) {
  const [editing, setEditing] = useState<string>();
  const [error, setError] = useState<string>();
  const run = (p: Promise<unknown>) => p.catch((e: Error) => setError(`Could not update: ${e.message}`));

  return (
    <div className="space-y-3">
      {error && <Banner tone="error">{error}</Banner>}
      <ul className="space-y-3">
        {tasks.map((t) => (
          <li key={t.id} className={`rounded-2xl border border-line bg-white p-4 ${t.status === "done" ? "opacity-70" : ""}`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1.5 h-6 w-6 shrink-0 accent-[var(--color-ok)]"
                checked={t.status === "done"}
                aria-label={`Mark "${t.title}" as done`}
                onChange={(e) => void run(updateTask(t.id, { status: e.target.checked ? "done" : "open" }))}
              />
              <div className="min-w-0 flex-1">
                {editing === t.id ? (
                  <form
                    className="grid gap-2 sm:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      void run(
                        updateTask(t.id, {
                          title: String(fd.get("title")),
                          assignee: String(fd.get("assignee")),
                          dueDate: String(fd.get("dueDate")),
                          priority: fd.get("priority") as ActionItem["priority"],
                        }),
                      ).then(() => setEditing(undefined));
                    }}
                  >
                    <div className="sm:col-span-2"><Input name="title" defaultValue={t.title} aria-label="Task" required /></div>
                    <Input name="assignee" defaultValue={t.assignee ?? ""} placeholder="Responsible person" aria-label="Responsible person" />
                    <Input name="dueDate" type="date" defaultValue={t.dueDate ?? ""} aria-label="Due date" />
                    <Select name="priority" defaultValue={t.priority} aria-label="Priority">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" type="submit">Save</Button>
                      <Button size="sm" variant="secondary" type="button" onClick={() => setEditing(undefined)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className={`font-medium ${t.status === "done" ? "line-through" : ""}`}>{t.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_CLS[t.priority]}`}>{t.priority}</span>
                      {(t.assignee || t.assigneeDesignation) && <span>{[t.assignee, t.assigneeDesignation].filter(Boolean).join(", ")}</span>}
                      {(t.dueDate || t.dueText) && <span>Due: {t.dueDate || t.dueText}</span>}
                      {showMeeting && <Link className="text-brand underline" to={`/meetings/${t.meetingId}?tab=actions`}>{t.meetingTitle}</Link>}
                      {onSeek && t.sourceStartMs !== undefined && (
                        <button className="text-brand underline" onClick={() => onSeek(t.sourceStartMs!)}>at {formatDuration(t.sourceStartMs)}</button>
                      )}
                    </p>
                  </>
                )}
              </div>
              {editing !== t.id && (
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <Select
                    aria-label="Status"
                    className="!w-auto !py-1.5 text-sm"
                    value={t.status}
                    onChange={(e) => void run(updateTask(t.id, { status: e.target.value as TaskStatus }))}
                  >
                    {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(t.id)}>Edit</Button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
