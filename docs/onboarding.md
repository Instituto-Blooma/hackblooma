# Onboarding

How people get into Instituto Blooma. Uses vocabulary from [AGENTS.md](../AGENTS.md). Hackblooma’s default is open Google sign-in: [ADR 0004](./adr/0004-auto-join-first-organization.md).

## Default path (no Invitation needed)

Anyone who signs in with Google is added to the first created Organization as a **member** and becomes `active`. If no Organization exists yet, the app creates **Instituto Blooma**.

Equipe Blooma people are still recognized by the `PLATFORM_ADMIN_EMAILS` list. They can sign in the same way.

## Lifecycle states

| State     | Meaning                                                                               |
| --------- | ------------------------------------------------------------------------------------- |
| `pending` | Optional admin provisioning; Membership or draft Invitation exists; not signed in yet |
| `invited` | Optional Invitation email sent; User has not signed in                                |
| `active`  | User signed in with Google; full product access                                       |

## Optional admin Invitation flow

Platform Admins and org Admins can still provision people and send Invitations. If a pending Invitation exists for that email, sign-in accepts it (so they join the invited Organization). Otherwise they join the first created Organization.

### Org Admin creates a User

1. **Provisioning** — User record and draft Invitation (role assigned)
2. **Invitation** sent immediately
3. Onboarding lifecycle → `invited`, then **Activation** after Google sign-in → `active`

### Platform Admin creates a User (Send Invite checked)

Same as org Admin flow.

### Platform Admin creates a User (Send Invite unchecked)

1. **Provisioning** only — lifecycle stays `pending`
2. The person can still sign in with Google without waiting for the email
3. Admin may send an **Invitation** later via "Send Invite"

## OAuth gates

Google sign-in is allowed for any email. There is no “wait for an invite” block.

| Situation                        | What happens                                      |
| -------------------------------- | ------------------------------------------------- |
| New email, never provisioned     | Account created; joins first created Organization |
| Provisioned, Invitation not sent | Sign-in succeeds; joins invited or first org      |
| Invitation already sent          | Sign-in succeeds; Invitation is accepted          |
| Email on `PLATFORM_ADMIN_EMAILS` | Sign-in succeeds; platform admin role is granted  |

## Invitation details

- Org Admins always send Invitations immediately when provisioning
- Platform Admins may defer via "Send Invite" on the platform admin panel
- Invitation TTL: **7 days** (see [ADR 0001](./adr/0001-b2b-tenancy-and-platform-admin.md))
- Accept flow still works: User opens link → `/accept-invitation/:id` → Google sign-in → Membership confirmed → `active`

## Related docs

- [Architecture](./architecture.md) — `convex/onboarding.ts`, `convex/lib/onboarding.ts`, `convex/auth.ts`
- [Environment](./environment.md) — Resend and emulator setup for invitation emails
- [Testing](./testing.md) — Cypress specs `03-onboarding.cy.ts`
