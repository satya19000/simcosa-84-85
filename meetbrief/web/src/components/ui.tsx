import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { MeetingStatus } from "@meetbrief/shared";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "record";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand/90 disabled:bg-brand/40",
  secondary: "bg-white text-ink border border-line hover:bg-paper disabled:text-muted",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:bg-danger/40",
  ghost: "text-brand hover:bg-brand-soft disabled:text-muted",
  record: "bg-accent text-white hover:bg-accent/90 disabled:bg-accent/40",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5", lg: "px-6 py-4 text-lg" };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${sizes[size]} ${variants[variant]} ${className}`}
    />
  );
}

export function Card({ children, className = "", ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`rounded-2xl border border-line bg-card p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children, id }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode; id?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fid} className="font-medium">
        {label}
      </label>
      {children(fid)}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base outline-none focus:border-brand";

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${inputCls} ${p.className ?? ""}`} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`${inputCls} ${p.className ?? ""}`} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${inputCls} ${p.className ?? ""}`} />;

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} className="h-2.5 w-full overflow-hidden rounded-full bg-brand-soft">
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

const statusStyles: Record<MeetingStatus, [string, string]> = {
  draft: ["Draft", "bg-paper text-muted border-line"],
  recording: ["Recording", "bg-accent-soft text-accent border-accent/30"],
  uploading: ["Uploading", "bg-warn-soft text-warn border-warn/30"],
  queued: ["Queued", "bg-brand-soft text-brand border-brand/20"],
  processing: ["Processing", "bg-brand-soft text-brand border-brand/20"],
  ready: ["Ready", "bg-ok/10 text-ok border-ok/30"],
  failed: ["Needs attention", "bg-danger/10 text-danger border-danger/30"],
};

export function StatusBadge({ status }: { status: MeetingStatus }) {
  const [label, cls] = statusStyles[status] ?? statusStyles.draft;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium ${cls}`}>{label}</span>;
}

export function Banner({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: ReactNode }) {
  const cls = { info: "bg-brand-soft text-brand", warn: "bg-warn-soft text-warn", error: "bg-danger/10 text-danger", ok: "bg-ok/10 text-ok" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 ${cls}`}>
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

/** Accessible modal built on the native <dialog> element. */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="m-auto w-[min(92vw,40rem)] rounded-2xl border border-line p-0 text-ink shadow-xl backdrop:bg-black/40"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <h2 id="modal-title" className="mb-4 text-xl font-bold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: Array<{ id: T; label: string }>; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" aria-label="Meeting sections" className="no-print -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap border-b-3 px-4 py-3 font-semibold ${value === t.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
