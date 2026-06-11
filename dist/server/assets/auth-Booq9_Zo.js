import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { u as useAuth, B as Button, s as supabase } from "./router-CIkP24eF.js";
import { I as Input } from "./input-YO8m5oZO.js";
import { L as Label } from "./label-CMrJaZtA.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BkU43xYN.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@supabase/supabase-js";
import "lucide-react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-tabs";
function AuthPage() {
  const router = useRouter();
  const {
    user
  } = useAuth();
  const [tab, setTab] = useState("login");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) router.navigate({
      to: "/directory"
    });
  }, [user, router]);
  const onLogin = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password"))
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
  };
  const onSignup = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const {
      error
    } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/directory`,
        data: {
          full_name: String(fd.get("full_name"))
        }
      }
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! An admin will approve your access shortly.");
    setTab("login");
  };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md px-4 py-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx("h1", { children: "Welcome" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "Members-only portal for our batch." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-border bg-card p-6 shadow-sm", children: /* @__PURE__ */ jsxs(Tabs, { value: tab, onValueChange: (v) => setTab(v), children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid grid-cols-2 w-full mb-6", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "login", children: "Login" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "signup", children: "Signup" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "login", children: /* @__PURE__ */ jsxs("form", { onSubmit: onLogin, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "le", children: "Email" }),
          /* @__PURE__ */ jsx(Input, { id: "le", name: "email", type: "email", required: true, className: "h-12 text-base" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "lp", children: "Password" }),
          /* @__PURE__ */ jsx(Input, { id: "lp", name: "password", type: "password", required: true, minLength: 6, className: "h-12 text-base" })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy, className: "w-full h-12 text-base", children: busy ? "Signing in…" : "Sign in" })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "signup", children: /* @__PURE__ */ jsxs("form", { onSubmit: onSignup, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "sn", children: "Full name" }),
          /* @__PURE__ */ jsx(Input, { id: "sn", name: "full_name", required: true, className: "h-12 text-base" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "se", children: "Email" }),
          /* @__PURE__ */ jsx(Input, { id: "se", name: "email", type: "email", required: true, className: "h-12 text-base" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "sp", children: "Password" }),
          /* @__PURE__ */ jsx(Input, { id: "sp", name: "password", type: "password", required: true, minLength: 6, className: "h-12 text-base" })
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy, className: "w-full h-12 text-base", children: busy ? "Creating…" : "Create account" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center", children: "An admin will approve your access before you can see member pages." })
      ] }) })
    ] }) })
  ] });
}
export {
  AuthPage as component
};
