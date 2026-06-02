import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login or Signup — SIMCOSA 84–85" }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.navigate({ to: "/directory" });
  }, [user, router]);

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
  };

  const onSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/directory`,
        data: { full_name: String(fd.get("full_name")) },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! An admin will approve your access shortly.");
    setTab("login");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-6">
        <h1>Welcome</h1>
        <p className="text-muted-foreground mt-2">Members-only portal for our batch.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Signup</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={onLogin} className="space-y-4">
              <div><Label htmlFor="le">Email</Label><Input id="le" name="email" type="email" required className="h-12 text-base" /></div>
              <div><Label htmlFor="lp">Password</Label><Input id="lp" name="password" type="password" required minLength={6} className="h-12 text-base" /></div>
              <Button type="submit" disabled={busy} className="w-full h-12 text-base">{busy ? "Signing in…" : "Sign in"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={onSignup} className="space-y-4">
              <div><Label htmlFor="sn">Full name</Label><Input id="sn" name="full_name" required className="h-12 text-base" /></div>
              <div><Label htmlFor="se">Email</Label><Input id="se" name="email" type="email" required className="h-12 text-base" /></div>
              <div><Label htmlFor="sp">Password</Label><Input id="sp" name="password" type="password" required minLength={6} className="h-12 text-base" /></div>
              <Button type="submit" disabled={busy} className="w-full h-12 text-base">{busy ? "Creating…" : "Create account"}</Button>
              <p className="text-sm text-muted-foreground text-center">An admin will approve your access before you can see member pages.</p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
