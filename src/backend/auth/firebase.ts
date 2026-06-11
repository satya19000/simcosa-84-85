import { createRemoteJWKSet, jwtVerify } from "jose";

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

// Firebase signs ID tokens with rotating keys published at this JWKS endpoint.
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export interface AuthClaims {
  sub: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

interface FirebaseTokenPayload {
  sub?: string;
  user_id?: string;
  email?: string;
  name?: string;
  picture?: string;
}

// Verify a Firebase ID token using Google's public keys + the project id.
// No firebase-admin service account is required for token verification.
export async function verifyFirebaseToken(idToken: string): Promise<AuthClaims> {
  if (!PROJECT_ID) {
    throw new Error("VITE_FIREBASE_PROJECT_ID must be set to verify Firebase tokens");
  }

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });

  const p = payload as FirebaseTokenPayload;
  const uid = p.sub || p.user_id;
  if (!uid) throw new Error("Invalid Firebase token: missing subject");

  const name = (p.name ?? "").trim();
  let firstName: string | null = null;
  let lastName: string | null = null;
  if (name) {
    const parts = name.split(/\s+/);
    firstName = parts.shift() ?? null;
    lastName = parts.length ? parts.join(" ") : null;
  }

  return {
    sub: uid,
    email: p.email ?? null,
    first_name: firstName,
    last_name: lastName,
    profile_image_url: p.picture ?? null,
  };
}
