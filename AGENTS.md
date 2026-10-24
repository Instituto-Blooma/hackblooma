# Agent orientation

**Hackblooma** — Instituto Blooma product built on the **convexplate** B2B foundation (Organizations, provisioned onboarding, org-scoped authorization, and Platform Admin tooling).

## First tasks on a new fork

1. Run setup — see [SETUP.md](./SETUP.md) (`pnpm run setup`, then `pnpm run dev:all` locally).
2. Run `/grill-with-docs` to replace example terms (Acme, example.com emails) with your product language and create a domain glossary if needed.
3. Follow [docs/customization.md](./docs/customization.md) for production env and demo cleanup.

## Domain vocabulary

Use these terms in issue titles, plans, and user-facing copy. Do not introduce synonyms the template avoids.

| Term                     | Meaning                                                                          | Avoid                                        |
| ------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------- |
| **Organization**         | B2B customer company — primary data-isolation boundary                           | tenant, workspace, account (for the company) |
| **User**                 | Person identified by email at provisioning; linked to Google OAuth at activation | member (when meaning the person)             |
| **Provisioning**         | Creating a User + org Membership before first sign-in                            | invite (as the provisioning act)             |
| **Activation**           | User completes onboarding — accepts Invitation, signs in, gains access           | sign-up, registration                        |
| **Invitation**           | Email with link to accept membership; distinct from onboarding lifecycle         | invite (as noun for the User record)         |
| **Onboarding lifecycle** | `pending` → `invited` → `active`                                                 | account status, user state                   |
| **Member**               | User's membership in an Organization with a role                                 | user (when meaning the relationship)         |
| **Platform Admin**       | Startup operator with cross-org access via allowlist + global authz role         | superadmin, god user                         |

Read [docs/adr/](./docs/adr/) before changing tenancy, onboarding, or platform admin behavior.

## Documentation map

| Doc                                                          | Purpose                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| [docs/README.md](./docs/README.md)                           | Full documentation index                                           |
| [docs/architecture.md](./docs/architecture.md)               | Modules, routes, auth model                                        |
| [docs/updating-downstream.md](./docs/updating-downstream.md) | Port this template into forks; maintain `.convexplate-last-commit` |
| [docs/adr/](./docs/adr/)                                     | Architectural decisions                                            |
| [cypress/README.md](./cypress/README.md)                     | E2E test harness                                                   |

Bundled agent skills live in [`.agents/skills/`](./.agents/skills/) (grill-with-docs, tdd, triage, diagnose, shadcn, etc.).

## Conventions for agents

- Prefer extending existing `convex/lib/*` helpers over duplicating provisioning or auth logic.
- Read ADRs before changing tenancy, onboarding, or platform admin behavior.
- **UI / shadcn**: read [docs/frontend.md](./docs/frontend.md) and the [shadcn skill](./.agents/skills/shadcn/SKILL.md) before UI work. Use `@/components/ui/*` primitives, sonner for toast, TanStack Form + shared Zod schemas for forms. Do not edit the vendored shadcn skill — update the bridge doc instead.
- **Updating a fork from this template**: use the [update-downstream skill](./.agents/skills/update-downstream/SKILL.md) and [docs/updating-downstream.md](./docs/updating-downstream.md). Read the downstream `.convexplate-last-commit` as the baseline, port changes surgically, then write that file with the applied convexplate commit hash.

## Agent skills

### Issue tracker

Issues for this template repo use **GitHub Issues** (`gh` CLI). See [docs/agents/issue-tracker.md](./docs/agents/issue-tracker.md). Forks may replace this when customizing.

### Triage labels

Canonical triage role → label mapping. See [docs/agents/triage-labels.md](./docs/agents/triage-labels.md).

### Domain docs

Vocabulary in this file + decisions in `docs/adr/`. See [docs/agents/domain.md](./docs/agents/domain.md). Forks may run `/grill-with-docs` to create a `CONTEXT.md` glossary.

### Downstream updates

Port this template into forks with [/update-downstream](./.agents/skills/update-downstream/SKILL.md). See [docs/updating-downstream.md](./docs/updating-downstream.md).

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
