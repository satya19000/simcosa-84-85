import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth, type ApprovalStatus } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Lock, User, Phone, MapPin, Briefcase, Camera } from "lucide-react";
import { queueWelcomeToast } from "@/components/WelcomeToast";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login — SIMCOSA 84–85" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset";

function firebaseErrorMessage(code: string): string | null {
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Try signing in.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
    case "auth/admin-restricted-operation":
      return "Email/Password sign-in isn't enabled for this project. An admin must enable it in Firebase Console → Authentication → Sign-in method.";
    case "auth/configuration-not-found":
      return "Firebase Authentication isn't set up yet. Enable Email/Password in Firebase Console → Authentication → Sign-in method.";
    case "auth/unauthorized-domain":
      return "This domain isn't authorized in Firebase. Add it under Authentication → Settings → Authorized domains.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "The Firebase API key is invalid. Check the VITE_FIREBASE_* configuration.";
    default:
      return null;
  }
}

// Always returns a user-facing string and includes the raw Firebase code so the
// exact error can be reported. Also logs the full error to the browser console.
function describeAuthError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  console.error(
    "[auth] Firebase error:",
    e?.code,
    e?.message,
    "| current hostname:",
    host,
    err,
  );
  const code = e?.code || "unknown";
  let base = firebaseErrorMessage(code) ?? e?.message ?? "Authentication failed.";
  if (code === "auth/unauthorized-domain" && host) {
    base += ` Current domain is "${host}" — add this exact domain under Firebase → Authentication → Settings → Authorized domains.`;
  }
  return `${base} (${code})`;
}

function navigateForStatus(
  router: ReturnType<typeof useRouter>,
  name: string,
  status: ApprovalStatus | undefined,
) {
  if (status && status !== "approved") {
    queueWelcomeToast(name, status);
    router.navigate({ to: "/pending-approval" });
  } else {
    queueWelcomeToast(name, "approved");
    router.navigate({ to: "/home" });
  }
}

function AuthPage() {
  const router = useRouter();
  const { user, profile, isAdmin, loading, signInEmail, signUpEmail, resetPassword, signInGoogle } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");
  const [batchConfirmed, setBatchConfirmed] = useState(false);
  const [spouseName, setSpouseName] = useState("");
  const [bio, setBio] = useState("");
  const [clinic, setClinic] = useState("");
  const [countryState, setCountryState] = useState("");
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const isApproved = profile?.approval_status === "approved";
    if (isAdmin || isApproved) {
      router.navigate({ to: "/home" });
    } else {
      router.navigate({ to: "/pending-approval" });
    }
  }, [user, profile, isAdmin, router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (mode === "signup" && !batchConfirmed) {
      setError("Please confirm that you belong to SIMCOSA 84–85 Batch.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { name, profile } = await signInEmail(email.trim(), password);
        navigateForStatus(router, name, profile?.approval_status);
      } else if (mode === "signup") {
        const { name, profile } = await signUpEmail(
          email.trim(),
          password,
          fullName.trim(),
          {
            phone: mobile.trim(),
            whatsapp: mobile.trim(),
            location: city.trim(),
            profession: profession.trim(),
            bio: bio.trim() || undefined,
            spouse_name: spouseName.trim() || undefined,
            clinic_or_hospital: clinic.trim() || undefined,
            country_state: countryState.trim() || undefined,
            batch_confirmed: true,
          },
          photoFile,
        );
        navigateForStatus(router, name, profile?.approval_status);
      } else {
        await resetPassword(email.trim());
        setNotice("Password reset email sent. Check your inbox.");
      }
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    setGoogleBusy(true);
    try {
      const { name, profile } = await signInGoogle();
      navigateForStatus(router, name, profile?.approval_status);
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setGoogleBusy(false);
    }
  };

  const heading =
    mode === "signin" ? "Welcome Back" : mode === "signup" ? "Create your account" : "Reset password";
  const subtitle =
    mode === "signin"
      ? "Sign in to access the members-only portal for our batch."
      : mode === "signup"
        ? "Sign up below — an admin will review and approve your membership."
        : "Enter your email and we'll send you a reset link.";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="text-center mb-8">
        <img
          src="/assets/college-logo.png"
          alt="SIMCOSA"
          className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400 ring-offset-2 mx-auto mb-4"
        />
        <h1>{heading}</h1>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-6 sm:p-8 shadow-sm">
        {mode !== "reset" && (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-amber-50 p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`h-11 rounded-lg text-base font-semibold transition-colors ${
                mode === "signin" ? "bg-white text-amber-700 shadow-sm" : "text-amber-700/70"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`h-11 rounded-lg text-base font-semibold transition-colors ${
                mode === "signup" ? "bg-white text-amber-700 shadow-sm" : "text-amber-700/70"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Kumar"
                    className="h-12 pl-10 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile / WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="mobile"
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-12 pl-10 text-base"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Vijayawada"
                      className="h-12 pl-10 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession / Specialization *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="profession"
                    type="text"
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="Cardiologist"
                    className="h-12 pl-10 text-base"
                  />
                </div>
              </div>

              <details className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-amber-700">
                  Optional details (photo, spouse, bio…)
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="photo">Profile photo</Label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0])}
                        className="h-12 pl-10 text-base pt-2.5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="spouseName">Spouse name</Label>
                      <Input id="spouseName" value={spouseName} onChange={(e) => setSpouseName(e.target.value)} className="h-12 text-base" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic">Clinic / Hospital</Label>
                      <Input id="clinic" value={clinic} onChange={(e) => setClinic(e.target.value)} className="h-12 text-base" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryState">Current country / state</Label>
                    <Input id="countryState" value={countryState} onChange={(e) => setCountryState(e.target.value)} className="h-12 text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Short bio</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="text-base" />
                  </div>
                </div>
              </details>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 pl-10 text-base"
              />
            </div>
          </div>

          {mode !== "reset" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 pl-10 text-base"
                />
              </div>
            </div>
          )}

          {mode === "signup" && (
            <label className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={batchConfirmed}
                onChange={(e) => setBatchConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-amber-500"
              />
              <span className="text-gray-700 font-medium">
                I confirm that I belong to SIMCOSA 84–85 Batch
              </span>
            </label>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          )}
          {notice && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {notice}
            </p>
          )}

          <Button
            type="submit"
            disabled={busy || loading}
            className="w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </Button>
        </form>

        {mode === "reset" ? (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="mt-5 w-full text-center text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            ← Back to sign in
          </button>
        ) : (
          <>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={googleBusy || loading}
              onClick={handleGoogle}
              className="w-full h-12 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {googleBusy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-5">
        New members are reviewed by an admin before getting full access.
      </p>
    </div>
  );
}
