import * as client from "openid-client";

const ISSUER_URL = process.env.ISSUER_URL ?? "https://replit.com/oidc";

if (!process.env.REPL_ID) {
  throw new Error("REPL_ID must be set for Replit Auth");
}

export const SCOPES = "openid email profile offline_access";

let configPromise: Promise<client.Configuration> | undefined;

export function getOidcConfig(): Promise<client.Configuration> {
  if (!configPromise) {
    configPromise = client.discovery(new URL(ISSUER_URL), process.env.REPL_ID!);
  }
  return configPromise;
}

export interface OidcClaims {
  sub: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_image_url?: string | null;
  [key: string]: unknown;
}

export { client };
