import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIMCOSA 84–85 Batch Portal" },
      { name: "description", content: "A private members-only portal for the SIMCOSA 1984–85 batch. Sign in to access." },
    ],
  }),
  component: IndexGate,
});

function IndexGate() {
  const { user, profile, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.navigate({ to: "/auth", replace: true });
      return;
    }
    const isApproved = profile?.approval_status === "approved";
    if (isAdmin || isApproved) {
      router.navigate({ to: "/home", replace: true });
    } else {
      router.navigate({ to: "/pending-approval", replace: true });
    }
  }, [user, profile, isAdmin, loading, router]);

  return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">Loading…</div>;
}
