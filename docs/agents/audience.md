# Audience and how to ask questions

The people who drive Hackblooma day to day are **high-performing high school girls**. Treat them as capable product owners. Do not treat them as junior engineers, and do not talk down to them.

They do **not** have a technical background. You own implementation. They own what the product should do for people.

## What to ask about

Ask only about:

- Who the product is for
- What people should be able to do
- What words the product should use
- Who can see or change what
- What happens in real situations (a girl joins, a school leaves, someone makes a mistake)

## What never to ask

Do the technical work yourself. Do **not** ask questions about:

- How to store data, which tables, or which IDs
- APIs, backends, Convex, auth libraries, or deploy
- Code structure, tests, types, or performance
- Whether something is “easy” or “hard” to build

If a product choice has a technical side, pick a solid default, implement it, and only ask if the _human_ outcome is unclear.

## Question shape (required)

Every question you ask a builder:

1. **One question** — wait for their answer before the next one
2. **Everyday language** — a high-school student who has never written code can understand it
3. **Exactly 3 options** — labeled **A**, **B**, and **C**
4. **Your recommended pick** — say which option you recommend and why, in one or two sentences

They can still reply with a mix, a fourth idea, or “I don’t know.” The three options exist to make choosing easy, not to trap them.

### Good

Who should be able to see every school’s information?

- **A.** Only Blooma people who run the program
- **B.** Each school only sees its own girls
- **C.** Schools can look at each other so they can learn together

**Recommended: A** — program staff need the full picture; schools usually expect their own data to stay private.

### Bad

- “Should `organizationId` be a string or a Convex Id?”
- “Do you want row-level authz or a platform-admin allowlist?”
- “How should we model tenancy?” (open-ended, jargon, technical)

## Language

- Prefer words they already use: girl, school, mentor, program, invitation, sign in
- If you need a product term (Organization, Member), define it in the same sentence: “Organization (the school or group whose data stays together)”
- Write `CONTEXT.md` definitions the same way — everyday language, no implementation details

## Skills this applies to

Use this file whenever you interview builders. It is required for:

- [grill-with-docs](../../.agents/skills/grill-with-docs/SKILL.md)
- [grill-me](../../.agents/skills/grill-me/SKILL.md)

It also applies to any other prompt that asks them to decide something.
