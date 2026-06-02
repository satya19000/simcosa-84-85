import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, profile, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2>Members only</h2>
        <p className="mt-3 text-muted-foreground">Please sign in to view this page.</p>
        <Link to="/auth"><Button className="mt-6 h-12 px-6 text-base">Login or Signup</Button></Link>
      </div>
    );
  }

  if (!profile?.approved && !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2>Awaiting approval</h2>
        <p className="mt-3 text-muted-foreground">
          Thank you for signing up, <strong>{profile?.full_name}</strong>. An admin will review and approve
          your account soon. You'll get access to member pages once approved.
        </p>
        <Link to="/"><Button variant="outline" className="mt-6 h-12 px-6 text-base">Go to Home</Button></Link>
      </div>
    );
  }

  return <Outlet />;
}
