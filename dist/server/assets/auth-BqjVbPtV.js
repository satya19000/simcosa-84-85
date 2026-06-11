import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { u as useAuth, B as Button } from "./router-D3RrNONf.js";
import { I as Input } from "./input-CM7s87nM.js";
import { L as Label } from "./label-BsTiHODq.js";
import { Mail, Lock, Loader2 } from "lucide-react";
import "@tanstack/react-query";
import "firebase/auth";
import "firebase/app";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
import "@radix-ui/react-label";
function firebaseErrorMessage(code) {
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
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled. Please contact an admin.";
    default:
      return "Something went wrong. Please try again.";
  }
}
function AuthPage() {
  const router = useRouter();
  const {
    user,
    loading,
    signInEmail,
    signUpEmail,
    resetPassword,
    signInGoogle
  } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  useEffect(() => {
    if (user) router.navigate({
      to: "/"
    });
  }, [user, router]);
  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInEmail(email.trim(), password);
      } else if (mode === "signup") {
        await signUpEmail(email.trim(), password);
      } else {
        await resetPassword(email.trim());
        setNotice("Password reset email sent. Check your inbox.");
      }
    } catch (err) {
      const code = err?.code ?? "";
      setError(firebaseErrorMessage(code));
    } finally {
      setBusy(false);
    }
  };
  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    setGoogleBusy(true);
    try {
      await signInGoogle();
    } catch (err) {
      const code = err?.code ?? "";
      setError(firebaseErrorMessage(code));
    } finally {
      setGoogleBusy(false);
    }
  };
  const heading = mode === "signin" ? "Welcome Back" : mode === "signup" ? "Create your account" : "Reset password";
  const subtitle = mode === "signin" ? "Sign in to access the members-only portal for our batch." : mode === "signup" ? "Sign up and your member profile is created automatically." : "Enter your email and we'll send you a reset link.";
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-md px-4 py-12 sm:py-16", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("img", { src: "/assets/college-logo.png", alt: "SIMCOSA", className: "h-16 w-16 rounded-full object-cover ring-2 ring-amber-400 ring-offset-2 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("h1", { children: heading }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: subtitle })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-amber-100 bg-white p-6 sm:p-8 shadow-sm", children: [
      mode !== "reset" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1 rounded-xl bg-amber-50 p-1 mb-6", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => switchMode("signin"), className: `h-11 rounded-lg text-base font-semibold transition-colors ${mode === "signin" ? "bg-white text-amber-700 shadow-sm" : "text-amber-700/70"}`, children: "Sign In" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => switchMode("signup"), className: `h-11 rounded-lg text-base font-semibold transition-colors ${mode === "signup" ? "bg-white text-amber-700 shadow-sm" : "text-amber-700/70"}`, children: "Sign Up" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { id: "email", type: "email", inputMode: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com", className: "h-12 pl-10 text-base" })
          ] })
        ] }),
        mode !== "reset" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
            mode === "signin" && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => switchMode("reset"), className: "text-sm font-medium text-amber-600 hover:text-amber-700", children: "Forgot password?" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { id: "password", type: "password", autoComplete: mode === "signup" ? "new-password" : "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "••••••••", className: "h-12 pl-10 text-base" })
          ] })
        ] }),
        error && /* @__PURE__ */ jsx("p", { className: "rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700", children: error }),
        notice && /* @__PURE__ */ jsx("p", { className: "rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700", children: notice }),
        /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: busy || loading, className: "w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2", children: [
          busy && /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin" }),
          mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"
        ] })
      ] }),
      mode === "reset" ? /* @__PURE__ */ jsx("button", { type: "button", onClick: () => switchMode("signin"), className: "mt-5 w-full text-center text-sm font-medium text-amber-600 hover:text-amber-700", children: "← Back to sign in" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "my-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-gray-200" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "or" }),
          /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-gray-200" })
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", disabled: googleBusy || loading, onClick: handleGoogle, className: "w-full h-12 text-base font-semibold rounded-xl flex items-center justify-center gap-2", children: [
          googleBusy ? /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin" }) : /* @__PURE__ */ jsxs("svg", { className: "h-5 w-5", viewBox: "0 0 24 24", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" }),
            /* @__PURE__ */ jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" }),
            /* @__PURE__ */ jsx("path", { fill: "#FBBC05", d: "M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" }),
            /* @__PURE__ */ jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" })
          ] }),
          "Continue with Google"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground mt-5", children: "New members get full access automatically — no approval needed." })
  ] });
}
export {
  AuthPage as component
};
