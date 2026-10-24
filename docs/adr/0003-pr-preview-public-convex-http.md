# ADR 0003: PR Preview exposes local Convex through the app host

A PR Preview runs local Convex inside the Railway container. External browsers and OAuth callbacks use `https://<pr-host>/_convex` and `https://<pr-host>/_convex_site`. `/_dashboard` on local dev and on a PR Preview opens without an admin-key form. Staging and production stay on cloud Convex (`*.convex.cloud` / `*.convex.site` and dashboard.convex.dev).

## Status

Accepted

## Considered options (rejected)

- A Convex cloud preview deployment per pull request — rejected; the PR Preview already runs local Convex behind the Vite proxy.
- A `/_site` alias — rejected; `/_convex_site` is the only public Convex HTTP prefix.
- The production Google sign-in client on a PR Preview — rejected; `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` abort PR startup so those secrets never land on a pull request.
- Keeping the local dashboard admin-key form — rejected; anyone with the preview URL can open the dashboard, and the proxy attaches the admin key.

## Consequences

- `.env.local` stays loopback-only. Public `VITE_CONVEX_*` URLs are exported by `dev:all` at runtime, not written to the file.
- OAuth well-known discovery on the app origin must strip `/_convex_site` path insertion before proxying to Convex HTTP.
- `/api/current_deployment` from the local dashboard is rewritten so the proxied UI calls `/_convex` on the app host instead of `127.0.0.1`.
- JWT issuer stays on the raw `CONVEX_SITE_URL`. `CUSTOM_AUTH_SITE_URL` is PR-only and must not be referenced from `auth.config.ts`.
