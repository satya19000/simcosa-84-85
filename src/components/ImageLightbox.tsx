import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxImage {
  src: string;
  alt?: string;
  caption?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  /** Index of the image to show, or null when the lightbox is closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Optional extra content (e.g. like/comment bar) rendered below the image. */
  renderFooter?: (index: number) => React.ReactNode;
}

/**
 * Reusable, accessible image lightbox / enlarge modal.
 * - Dark blurred overlay, close button, prev/next arrows (when multiple)
 * - Keyboard: Esc closes, ←/→ navigate
 * - Mobile: tap to enlarge, swipe left/right to navigate, tap image to zoom,
 *   native pinch-zoom enabled, tap outside to close
 */
export function ImageLightbox({ images, index, onClose, onIndexChange, renderFooter }: ImageLightboxProps) {
  const isOpen = index !== null && index >= 0 && index < images.length;
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const hasMultiple = images.length > 1;

  const goPrev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  // Reset zoom whenever the visible image changes.
  useEffect(() => {
    setZoomed(false);
  }, [index]);

  // Keyboard handling + body scroll lock while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, goPrev, goNext]);

  if (!isOpen) return null;
  const current = images[index];

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || zoomed || !hasMultiple) {
      touchStart.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
    }
    touchStart.current = null;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.caption || current.alt || "Enlarged image"}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8"
    >
      {/* Close */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close image"
        className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 h-11 w-11 rounded-full bg-white/10 hover:bg-amber-500 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Prev / Next */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-amber-500 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next image"
            className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-amber-500 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      {/* Image + caption */}
      <div
        className="relative flex max-h-full max-w-full flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt || current.caption || "Enlarged photo"}
          onClick={() => setZoomed((z) => !z)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          draggable={false}
          style={{ touchAction: "pinch-zoom" }}
          className={`select-none rounded-xl object-contain shadow-2xl transition-transform duration-300 max-h-[80vh] max-w-[92vw] ${zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
        />
        {current.caption && (
          <p className="mt-3 max-w-[92vw] px-2 text-center text-sm text-white/90 sm:text-base">
            {current.caption}
          </p>
        )}
        {hasMultiple && (
          <p className="mt-1 text-xs font-semibold text-amber-300/80">
            {index + 1} / {images.length}
          </p>
        )}
        {renderFooter && (
          <div className="mt-3 w-full max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            {renderFooter(index)}
          </div>
        )}
      </div>
    </div>
  );
}
