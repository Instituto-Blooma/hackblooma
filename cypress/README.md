# Cypress E2E Tests

Overview and CI notes: [docs/testing.md](../docs/testing.md).

End-to-end tests for the B2B template app. Most specs use programmatic test-login via `cy.login(persona)` (default `mode: 'session'`). OAuth UI flows use `{ mode: 'fresh' }` or `{ mode: 'attempt' }` in `00-auth.cy.ts`, onboarding gate tests, and invitation activation helpers.

The E2E stack **always** starts Google emulate (`:4002`) alongside programmatic auth — both paths coexist.

## Prerequisites

1. Complete local setup: `pnpm run setup`
2. Install the Cypress binary (first time only): `npx cypress install`

Programmatic test-login is configured automatically when the E2E stack starts — no `.env.local` secret required.

## Running tests

**Headless (recommended)** — starts stack, waits for readiness, runs Cypress:

```bash
pnpm run e2e:run
```

**Single spec:**

```bash
pnpm run e2e:run --spec cypress/e2e/08-form.cy.ts
```

**Interactive UI:**

```bash
pnpm run e2e:open
```

**Manual stack control:**

```bash
pnpm run e2e:stack:up    # start Convex, Google + Resend emulate, Vite
pnpm run cy:run --spec cypress/e2e/08-form.cy.ts  # run specs in another terminal
pnpm run e2e:stack:down  # tear down
```

**Seed fixtures only** (writes `cypress/fixtures/e2e-context.json`):

```bash
pnpm run e2e:setup
```

Run `pnpm run e2e:setup` before onboarding specs if invitation tests mutate pending/invited user state.

## Authentication

Use the type-safe persona API:

```typescript
cy.login('orgAdmin'); // cached session (default)
cy.login('platformAdmin');
cy.login('admin', { mode: 'fresh' }); // full OAuth, no session
cy.login('unprovisioned', { mode: 'fresh' }); // new people join the first Organization
cy.signOut();
```

Personas: `admin`, `platformAdmin`, `orgAdmin`, `member`, `orgBAdmin`, `orgBMember`, `invited`, `pending`, `unprovisioned`.

Fixture IDs and emails are in [`cypress/fixtures/e2e-context.json`](fixtures/e2e-context.json) via `cy.loadE2eContext()`.

## Email (Resend emulate)

Generic inbox polling lives in support:

```typescript
cy.waitForEmail('invited@example.com', {
  match: (email) => email.subject?.includes('Join'),
});
```

Invitation-specific parsing is in [`cypress/e2e/helpers/email.ts`](e2e/helpers/email.ts):

```typescript
import { waitForInvitationLink } from '../helpers/email';
import { activateViaInvitationEmail } from '../helpers/onboarding';
```

Configure the emulate base URL via `RESEND_EMULATE_URL` in [`cypress.config.ts`](../cypress.config.ts) (default `http://localhost:4003`).

## What gets seeded

`testing/e2e:reset` creates multi-Organization fixture data prefixed with `E2E `:

- **E2E Acme Corp** and **E2E Beta Corp** with distinct org-scoped todos
- Platform admin, org admins/members, pending and invited onboarding users
- Seeded invitation email for `invited@example.com` (via canonical invitation lifecycle)

## Spec layout

| File                           | Coverage                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `00-auth.cy.ts`                | Full OAuth sign-in (`mode: 'fresh'`)                                                       |
| `01-shell.cy.ts`               | Dashboard shell, 404, theme                                                                |
| `02-todos.cy.ts`               | Seeded todos, add row, toggle complete                                                     |
| `03-onboarding.cy.ts`          | Open Google sign-in joins first org, optional invites, inbox, activation (`mode: 'fresh'`) |
| `04-tenants.cy.ts`             | Org settings, platform admin panel                                                         |
| `05-permissions.cy.ts`         | Permission demo page by role                                                               |
| `06-tenant-isolation.cy.ts`    | UI + server-side cross-org isolation                                                       |
| `07-platform-org-switch.cy.ts` | Platform admin org switcher                                                                |
| `08-form.cy.ts`                | Dev form page — field types, validation, file upload, persistence                          |

## Out of scope

- Production Resend delivery (tests use emulate only)
- Multi-user presence
