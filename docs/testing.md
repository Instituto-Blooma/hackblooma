# Testing

End-to-end tests validate B2B flows: onboarding, permissions, Organization isolation, and Platform Admin org switching.

Full Cypress reference: **[cypress/README.md](../cypress/README.md)**.

## Quick start

**Recommended** — one command starts the stack, seeds fixtures, and runs Cypress:

```bash
export E2E_AUTH_SECRET=local-e2e-secret
pnpm run e2e:run
```

CI runs Cypress on Chrome (not Electron) after enlarging `/dev/shm`. Cursor/Electron shells that export `ELECTRON_RUN_AS_NODE` are stripped before Cypress starts.

**Single spec:**

```bash
pnpm run e2e:run --spec cypress/e2e/08-form.cy.ts
```

**Manual stack** (two terminals):

```bash
# Terminal 1
pnpm run e2e:stack:up

# Terminal 2
pnpm run cy:run --spec cypress/e2e/08-form.cy.ts
```

The E2E stack injects programmatic test-login automatically and **always** starts Google emulate (`:4002`) for OAuth UI specs (`fresh` / `attempt` modes). Resend emulate runs on `:4003`.

## Interactive UI

```bash
pnpm run e2e:open
```

## Seed only

```bash
pnpm run e2e:setup
```

Writes `cypress/fixtures/e2e-context.json` via `testing/e2e:reset`. Run before onboarding specs if invitation state was mutated.

## What e2e covers

| Spec                           | Topic                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `00-auth.cy.ts`                | Full OAuth (`mode: 'fresh'`)                                                          |
| `01-shell.cy.ts`               | Dashboard, 404, theme                                                                 |
| `02-todos.cy.ts`               | Org-scoped todos                                                                      |
| `03-onboarding.cy.ts`          | Open Google sign-in joins first org, optional invites, activation                     |
| `04-tenants.cy.ts`             | Org settings, platform admin panel                                                    |
| `05-permissions.cy.ts`         | Role permission matrix                                                                |
| `06-tenant-isolation.cy.ts`    | Cross-Organization isolation                                                          |
| `07-platform-org-switch.cy.ts` | Platform Admin org switcher                                                           |
| `08-form.cy.ts`                | Dev form page — fields, combobox/multi-select, validation, calendar date, file upload |

## Personas

Use `cy.login('orgAdmin')` etc. Personas and emails: `cypress/support/personas.ts` and seeded fixture context.

## Typecheck

```bash
pnpm run typecheck:cypress
```

Included in `pnpm run check` (along with format, lint, and client/convex typecheck).

## Related

- [environment.md](./environment.md) — `RESEND_EMULATE_URL`
- [onboarding.md](./onboarding.md) — flows under test in `03-onboarding.cy.ts`
