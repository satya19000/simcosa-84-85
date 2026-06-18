import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";

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
  signInEmail: (email: string, password: string) => Promise<string>;
  signUpEmail: (email: string, password: string, fullName?: string) => Promise<string>;
  resetPassword: (email: string) => Promise<void>;
  signInGoogle: () => Promise<string>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

// Best display name for the welcome popup: full name if we have one,
// otherwise the part of the email before the @.
function welcomeNameFor(fbUser: FirebaseUser): string {
  if (fbUser.displayName?.trim()) return fbUser.displayName.trim();
  if (fbUser.email) return fbUser.email.split("@")[0];
  return "Batchmate";
}

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

  const clearState = () => {
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const load = async () => {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      const data: AuthResponse = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setProfile(data.profile ?? null);
        setIsAdmin(!!data.isAdmin);
      } else {
        clearState();
      }
    } catch {
      clearState();
    }
  };

  // Firebase is the source of truth: when a Firebase session exists we exchange
  // its ID token for a server session cookie; when it's gone we clear the cookie.
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onIdTokenChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const idToken = await fbUser.getIdToken();
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idToken }),
          });
          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            console.error("[auth] session exchange failed:", res.status, detail);
            throw new Error(`Session exchange failed (${res.status})`);
          }
          await load();
        } else {
          await fetch("/api/logout", { method: "POST", credentials: "include" });
          clearState();
        }
      } catch {
        clearState();
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const refresh = async () => {
    await load();
  };

  const signInEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    return welcomeNameFor(cred.user);
  };

  const signUpEmail = async (email: string, password: string, fullName?: string) => {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    const trimmedName = fullName?.trim();
    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName });
    }
    return trimmedName || welcomeNameFor(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  };

  const signInGoogle = async () => {
    const cred = await signInWithPopup(getFirebaseAuth(), googleProvider);
    return welcomeNameFor(cred.user);
  };

  const signOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
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
        signInEmail,
        signUpEmail,
        resetPassword,
        signInGoogle,
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
