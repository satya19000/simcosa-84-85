import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { u as useAuth, B as Button } from "./router-HaPNrn1l.js";
import { LogIn } from "lucide-react";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
function AuthPage() {
  const router = useRouter();
  const {
    user,
    loading
  } = useAuth();
  useEffect(() => {
    if (user) router.navigate({
      to: "/"
    });
  }, [user, router]);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md px-4 py-16", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("img", { src: "/assets/college-logo.png", alt: "SIMCOSA", className: "h-16 w-16 rounded-full object-cover ring-2 ring-amber-400 ring-offset-2 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("h1", { children: "Welcome Back" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "Sign in to access the members-only portal for our batch." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-amber-100 bg-white p-8 shadow-sm text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6", children: "We use your Replit account to sign you in securely. No separate password to remember." }),
      /* @__PURE__ */ jsx("a", { href: "/api/login", children: /* @__PURE__ */ jsxs(Button, { disabled: loading, className: "w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsx(LogIn, { className: "h-5 w-5" }),
        " Log in with Replit"
      ] }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-5", children: "Once you sign in, your member profile is created automatically and you get full access." })
    ] })
  ] });
}
export {
  AuthPage as component
};
