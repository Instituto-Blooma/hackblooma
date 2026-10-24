import { ConvexPresence } from '@talentum-ventures/convex-presence';
import { v } from 'convex/values';
import { components } from './_generated/api';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import { resolveActingUserId } from './lib/auth';
import {
  parseOrganizationIdFromDocumentId,
  requireDocumentCollabAccess,
  requireRoomCollabAccess,
} from './lib/collabAccess';

const { sync, presence } = new ConvexPresence(components.convexPresence).mount({
  checkRead: async (ctx, scope) => {
    if (scope.documentId) {
      await requireDocumentCollabAccess(ctx as unknown as QueryCtx, scope.documentId);
    }
    if (scope.room) {
      await requireRoomCollabAccess(ctx as unknown as QueryCtx, scope.room);
    }
  },
  checkWrite: async (ctx, scope) => {
    if (scope.documentId) {
      await requireDocumentCollabAccess(ctx as unknown as MutationCtx, scope.documentId);
    }
    if (scope.room) {
      await requireRoomCollabAccess(ctx as unknown as MutationCtx, scope.room);
    }
  },
});

export const { pull, push, snapshot, init } = sync;
export const { update, heartbeat } = presence;

type PresenceEntry = {
  sessionId: string;
  userId: string;
  data: unknown;
  updated: number;
};

const presenceEntryValidator = v.object({
  sessionId: v.string(),
  userId: v.string(),
  data: v.any(),
  updated: v.number(),
});

export const list = query({
  args: {
    room: v.string(),
    now: v.number(),
  },
  returns: v.array(presenceEntryValidator),
  handler: async (ctx, args): Promise<PresenceEntry[]> => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return [];
    }
    await requireRoomCollabAccess(ctx, args.room);
    return (await ctx.runQuery(components.convexPresence.presence.list, args)) as PresenceEntry[];
  },
});

/**
 * Best-effort leave: logout/unmount often races auth teardown. If the client is
 * already signed out, succeed without touching the component so callers (and
 * Cypress) do not see an unhandled "Not authenticated" rejection.
 */
export const disconnect = mutation({
  args: {
    room: v.string(),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    await requireRoomCollabAccess(ctx, args.room);
    await ctx.runMutation(components.convexPresence.presence.disconnect, args);
    return null;
  },
});

export const getSyncHead = query({
  args: {
    documentId: v.string(),
  },
  returns: v.object({
    version: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return { version: 0 };
    }
    await requireDocumentCollabAccess(ctx, args.documentId);
    const result: { version: number } = await ctx.runQuery(components.convexPresence.sync.pull, {
      documentId: args.documentId,
      sinceVersion: 0,
    });
    return { version: result.version };
  },
});

export const getMarkdownSnapshot = query({
  args: {
    documentId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      markdown: v.string(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return null;
    }
    await requireDocumentCollabAccess(ctx, args.documentId);
    const row = await ctx.db
      .query('collabMarkdown')
      .withIndex('by_documentId', (q) => q.eq('documentId', args.documentId))
      .unique();
    if (!row) {
      return null;
    }
    return {
      markdown: row.markdown,
      updatedAt: row.updatedAt,
    };
  },
});

export const saveMarkdownSnapshot = mutation({
  args: {
    documentId: v.string(),
    markdown: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireDocumentCollabAccess(ctx, args.documentId);
    const organizationId = parseOrganizationIdFromDocumentId(args.documentId);
    const existing = await ctx.db
      .query('collabMarkdown')
      .withIndex('by_documentId', (q) => q.eq('documentId', args.documentId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        markdown: args.markdown,
        updatedAt: now,
        updatedBy: userId,
      });
      return null;
    }
    await ctx.db.insert('collabMarkdown', {
      organizationId,
      documentId: args.documentId,
      markdown: args.markdown,
      updatedAt: now,
      updatedBy: userId,
    });
    return null;
  },
});
