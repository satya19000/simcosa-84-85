import { jsxs, jsx } from "react/jsx-runtime";
import { useId, useRef, useState, useCallback, useMemo } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X, FileText, File as File$1 } from "lucide-react";
import { a as cn, g as getFirebaseApp } from "./router-DmVoGMMZ.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
const DOC_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
function fileIconFor(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (DOC_EXTENSIONS.includes(ext)) return FileText;
  return File$1;
}
function DropzoneUpload({
  files,
  onFilesChange,
  accept = "image/*",
  multiple = true,
  disabled = false,
  className,
  label = "Drag and drop photos/files here, or click to browse",
  progress
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const addFiles = (incoming) => {
    if (!incoming || incoming.length === 0) return;
    const next = Array.from(incoming);
    onFilesChange(multiple ? [...files, ...next] : next.slice(0, 1));
  };
  const removeAt = (idx) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsxs(
      "label",
      {
        htmlFor: inputId,
        onDragOver: (e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        },
        onDragLeave: () => setDragOver(false),
        onDrop: (e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        },
        className: cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors",
          dragOver ? "border-amber-400 bg-amber-100/60" : "border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:bg-amber-50",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        ),
        children: [
          /* @__PURE__ */ jsx(UploadCloud, { className: cn("h-8 w-8", dragOver ? "text-amber-600" : "text-amber-400") }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-600", children: label }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: inputRef,
              id: inputId,
              type: "file",
              accept,
              multiple,
              disabled,
              className: "sr-only",
              onChange: (e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }
            }
          )
        ]
      }
    ),
    files.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: files.map((file, idx) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const Icon = fileIconFor(file);
      const state = progress?.[fileKey(file)];
      return /* @__PURE__ */ jsxs(
        "li",
        {
          className: "flex items-center gap-3 rounded-lg border border-amber-100 bg-white px-3 py-2",
          children: [
            isImage ? /* @__PURE__ */ jsx(
              "img",
              {
                src: URL.createObjectURL(file),
                alt: file.name,
                className: "h-10 w-10 rounded-md object-cover shrink-0"
              }
            ) : /* @__PURE__ */ jsx("div", { className: cn("rounded-md bg-amber-50 flex items-center justify-center shrink-0", isVideo ? "h-12 w-12" : "h-10 w-10"), children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 text-amber-500" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "flex-1 truncate text-sm text-gray-700", children: file.name }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400 shrink-0", children: [
                  (file.size / (1024 * 1024)).toFixed(1),
                  " MB"
                ] })
              ] }),
              state && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-1.5 rounded-full bg-amber-100 overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: cn(
                      "h-full rounded-full transition-all duration-200",
                      state.status === "error" ? "bg-red-500" : state.status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                    ),
                    style: { width: `${Math.max(state.status === "waiting" ? 0 : 4, state.pct)}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-semibold text-gray-500 shrink-0 w-28 text-right", children: [
                  state.status === "waiting" && "Waiting…",
                  state.status === "uploading" && `Uploading ${Math.round(state.pct)}%`,
                  state.status === "completed" && "Completed",
                  state.status === "error" && "Failed"
                ] })
              ] })
            ] }),
            state ? /* @__PURE__ */ jsxs("span", { className: "shrink-0", children: [
              state.status === "completed" && /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-emerald-500" }),
              state.status === "error" && /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-red-500" }),
              (state.status === "uploading" || state.status === "waiting") && /* @__PURE__ */ jsx(Loader2, { className: cn("h-5 w-5 text-amber-400", state.status === "uploading" && "animate-spin") })
            ] }) : !disabled && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeAt(idx),
                "aria-label": `Remove ${file.name}`,
                className: "h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            )
          ]
        },
        fileKey(file)
      );
    }) })
  ] });
}
function uploadToFirebaseStorageResumable(file, folder, userId, onProgress) {
  const storage = getStorage(getFirebaseApp());
  const path = `${folder}/${userId}/${crypto.randomUUID()}-${file.name}`;
  const objectRef = ref(storage, path);
  const task = uploadBytesResumable(objectRef, file);
  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const pct = snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes * 100 : 0;
        onProgress?.(pct);
      },
      (err) => reject(err),
      () => {
        getDownloadURL(objectRef).then((url) => resolve({ url, path })).catch(reject);
      }
    );
  });
}
async function deleteFromFirebaseStorage(path) {
  const storage = getStorage(getFirebaseApp());
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    const code = err?.code;
    if (code === "storage/object-not-found") {
      return;
    }
    throw err;
  }
}
const COMPRESSIBLE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
async function compressImage(file, opts) {
  const maxDimension = 1800;
  const quality = 0.9;
  if (!file.type.startsWith("image/") || !COMPRESSIBLE_TYPES.has(file.type)) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const longerEdge = Math.max(width, height);
    if (longerEdge <= maxDimension) {
      bitmap.close?.();
      return file;
    }
    const scale = maxDimension / longerEdge;
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close?.();
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), file.type, quality);
    });
    if (!blob || blob.size >= file.size) {
      return file;
    }
    return new File([blob], file.name, { type: file.type });
  } catch {
    return file;
  }
}
function useUploadQueue() {
  const [progress, setProgress] = useState({});
  const init = useCallback((files) => {
    setProgress(Object.fromEntries(files.map((f) => [fileKey(f), { status: "waiting", pct: 0 }])));
  }, []);
  const setStatus = useCallback((file, status, pct) => {
    setProgress((prev) => ({
      ...prev,
      [fileKey(file)]: { status, pct: pct ?? (status === "completed" ? 100 : prev[fileKey(file)]?.pct ?? 0) }
    }));
  }, []);
  const setPct = useCallback((file, pct) => {
    setProgress((prev) => ({ ...prev, [fileKey(file)]: { status: "uploading", pct } }));
  }, []);
  const reset = useCallback(() => setProgress({}), []);
  const { completedCount, failedCount, total } = useMemo(() => {
    const values = Object.values(progress);
    return {
      total: values.length,
      completedCount: values.filter((p) => p.status === "completed").length,
      failedCount: values.filter((p) => p.status === "error").length
    };
  }, [progress]);
  return { progress, init, setStatus, setPct, reset, completedCount, failedCount, total };
}
export {
  DropzoneUpload as D,
  uploadToFirebaseStorageResumable as a,
  compressImage as c,
  deleteFromFirebaseStorage as d,
  useUploadQueue as u
};
