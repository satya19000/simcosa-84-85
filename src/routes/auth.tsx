import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login — SIMCOSA 84–85" }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) router.navigate({ to: "/" });
  }, [user, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <img
          src="/assets/college-logo.png"
          alt="SIMCOSA"
          className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400 ring-offset-2 mx-auto mb-4"
        />
        <h1>Welcome Back</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to access the members-only portal for our batch.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-8 shadow-sm text-center">
        <p className="text-gray-600 mb-6">
          We use your Replit account to sign you in securely. No separate password to remember.
        </p>
        <a href="/api/login">
          <Button
            disabled={loading}
            className="w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" /> Log in with Replit
          </Button>
        </a>
        <p className="text-sm text-muted-foreground mt-5">
          Once you sign in, your member profile is created automatically and you get full access.
        </p>
      </div>
    </div>
  );
}
