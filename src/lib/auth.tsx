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

export type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_clarification";

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
  spouse_name: string | null;
  clinic_or_hospital: string | null;
  country_state: string | null;
  batch_confirmed: boolean;
  approved: boolean;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  slug: string | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

export interface SignupExtra {
  phone?: string;
  whatsapp?: string;
  location?: string;
  profession?: string;
  bio?: string;
  spouse_name?: string;
  clinic_or_hospital?: string;
  country_state?: string;
  batch_confirmed?: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  profile: ProfileRow | null;
  isAdmin: boolean;
  isOwner: boolean;
  isApproved: boolean;
  loading: boolean;
  refresh: () => Promise<AuthResponse | null>;
  signInEmail: (email: string, password: string) => Promise<{ name: string; profile: ProfileRow | null }>;
  signUpEmail: (
    email: string,
    password: string,
    fullName: string,
    extra?: SignupExtra,
    photoFile?: File,
  ) => Promise<{ name: string; profile: ProfileRow | null }>;
  resetPassword: (email: string) => Promise<void>;
  signInGoogle: () => Promise<{ name: string; profile: ProfileRow | null }>;
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
  isOwner?: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearState = () => {
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsOwner(false);
  };

  const load = async (): Promise<AuthResponse | null> => {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      const data: AuthResponse = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setProfile(data.profile ?? null);
        setIsAdmin(!!data.isAdmin);
        setIsOwner(!!data.isOwner);
      } else {
        clearState();
      }
      return data;
    } catch {
      clearState();
      return null;
    }
  };

  // Exchanges a fresh Firebase ID token for a server session cookie. Awaited
  // directly (rather than relying solely on the onIdTokenChanged listener
  // below) so sign-in/sign-up flows can deterministically know the session
  // exists before reading approval status or saving extra signup details.
  const exchangeSession = async (fbUser: FirebaseUser) => {
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
    return load();
  };

  const signInEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    await exchangeSession(cred.user);
    const data = await load();
    return { name: welcomeNameFor(cred.user), profile: data?.profile ?? null };
  };

  const signUpEmail = async (
    email: string,
    password: string,
    fullName: string,
    extra?: SignupExtra,
    photoFile?: File,
  ) => {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    const trimmedName = fullName?.trim();
    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName });
    }
    await exchangeSession(cred.user);
    if (extra) {
      try {
        const { updateMyProfile } = await import("@/api/profile");
        await updateMyProfile({
          data: { full_name: trimmedName || welcomeNameFor(cred.user), ...extra },
        });
      } catch (err) {
        console.error("[auth] failed to save signup details:", err);
      }
    }
    if (photoFile) {
      try {
        const { uploadProfilePhoto } = await import("@/api/profile");
        const fd = new FormData();
        fd.set("file", photoFile);
        await uploadProfilePhoto({ data: fd });
      } catch (err) {
        console.error("[auth] failed to upload profile photo:", err);
      }
    }
    const data = await load();
    return { name: trimmedName || welcomeNameFor(cred.user), profile: data?.profile ?? null };
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  };

  const signInGoogle = async () => {
    const cred = await signInWithPopup(getFirebaseAuth(), googleProvider);
    await exchangeSession(cred.user);
    const data = await load();
    return { name: welcomeNameFor(cred.user), profile: data?.profile ?? null };
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
        isOwner,
        isApproved: profile?.approval_status === "approved",
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
