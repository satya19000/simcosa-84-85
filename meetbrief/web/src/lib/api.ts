import { API_BASE, auth } from "./firebase";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function headers(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, "Please sign in again.");
  return { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { method, headers: await headers(), body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, "Cannot reach the MeetBrief server. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  process: (meetingId: string, force = false) => request<{ jobId: string }>("POST", `/meetings/${meetingId}/process`, { force }),
  regenerate: (meetingId: string) => request<{ jobId: string }>("POST", `/meetings/${meetingId}/regenerate`, {}),
  ask: (meetingId: string, question: string) =>
    request<{ id: string; question: string; answer: string }>("POST", `/meetings/${meetingId}/ask`, { question }),
  search: (q: string) =>
    request<{ results: Array<{ meetingId: string; title: string; date: string; field: string; snippet: string; startMs?: number }> }>(
      "GET",
      `/search?q=${encodeURIComponent(q)}`,
    ),
  deleteMeeting: (meetingId: string) => request<{ ok: true }>("DELETE", `/meetings/${meetingId}`),
  /** Downloads an export and triggers a browser save. */
  async download(meetingId: string, format: "docx" | "md" | "txt" | "transcript") {
    const h = await headers();
    const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/export?format=${format}`, { headers: { Authorization: h.Authorization } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, (data as { error?: string }).error ?? "Export failed");
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") ?? "";
    const name = decodeURIComponent(cd.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? `minutes.${format}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};
