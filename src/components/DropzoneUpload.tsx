import { useId, useRef, useState } from "react";
import { UploadCloud, X, FileText, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropzoneUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
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
            const Icon = fileIconFor(file);
            return (
              <li
                key={`${file.name}-${file.lastModified}-${idx}`}
                className="flex items-center gap-3 rounded-lg border border-amber-100 bg-white px-3 py-2"
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-10 w-10 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-amber-500" />
                  </div>
                )}
                <span className="flex-1 truncate text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  aria-label={`Remove ${file.name}`}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
