import { jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { u as useAuth } from "./router-vU0NLd8C.js";
import "@tanstack/react-query";
import "firebase/auth";
import "firebase/app";
import "lucide-react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "sonner";
function IndexGate() {
  const {
    user,
    profile,
    isAdmin,
    loading
  } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.navigate({
        to: "/auth",
        replace: true
      });
      return;
    }
    const isApproved = profile?.approval_status === "approved";
    if (isAdmin || isApproved) {
      router.navigate({
        to: "/home",
        replace: true
      });
    } else {
      router.navigate({
        to: "/pending-approval",
        replace: true
      });
    }
  }, [user, profile, isAdmin, loading, router]);
  return /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-md px-4 py-20 text-center text-muted-foreground", children: "Loading…" });
}
export {
  IndexGate as component
};
