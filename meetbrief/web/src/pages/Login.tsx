import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, firebaseConfigured, usingEmulators } from "../lib/firebase";
import { Banner, Button, Card, Field, Input } from "../components/ui";

export function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setError(undefined);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      setError(
        code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")
          ? "Email or password is incorrect."
          : code.includes("email-already-in-use")
            ? "An account already exists for this email. Sign in instead."
            : code.includes("weak-password")
              ? "Use a password of at least 8 characters."
              : code.includes("popup")
                ? "The sign-in window was closed or blocked."
                : "Sign-in failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/icon.svg" alt="" className="mx-auto mb-4 h-16 w-16" />
          <h1 className="text-3xl font-bold text-brand">MeetBrief AI</h1>
          <p className="mt-2 text-muted">Record meetings. Get transcripts, minutes and action items — in Telugu, English or both.</p>
          <p className="telugu mt-1 text-muted" lang="te">
            సమావేశాలను రికార్డ్ చేయండి, మినిట్స్ పొందండి.
          </p>
        </div>
        <Card>
          {!firebaseConfigured && !usingEmulators && (
            <div className="mb-4">
              <Banner tone="warn">Firebase is not configured. Copy web/.env.example to web/.env and fill in your project values.</Banner>
            </div>
          )}
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(() =>
                mode === "signin" ? signInWithEmailAndPassword(auth, email, password) : createUserWithEmailAndPassword(auth, email, password),
              );
            }}
          >
            <Field label="Email">{(id) => <Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
            <Field label="Password">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>
            {error && <Banner tone="error">{error}</Banner>}
            {info && <Banner tone="ok">{info}</Banner>}
            <Button type="submit" size="lg" disabled={busy}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <Button variant="secondary" className="w-full" disabled={busy} onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))}>
            Continue with Google
          </Button>
          <div className="mt-5 flex justify-between text-sm">
            <button className="font-medium text-brand" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "Create an account" : "I already have an account"}
            </button>
            {mode === "signin" && (
              <button
                className="text-muted hover:text-ink"
                onClick={() =>
                  email
                    ? run(async () => {
                        await sendPasswordResetEmail(auth, email);
                        setInfo("Password reset email sent.");
                      })
                    : setError("Enter your email first.")
                }
              >
                Forgot password?
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
