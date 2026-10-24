# Build `@talentum-ventures/convex-presence`

> Standalone implementation spec. This document is self-contained: it assumes no prior
> conversation and no access to any other repository. Build the package described here in a
> fresh repo and publish it to npm as `@talentum-ventures/convex-presence`.

## 1. What you are building

A reusable **Convex component** (and npm package) that provides real-time collaboration primitives over a Convex backend, with **no WebSocket server** required. It has three editor-agnostic capabilities:

1. **Yjs document sync** — persist and synchronize a Yjs `Y.Doc` (a CRDT) across clients through Convex reactive queries/mutations. (This is a hardened fork of the community library `y-convex`.)
2. **Presence-with-data channel** — a generic, room-scoped ephemeral state channel: each client publishes a small JSON blob (e.g. cursor position, selection, active cell, display name, color), and every client in the room reactively receives the others' blobs. Includes heartbeat + automatic timeout of disconnected clients.
3. **Yjs `Provider` adapter** — a thin object implementing the interface Yjs editors expect (notably the one required by editor bindings such as Lexical's `CollaborationPlugin` and Tiptap's collaboration extension): it owns a `Y.Doc` synced via capability 1 and a [`y-protocols`](https://github.com/yjs/y-protocols) `Awareness` instance whose updates are transported over capability 2.

The package **core** (`/` + `/react`) is **editor-agnostic** in API terms: no Lexical/ProseMirror/MDXEditor types in the core public surface. Editors integrate via the exported provider/hooks. An optional `/lexical` export ships `LexicalCollabBinding`; the Lexical stack and `yjs` are package dependencies so hosts need not list them.

### Background you need (since you have no other context)

- **Convex components** are sandboxed mini-backends: they define their own tables and functions via `defineComponent`, and are installed by a host app with `app.use(...)` in `convex.config.ts`. A component **cannot read the host app's tables** and **cannot perform the host's auth**. Therefore: this component exposes a **class-based server API** (similar to Convex's official `@convex-dev/prosemirror-sync` and `@convex-dev/presence` components) whose methods are called from the host app's own `query`/`mutation`/`action` functions, where the host performs authentication/authorization. Authorization and multi-tenant scoping are the **host's responsibility**; this package only provides the mechanism and string-keyed rooms/documents.
- **Yjs** (`yjs`) is a CRDT library; a document is a `Y.Doc`. Changes are exchanged as binary `update` byte arrays and are commutative/idempotent, so order-independent merge is automatic. New clients can be seeded from the concatenation of all updates, or from a periodic compacted **snapshot** plus subsequent updates.
- **`y-protocols/awareness`** provides an `Awareness` class for ephemeral per-client state (cursors/presence). `encodeAwarenessUpdate(awareness, clientIDs)` produces a binary update; `applyAwarenessUpdate(awareness, update, origin)` applies a remote one. This is the standard transport-agnostic way to move cursor data; we move it over capability 2.

## 2. Package layout

```
convex-presence/
  package.json
  tsconfig.json
  src/
    component/
      convex.config.ts        # defineComponent("convexPresence")
      schema.ts               # component-owned tables
      yjs.ts                  # Yjs sync functions (push/pull/snapshot/init)
      presence.ts             # presence-with-data functions (update/heartbeat/list/disconnect)
    client/
      index.ts                # public client exports
      useYDoc.ts              # creates a Y.Doc + Convex sync
      ConvexProvider.ts       # Yjs Provider adapter (doc-sync + awareness over presence)
      usePresence.ts          # generic presence-with-data React hook
      awareness.ts            # encode/decode helpers bridging Awareness <-> presence data
      singleFlight.ts         # single-flight mutation helper
    server/
      index.ts                # ConvexPresence class (host-side API + syncApi())
  example/                    # runnable Convex + Vite example app
  README.md
```

Publish with an `exports` map exposing at least: `@talentum-ventures/convex-presence` (server class + `convex.config`), `@talentum-ventures/convex-presence/react` (client hooks/provider), and optionally `@talentum-ventures/convex-presence/lexical` (Lexical binding). Ship ESM + types.

## 3. Server: component tables

Define component-owned tables (host app never sees them):

- `documents`: `{ id: string }` plus bookkeeping (`createdAt`). `id` is the caller-supplied document key. Index `by_id`.
- `deltas`: Yjs updates. `{ documentId: Id<"documents">, version: number, update: bytes }`. Index `by_doc_version` on `["documentId","version"]`. Store `update` as `v.bytes()`.
- `snapshots`: compacted state. `{ documentId, version: number, snapshot: bytes, createdAt }`. Index `by_doc_version`.
- `presence`: `{ room: string, sessionId: string, userId: string, data: <JSON>, updated: number, expires: number }`. Indexes: `by_room` on `["room"]`, `by_room_session` on `["room","sessionId"]`, and `by_expires` on `["expires"]` for cleanup.

Use `v.bytes()` for binary; keep individual documents/deltas under Convex's 1 MB value limit (compact to snapshots before that).

## 4. Server: Yjs sync functions (fork of y-convex)

Provide functions (exposed via the class in §6) implementing the standard append-log + snapshot model:

- `pull(documentId, sinceVersion)` → returns `{ snapshot?, deltas: bytes[], version }`. If `sinceVersion` is `null`/`0`, include the latest snapshot (if any) and all deltas after it.
- `push(documentId, updates: bytes[], baseVersion)` → append updates as new `deltas` with incrementing `version`; return the new head `version`. Must be safe under concurrent appends (allocate version inside the mutation; never trust client version blindly for ordering — appends are commutative so any consistent total order is fine).
- `snapshot(documentId, snapshot: bytes, version)` → write a compacted snapshot and (optionally) delete superseded deltas. Snapshotting is triggered client-side when idle and the local client made the last change (debounced), mirroring prosemirror-sync's approach.
- `init(documentId, initialSnapshot?)` → create the document row if absent; optionally seed an initial snapshot. Idempotent.

Correctness requirements you own (this is the risky part of forking a CRDT lib):

- Deltas are append-only and never mutated.
- Version numbers are strictly increasing per document and allocated server-side.
- Snapshot + post-snapshot deltas always reconstruct the full state; never delete a delta unless it is provably included in a stored snapshot.
- Garbage-collect old snapshots/deltas only behind an explicit retention call.

## 5. Server: presence-with-data functions

- `update(room, sessionId, userId, data, intervalMs)` → upsert the caller's presence row keyed by `(room, sessionId)`; set `updated = now`, `expires = now + 2.5 * intervalMs`. `data` is arbitrary JSON (`v.any()` at the component boundary; the React layer is generically typed).
- `heartbeat(room, sessionId, intervalMs)` → bump `updated`/`expires` without changing `data`.
- `list(room)` → return all non-expired rows for the room: `{ sessionId, userId, data, updated }[]`. Filter expired by `expires > now`.
- `disconnect(room, sessionId)` → delete the caller's row (called via `navigator.sendBeacon`/`onbeforeunload` and on unmount).
- A scheduled/cron cleanup (or lazy cleanup inside `list`) removes rows past `expires` using the `by_expires` index so idle rooms cost nothing.

Efficiency target: one moving client should invalidate the room's `list` query once, shared by all peers; idle rooms must be idle (no polling).

## 6. Server: the host-facing class

Export a class so the host can mount auth around it (the component cannot auth itself):

```ts
// @talentum-ventures/convex-presence
import { ConvexPresence } from '@talentum-ventures/convex-presence';
import { components } from './_generated/api';

const cp = new ConvexPresence(components.convexPresence);

// Host re-exports thin wrappers and adds its own auth + room/doc scoping:
export const { pull, push, snapshot, init } = cp.yjsApi(); // doc sync
export const { update, heartbeat, list, disconnect } = cp.presenceApi(); // presence
```

`yjsApi()` / `presenceApi()` return objects of Convex function builders the host re-exports from a `convex/*.ts` file. Each builder accepts an optional `checkRead` / `checkWrite` async callback `(ctx, { documentId | room }) => void` so the host can throw on unauthorized access. Document this clearly: **without host-provided checks, documents/rooms are world-accessible to authenticated app users.**

## 7. Client: exports

All under `@talentum-ventures/convex-presence/react`. Requires a `ConvexProvider`/`ConvexReactClient` in the tree.

### `usePresence` (generic, editor-agnostic)

```ts
function usePresence<T extends Record<string, unknown>>(
  api: PresenceApi, // reference to host-exported presence functions
  room: string,
  user: { userId: string; sessionId?: string },
  data: T,
  opts?: { heartbeatMs?: number }
): readonly [T, Array<{ userId: string; sessionId: string; data: T }>, (patch: Partial<T>) => void];
```

Behavior: single-flight `update` on data change; `setInterval` heartbeat; `disconnect` via `sendBeacon` on `pagehide`/`beforeunload` and on unmount; excludes the local session from the returned peer list. `sessionId` defaults to a per-tab random id.

### `useYDoc` + `ConvexProvider` (Yjs)

```ts
function useConvexYjsProvider(opts: {
  yjsApi: YjsApi; // host-exported pull/push/snapshot/init
  presenceApi: PresenceApi; // host-exported presence functions (carries awareness)
  documentId: string;
  user: { userId: string; name: string; color?: string; sessionId?: string };
}): { doc: Y.Doc; provider: ConvexYjsProvider };
```

`ConvexYjsProvider` must implement the minimum interface Yjs editor bindings consume:

- `awareness: Awareness` (a real `y-protocols` `Awareness` over `doc`).
- `connect()` / `disconnect()` (idempotent; manage subscriptions).
- `on(event, cb)` / `off(event, cb)` for at least `'sync'` (emit `true` once the initial `pull` completes) and `'status'`.
- Internally: subscribe to the host's `pull` query → apply remote deltas/snapshot into `doc`; observe local `doc` updates → batch + `push`; observe local `awareness` updates → `encodeAwarenessUpdate` → write into the presence channel via `usePresence`'s `update`/its imperative equivalent; subscribe to peers' presence rows → `applyAwarenessUpdate` so remote cursors appear; debounce + trigger `snapshot` when idle and locally last-edited.

Keep editor bindings out: the consumer passes `provider`/`doc` to their editor's collaboration plugin themselves.

### `awareness.ts`

Helpers: `awarenessToPresenceData(awareness, clientID)` → base64/array-encoded update suitable for JSON storage; `applyPresenceDataToAwareness(awareness, data, origin)`; and removal handling when a peer's presence row disappears (call `removeAwarenessStates`).

## 8. Peer dependencies / deps

- Peer: `convex`, `react`. Runtime deps: `yjs`, `y-protocols` (or `@y/protocols`). Optional `/lexical` adapter may ship `lexical`, `@lexical/react`, and `@lexical/yjs` as package dependencies.
- Core has no editor packages. No lodash (avoid the dependency-bloat criticisms levelled at prior community attempts). No `child_process`, no network calls beyond Convex, no install lifecycle scripts.

## 9. Quality bar

- TypeScript strict; no `any` in public types (the component boundary may use `v.any()` for `data`, but the React layer is generic `<T>`).
- ESLint with `@convex-dev/eslint-plugin`; await all promises; argument + return validators on every public Convex function.
- Unit tests for the CRDT log (convergence of two docs after interleaved pushes; snapshot+delta reconstruction; concurrent push version allocation) and presence (expiry, peer exclusion, single-flight coalescing).
- A runnable `example/` app: two browser tabs editing one `Y.Doc` and showing each other's cursors via awareness — proving capabilities 1–3 without any editor-specific plugin.
- Semantic-versioned, `exports`-mapped, ESM + `.d.ts`. No postinstall scripts.

## 10. Acceptance criteria

1. `app.use` the component, re-export `yjsApi()`/`presenceApi()` from a host `convex/*.ts`, and the example app converges two concurrent editors with live cursors.
2. `usePresence` works standalone (no Yjs) for arbitrary room data (e.g. a cursor demo), since non-Yjs consumers depend on this directly.
3. Reconnect/refresh: a late-joining client reconstructs full document state from snapshot + deltas.
4. Idle rooms perform no recurring server work; disconnected clients disappear within ~2.5x the heartbeat interval.
5. Clean `pnpm audit`/SCA, no lifecycle scripts, pinned/locked deps.
