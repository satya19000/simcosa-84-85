import { useCallback, useMemo, useState } from "react";
import { fileKey, type FileUploadState, type UploadStatus } from "@/lib/upload-progress";

/** Tracks per-file upload status/percentage for a batch upload, plus overall counts. */
export function useUploadQueue() {
  const [progress, setProgress] = useState<Record<string, FileUploadState>>({});

  const init = useCallback((files: File[]) => {
    setProgress(Object.fromEntries(files.map((f) => [fileKey(f), { status: "waiting" as UploadStatus, pct: 0 }])));
  }, []);

  const setStatus = useCallback((file: File, status: UploadStatus, pct?: number) => {
    setProgress((prev) => ({
      ...prev,
      [fileKey(file)]: { status, pct: pct ?? (status === "completed" ? 100 : prev[fileKey(file)]?.pct ?? 0) },
    }));
  }, []);

  const setPct = useCallback((file: File, pct: number) => {
    setProgress((prev) => ({ ...prev, [fileKey(file)]: { status: "uploading", pct } }));
  }, []);

  const reset = useCallback(() => setProgress({}), []);

  const { completedCount, failedCount, total } = useMemo(() => {
    const values = Object.values(progress);
    return {
      total: values.length,
      completedCount: values.filter((p) => p.status === "completed").length,
      failedCount: values.filter((p) => p.status === "error").length,
    };
  }, [progress]);

  return { progress, init, setStatus, setPct, reset, completedCount, failedCount, total };
}
