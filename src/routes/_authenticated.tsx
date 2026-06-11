import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2>Members only</h2>
        <p className="mt-3 text-muted-foreground">Please sign in to view this page.</p>
        <a href="/api/login">
          <Button className="mt-6 h-12 px-6 text-base">Log in with Replit</Button>
        </a>
      </div>
    );
  }

  return <Outlet />;
}
