import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface ProfileRow {
  id: string;
  full_name: string;
  photo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  profession: string | null;
  bio: string | null;
  approved: boolean;
}

export interface AuthUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  profile: ProfileRow | null;
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

interface AuthResponse {
  authenticated: boolean;
  user?: AuthUser;
  profile?: ProfileRow | null;
  isAdmin?: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      const data: AuthResponse = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setProfile(data.profile ?? null);
        setIsAdmin(!!data.isAdmin);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    await load();
  };

  const signOut = async () => {
    window.location.href = "/api/logout";
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        isAdmin,
        isApproved: !!profile?.approved,
        loading,
        refresh,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
