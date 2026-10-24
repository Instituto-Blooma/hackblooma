# ADR 0002: Yjs collaboration and org-scoped presence

## Status

Accepted

## Context

The template needed a markdown rich-text form field and an opt-in real-time collaborative editor, plus a single presence channel for DataTable collaborator cursors. Transport must stay on Convex (no separate WebSocket server) and must respect Organization isolation.

## Decisions

### Transport

- Use `@talentum-ventures/convex-presence` for Yjs document sync, presence-with-data, and the `CollabProvider` adapter.
- Mount the component in `convex/convex.config.ts` and re-export its APIs from `convex/collab.ts` with host-side `checkRead` / `checkWrite` gates.

### Source of truth

- Collaborative editors treat the **Yjs document** as authoritative.
- The app stores an **eventually-consistent markdown snapshot** (`collabMarkdown` table via `saveMarkdownSnapshot`) for server reads, search, and non-collab consumers.

### Tenancy

- Document ids are namespaced: `org:{organizationId}:doc:{slug}`.
- DataTable presence rooms are namespaced: `org:{organizationId}:table:{tableId}`.
- Collab doc presence rooms follow the library convention `doc:{documentId}` (still org-scoped because `documentId` embeds the org).
- Cross-org ids/rooms are rejected; callers must be org members (or platform admins).

### Editor integration

- Form mode: controlled MDXEditor markdown string via `form.fields.RichText`.
- Collab mode: `LexicalCollabBinding` from `@talentum-ventures/convex-presence/lexical`, injected through MDXEditor `addComposerChild$`, fed by `useCollabDoc` from the presence library. App code does not import `yjs` or `@lexical/yjs` directly.

### Form-mode MDXEditor caret contract

- Form-mode MDXEditor is **write-through** while focused: parent state updates via `onChange` only.
- Do **not** call `setMarkdown` for local echoes (e.g. MDX export trailing newlines vs trimmed form state). `setMarkdown` while focused clears the Lexical root and jumps the caret to the start.
- Inbound `value` → `setMarkdown` only when the editor is **unfocused** (and the trimmed markdown actually changed), including a sync on blur for external updates that arrived during the edit.
- Collab mode stays on Yjs and does not use this controlled prop loop.

### DataTable presence

- Dashboard presence uses the same presence channel through `useDatatablePresenceBridge`, preserving the `useConvexPresence` / collaborators contract.
- The previous `@talentum-ventures/convex-datatable` presence handlers and `presence` table are retired.

## Consequences

- Collab markdown snapshots may briefly lag live Yjs state.
- MDXEditor collab via `addComposerChild$` is an unofficial extension point — pin MDXEditor and keep a regression path on `/dev/richtext-collab`.
- New collaborative features must use org-scoped document/room helpers in `convex/lib/collabIds.ts`.
- Non-collab `form.fields.RichText` surfaces share the form-mode caret contract above (`/dev/form` is the smoke path).

## See also

- [Frontend](../frontend.md) — `form.fields.RichText` and demo routes
- [Spec](../specs/convex-presence-fork.md) — library capabilities
