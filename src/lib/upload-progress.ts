// Shared types/helpers for tracking per-file Firebase Storage upload progress
// across Gallery, Memories, Blogs, Events, and the Admin Dashboard.
export type UploadStatus = "waiting" | "uploading" | "completed" | "error";

export interface FileUploadState {
  status: UploadStatus;
  pct: number;
}

/** Stable identity for a File across re-renders/array mutations (name+size+lastModified, not array index). */
export function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
