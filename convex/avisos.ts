import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { requireUserId, resolveActingUserId } from './lib/auth';
import { createAviso } from './lib/avisos';
import { dueAvisos, todayInBrasilia } from './lib/olimpiadas';
import { loadPhases } from './olimpiadas';

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return [];
    }
    const avisos = await ctx.db
      .query('avisos')
      .withIndex('by_user_and_createdAt', (q) => q.eq('userId', userId))
      .order('desc')
      .take(30);
    return avisos.map((aviso) => ({
      _id: aviso._id,
      kind: aviso.kind,
      olympiadId: aviso.olympiadId,
      title: aviso.title,
      body: aviso.body,
      createdAt: aviso.createdAt,
      read: Boolean(aviso.readAt),
    }));
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const avisos = await ctx.db
      .query('avisos')
      .withIndex('by_user_and_createdAt', (q) => q.eq('userId', userId))
      .order('desc')
      .take(30);
    const now = Date.now();
    for (const aviso of avisos) {
      if (!aviso.readAt) {
        await ctx.db.patch(aviso._id, { readAt: now });
      }
    }
    return null;
  },
});

/** Daily sweep over every Participação of this and next Temporada. */
export const runDaily = internalMutation({
  args: { today: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const today = args.today ?? todayInBrasilia(Date.now());
    const year = Number(today.slice(0, 4));
    let created = 0;
    for (const season of [year, year + 1]) {
      for (const status of ['planned', 'registered'] as const) {
        const participations = await ctx.db
          .query('participations')
          .withIndex('by_season_and_status', (q) => q.eq('season', season).eq('status', status))
          .take(5000);
        for (const participation of participations) {
          const olympiad = await ctx.db.get(participation.olympiadId);
          if (!olympiad) {
            continue;
          }
          const [phases, results] = await Promise.all([
            loadPhases(ctx, olympiad._id),
            ctx.db
              .query('results')
              .withIndex('by_user_and_olympiad', (q) =>
                q.eq('userId', participation.userId).eq('olympiadId', olympiad._id)
              )
              .take(10),
          ]);
          const due = dueAvisos({
            today,
            olympiad,
            participationStatus: participation.status,
            phases,
            results,
          });
          for (const aviso of due) {
            const id = await createAviso(ctx, {
              userId: participation.userId,
              kind: aviso.kind,
              olympiadId: olympiad._id,
              phaseId: aviso.phaseId ? phases.find((p) => p._id === aviso.phaseId)?._id : undefined,
              title: aviso.title,
              body: aviso.body,
              dedupeKey: aviso.dedupeKey,
            });
            if (id) created += 1;
          }
        }
      }
    }
    return created;
  },
});

export const getDeliveryPayload = internalQuery({
  args: { avisoId: v.id('avisos') },
  handler: async (ctx, args) => {
    const aviso = await ctx.db.get(args.avisoId);
    if (!aviso) {
      return null;
    }
    const user = await ctx.db.get(aviso.userId);
    const subscriptions = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_user', (q) => q.eq('userId', aviso.userId))
      .take(20);
    return {
      email: user?.email ?? null,
      name: user?.name ?? null,
      title: aviso.title,
      body: aviso.body,
      path: `/olimpiadas/${aviso.olympiadId}`,
      subscriptions: subscriptions.map((sub) => ({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      })),
    };
  },
});

export const removeExpiredSubscription = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
