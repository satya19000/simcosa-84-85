import { useId, useRef, useState } from "react";
import { UploadCloud, X, FileText, File as FileIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileKey, type FileUploadState } from "@/lib/upload-progress";

export interface DropzoneUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  /** Per-file upload progress, keyed by `fileKey(file)`. When present for a file, shows a progress bar/status instead of the remove button. */
  progress?: Record<string, FileUploadState>;
}

const DOC_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];

function fileIconFor(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (DOC_EXTENSIONS.includes(ext)) return FileText;
  return FileIcon;
}

export function DropzoneUpload({
  files,
  onFilesChange,
  accept = "image/*",
  multiple = true,
  disabled = false,
  className,
  label = "Drag and drop photos/files here, or click to browse",
  progress,
}: DropzoneUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const next = Array.from(incoming);
    onFilesChange(multiple ? [...files, ...next] : next.slice(0, 1));
  };

  const removeAt = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors",
          dragOver ? "border-amber-400 bg-amber-100/60" : "border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:bg-amber-50",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <UploadCloud className={cn("h-8 w-8", dragOver ? "text-amber-600" : "text-amber-400")} />
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith("image/");
            const isVideo = file.type.startsWith("video/");
            const Icon = fileIconFor(file);
            const state = progress?.[fileKey(file)];
            return (
              <li
                key={fileKey(file)}
                className="flex items-center gap-3 rounded-lg border border-amber-100 bg-white px-3 py-2"
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-10 w-10 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className={cn("rounded-md bg-amber-50 flex items-center justify-center shrink-0", isVideo ? "h-12 w-12" : "h-10 w-10")}>
                    <Icon className="h-5 w-5 text-amber-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                  {state && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-200",
                            state.status === "error" ? "bg-red-500" : state.status === "completed" ? "bg-emerald-500" : "bg-amber-500",
                          )}
                          style={{ width: `${Math.max(state.status === "waiting" ? 0 : 4, state.pct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-500 shrink-0 w-28 text-right">
                        {state.status === "waiting" && "Waiting…"}
                        {state.status === "uploading" && `Uploading ${Math.round(state.pct)}%`}
                        {state.status === "completed" && "Completed"}
                        {state.status === "error" && "Failed"}
                      </span>
                    </div>
                  )}
                </div>
                {state ? (
                  <span className="shrink-0">
                    {state.status === "completed" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {state.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {(state.status === "uploading" || state.status === "waiting") && (
                      <Loader2 className={cn("h-5 w-5 text-amber-400", state.status === "uploading" && "animate-spin")} />
                    )}
                  </span>
                ) : (
                  !disabled && (
                    <button
                      type="button"
                      onClick={() => removeAt(idx)}
                      aria-label={`Remove ${file.name}`}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
