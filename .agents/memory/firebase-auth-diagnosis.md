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
Authentication → Settings → Authorized domains.
