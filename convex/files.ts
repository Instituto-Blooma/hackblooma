import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id('_storage') },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
