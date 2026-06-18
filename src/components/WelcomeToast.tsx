import { useEffect, useState } from "react";

const STORAGE_KEY = "simcosa_welcome_name";
const VISIBLE_MS = 4000;
const FADE_MS = 400;

// Call right after a successful sign-in / sign-up / Google login, before
// navigating away, so the next page mount can pick it up and show the toast.
export function queueWelcomeToast(name: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, name);
  } catch {
    // sessionStorage unavailable (e.g. private mode) — silently skip
  }
}

export function WelcomeToast() {
  const [name, setName] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if (!stored) return;

    setName(stored);
    const showTimer = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    const removeTimer = setTimeout(() => setName(null), VISIBLE_MS + FADE_MS);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!name) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-4 sm:top-6 z-[100] flex justify-center px-4 pointer-events-none transition-all ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-5 py-4 sm:px-6 sm:py-5 shadow-xl ring-1 ring-amber-100 max-w-md">
        <img
          src="/assets/college-logo.png"
          alt="SIMCOSA"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-amber-400 ring-offset-1 shrink-0"
        />
        <p className="text-base sm:text-lg font-semibold leading-snug text-gray-800">
          Welcome to <span className="text-amber-600 font-bold">SIMCOSA</span>,{" "}
          <span className="font-bold text-gray-900">{name}</span>!
        </p>
      </div>
    </div>
  );
}
