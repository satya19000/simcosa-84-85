---
name: Firebase auth misconfiguration diagnosis
description: How to find the exact root cause when Firebase Email/Password signup/login fails, without a browser.
---

# Diagnosing Firebase auth failures from the shell

When client signup/login fails with a vague message, test the project directly via
the Identity Toolkit REST API using the web API key (it's client-exposed, not a
real secret), so you get the exact backend error without a browser:

```
curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${VITE_FIREBASE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"throwaway_<unique>@example.com","password":"TestPass123!","returnSecureToken":true}'
```

Map of REST error → client SDK code → meaning:
- `CONFIGURATION_NOT_FOUND` → `auth/configuration-not-found` → **Authentication is not enabled in the Firebase Console at all** (no provider ever turned on). Fix: Console → Authentication → Get started → enable Email/Password. This is a console setting, NOT a code bug.
- `OPERATION_NOT_ALLOWED` / `ADMIN_ONLY_OPERATION` → `auth/operation-not-allowed` / `auth/admin-restricted-operation` → that specific sign-in method is disabled.
- A successful response returns `idToken` — confirms key + project + provider are all good server-side, so any remaining failure is client-side (domain/popup).

**Why:** the browser only showed a generic error because our catch swallowed the raw
error; the REST probe reaches the real project and returns the precise code instantly.

**How to apply:** run the curl probe first before touching code. The sandbox
(`code_execution`) does NOT expose `process.env`; the `bash` tool does, so run env-var
checks and the curl probe from bash. `auth/unauthorized-domain` affects Google
popup + password-reset links only — add Replit dev + `.replit.app` domains under
Authentication → Settings → Authorized domains. The Replit **preview pane** runs on
the long `*.replit.dev` dev domain (`$REPLIT_DEV_DOMAIN`), NOT the published
`*.replit.app`; both must be authorized to test Google login in each place.

## Server rejects token (401) while client login succeeds

Symptom: client `signInWithEmailAndPassword` succeeds and gets a token, but the
server `/api/session` returns 401 with jose `JWTClaimValidationFailed: unexpected
"iss" claim value`. Root cause: the **Firebase web config identifies the project by
the API key**, so the client always mints tokens for the *real* project tied to the
key — even if the `projectId` in the client config is wrong. The **server** builds
its expected issuer from a separate `VITE_FIREBASE_PROJECT_ID` env var; if that
secret value is wrong/truncated, `https://securetoken.google.com/<wrong>` never
matches the token's real issuer.

**Why:** a truncated secret (e.g. project id stored as 12 chars instead of 13) is
invisible — you can't read secret values, only existence. The mismatch only shows up
server-side.

**How to apply:** when only the server side fails, verify the secret's exact value
from bash without printing it: check `${#VAR}` length and `[ "$VAR" = "expected" ]`.
Secrets can only be fixed by the user via `requestEnvVar` — give them the exact
string to paste. After fixing, decode a fresh token's `iss`/`aud` and confirm they
match `https://securetoken.google.com/$VITE_FIREBASE_PROJECT_ID` and
`$VITE_FIREBASE_PROJECT_ID`.
