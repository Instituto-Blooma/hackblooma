# Domain Docs

How engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- **[AGENTS.md](../../AGENTS.md)** — inline domain vocabulary for the template
- **[docs/adr/](../adr/)** — read ADRs that touch the area you're about to work in

Forks may run `/grill-with-docs` to create a root `CONTEXT.md` glossary with product-specific language. On Hackblooma, every interview question follows [audience.md](./audience.md).

## File structure

```text
/
├── AGENTS.md          # Inline vocabulary + agent orientation
├── docs/adr/
│   └── 0001-b2b-tenancy-and-platform-admin.md
└── convex/            ← implementation (not domain glossary)
```

## Use the template vocabulary

When output names a domain concept (issue title, refactor proposal, test name), use the terms defined in AGENTS.md. Don't drift to synonyms the template avoids (e.g. "tenant" for Organization).

If the concept you need isn't covered yet, either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR 0001 (B2B tenancy) — worth reopening because…_

## Extending the glossary

Use the `/grill-with-docs` skill. It can create or extend `CONTEXT.md` one term at a time and offers ADRs only for hard-to-reverse trade-offs. See [.agents/skills/grill-with-docs/CONTEXT-FORMAT.md](../../.agents/skills/grill-with-docs/CONTEXT-FORMAT.md) and [audience.md](./audience.md). Write glossary definitions in everyday language.
