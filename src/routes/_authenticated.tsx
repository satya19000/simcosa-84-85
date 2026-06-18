import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const ALWAYS_ALLOWED_PATHS = ["/profile", "/pending-approval"];

function AuthLayout() {
  const { user, profile, isAdmin, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2>Members only</h2>
        <p className="mt-3 text-muted-foreground">Please sign in to view this page.</p>
        <a href="/auth">
          <Button className="mt-6 h-12 px-6 text-base">Sign in</Button>
        </a>
      </div>
    );
  }

  const isApproved = profile?.approval_status === "approved";
  const onAllowedPath = ALWAYS_ALLOWED_PATHS.some((p) => pathname === p);

  if (!isAdmin && !isApproved && !onAllowedPath) {
    const status = profile?.approval_status ?? "pending";
    const message =
      status === "rejected"
        ? "Your membership request was not approved. Please contact admin."
        : status === "needs_clarification"
          ? "Admin needs more details from you. Please check your profile."
          : "Your account is awaiting admin approval.";
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2>Account pending</h2>
        <p className="mt-3 text-muted-foreground">{message}</p>
        <a href="/pending-approval">
          <Button className="mt-6 h-12 px-6 text-base">View status</Button>
        </a>
      </div>
    );
  }

  return <Outlet />;
}
